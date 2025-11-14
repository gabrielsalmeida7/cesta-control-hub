import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type {
  Tables,
  TablesInsert,
  TablesUpdate
} from "@/integrations/supabase/types";

type Delivery = Tables<"deliveries">;
type DeliveryInsert = TablesInsert<"deliveries">;
type DeliveryUpdate = TablesUpdate<"deliveries">;

export const useDeliveries = (institutionId?: string) => {
  return useQuery({
    queryKey: ["deliveries", institutionId],
    queryFn: async () => {
      let query = supabase
        .from("deliveries")
        .select(
          `
          *,
          family:family_id(
            id,
            name,
            contact_person,
            members_count,
            is_blocked,
            blocked_until,
            block_reason,
            blocked_by_institution:blocked_by_institution_id(name)
          ),
          institution:institution_id(
            id,
            name,
            address,
            phone
          )
        `
        )
        .order("delivery_date", { ascending: false });

      if (institutionId) {
        query = query.eq("institution_id", institutionId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
    enabled: true
  });
};

export const useCreateDelivery = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (delivery: DeliveryInsert) => {
      // Validar entrega antes de inserir usando função do backend
      const { data: validationResult, error: validationError } = await supabase
        .rpc('validate_delivery', {
          p_family_id: delivery.family_id,
          p_institution_id: delivery.institution_id,
          p_blocking_justification: (delivery as any).blocking_justification || null
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
      const { data, error } = await supabase
        .from("deliveries")
        .insert(delivery)
        .select(
          `
          *,
          family:family_id(
            id,
            name,
            contact_person,
            members_count,
            is_blocked,
            blocked_until,
            block_reason,
            blocked_by_institution:blocked_by_institution_id(name)
          ),
          institution:institution_id(
            id,
            name,
            address,
            phone
          )
        `
        )
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['institution-deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['admin-recent-deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['deliveries-by-institution'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['families'] });
      queryClient.invalidateQueries({ queryKey: ['institution-families'] });
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
    }
  });
};

export const useUpdateDelivery = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      updates
    }: {
      id: string;
      updates: DeliveryUpdate;
    }) => {
      const { data, error } = await supabase
        .from("deliveries")
        .update(updates)
        .eq("id", id)
        .select(
          `
          *,
          family:family_id(
            id,
            name,
            contact_person,
            members_count,
            is_blocked,
            blocked_until,
            block_reason,
            blocked_by_institution:blocked_by_institution_id(name)
          ),
          institution:institution_id(
            id,
            name,
            address,
            phone
          )
        `
        )
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['institution-deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['admin-recent-deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['deliveries-by-institution'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: "Sucesso",
        description: "Entrega atualizada com sucesso!"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar entrega: " + error.message,
        variant: "destructive"
      });
    }
  });
};

export const useDeleteDelivery = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("deliveries").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['institution-deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['admin-recent-deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['deliveries-by-institution'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: "Sucesso",
        description: "Entrega excluída com sucesso!"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao excluir entrega: " + error.message,
        variant: "destructive"
      });
    }
  });
};
