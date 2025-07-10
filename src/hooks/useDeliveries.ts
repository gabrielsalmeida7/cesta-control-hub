
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Delivery = Tables<'deliveries'>;
type DeliveryInsert = TablesInsert<'deliveries'>;
type DeliveryUpdate = TablesUpdate<'deliveries'>;

export const useDeliveries = () => {
  return useQuery({
    queryKey: ['deliveries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          family:families(name, contact_person),
          institution:institutions(name),
          delivered_by:delivered_by_user_id(profiles(full_name))
        `)
        .order('delivery_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
};

export const useInstitutionDeliveries = (institutionId?: string) => {
  return useQuery({
    queryKey: ['institution-deliveries', institutionId],
    queryFn: async () => {
      if (!institutionId) return [];
      
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          family:families(name, contact_person),
          institution:institutions(name),
          delivered_by:delivered_by_user_id(profiles(full_name))
        `)
        .eq('institution_id', institutionId)
        .order('delivery_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!institutionId,
  });
};

export const useCreateDelivery = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (delivery: Omit<DeliveryInsert, 'delivered_by_user_id'>) => {
      const { data, error } = await supabase
        .from('deliveries')
        .insert({
          ...delivery,
          delivered_by_user_id: user?.id || null,
        })
        .select()
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
        description: "Entrega registrada com sucesso! A família foi automaticamente bloqueada.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao registrar entrega: " + error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateDelivery = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: DeliveryUpdate }) => {
      const { data, error } = await supabase
        .from('deliveries')
        .update(updates)
        .eq('id', id)
        .select()
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
        description: "Entrega atualizada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar entrega: " + error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteDelivery = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('deliveries')
        .delete()
        .eq('id', id);
      
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
        description: "Entrega excluída com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao excluir entrega: " + error.message,
        variant: "destructive",
      });
    },
  });
};
