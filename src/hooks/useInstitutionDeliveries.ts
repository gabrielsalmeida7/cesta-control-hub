import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getCurrentDateBrasilia } from '@/utils/dateFormat';

export const useInstitutionDeliveries = (startDate?: string, endDate?: string) => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['institution-deliveries', profile?.institution_id, startDate, endDate],
    queryFn: async () => {
      if (!profile?.institution_id) return [];

      let query = supabase
        .from('deliveries')
        .select(`
            id,
            delivery_date,
            blocking_period_days,
            notes,
            blocking_justification,
            family:families(
              id,
              name,
              contact_person
            ),
            stock_movements:stock_movements(
              id,
              product_id,
              quantity,
              product:products(
                id,
                name,
                unit
              )
            )
        `)
        .eq('institution_id', profile.institution_id)
        .order('delivery_date', { ascending: false });

      // Aplicar filtros de data apenas se ambos estiverem preenchidos
      // Se estiverem vazios, retornar todas as entregas
      if (startDate && startDate.trim() !== '') {
        query = query.gte('delivery_date', startDate);
      }
      
      if (endDate && endDate.trim() !== '') {
        query = query.lte('delivery_date', endDate);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Error fetching institution deliveries:', error);
        throw error;
      }
      
      console.log('✅ Institution deliveries fetched:', data?.length || 0, 'records');
      return data || [];
    },
    enabled: !!profile?.institution_id,
  });
};

interface CreateDeliveryData {
  family_id: string;
  blocking_period_days: number;
  notes?: string;
  blocking_justification?: string;
}

export const useCreateDelivery = () => {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateDeliveryData) => {
      if (!profile?.institution_id) throw new Error('Institution not found');

      // Validar entrega antes de inserir usando função do backend
      const { data: validationResult, error: validationError } = await supabase
        .rpc('validate_delivery', {
          p_family_id: data.family_id,
          p_institution_id: profile.institution_id,
          p_blocking_justification: data.blocking_justification || null
        });

      if (validationError) {
        throw validationError;
      }

      // Verificar resultado da validação
      if (validationResult && typeof validationResult === 'object') {
        const validation = validationResult as any;
        if (!validation.valid) {
          // Se erro é de justificativa obrigatória, não mostrar toast genérico
          if (validation.error === 'BLOCKING_JUSTIFICATION_REQUIRED') {
            const error = new Error(validation.message || 'Justificativa obrigatória');
            (error as any).validationError = validation.error;
            (error as any).requiresJustification = true;
            throw error;
          }
          
          // Criar erro customizado com mensagem do backend
          const error = new Error(validation.message || 'Validação falhou');
          (error as any).validationError = validation.error;
          (error as any).blockedByInstitutionName = validation.blocked_by_institution_name;
          (error as any).blockedUntil = validation.blocked_until;
          throw error;
        }
      }

      // Se validação passou, inserir entrega
      const { data: delivery, error } = await supabase
        .from('deliveries')
        .insert({
          family_id: data.family_id,
          institution_id: profile.institution_id,
          blocking_period_days: data.blocking_period_days,
          delivered_by_user_id: user?.id || null,
          notes: data.notes,
          blocking_justification: data.blocking_justification || null,
          delivery_date: getCurrentDateBrasilia(),
        })
        .select()
        .single();

      if (error) throw error;
      return delivery;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institution-deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['families'] });
      queryClient.invalidateQueries({ queryKey: ['institution-families'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: "Sucesso",
        description: "Entrega registrada com sucesso!"
      });
    },
    onError: (error: any) => {
      // Tratar erros específicos de validação
      if (error.validationError === 'FAMILY_BLOCKED') {
        const institutionName = error.blockedByInstitutionName || "outra instituição";
        const blockedUntil = error.blockedUntil ? new Date(error.blockedUntil).toLocaleDateString('pt-BR') : "data não definida";
        toast({
          title: "Família Bloqueada",
          description: `Esta família já foi atendida pela instituição ${institutionName}. Não é possível realizar nova entrega até ${blockedUntil}.`,
          variant: "destructive"
        });
      } else if (error.validationError === 'FAMILY_NOT_ASSOCIATED') {
        toast({
          title: "Família Não Vinculada",
          description: error.message || "Esta família não está vinculada à sua instituição. Por favor, vincule a família primeiro.",
          variant: "destructive"
        });
      } else if (error.validationError === 'FAMILY_NOT_FOUND') {
        toast({
          title: "Família Não Encontrada",
          description: error.message || "Família não encontrada.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erro",
          description: error.message || "Erro ao registrar entrega. Tente novamente.",
          variant: "destructive"
        });
      }
    },
  });
};