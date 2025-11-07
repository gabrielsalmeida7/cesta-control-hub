import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
          family:families(
            id,
            name,
            contact_person
          )
        `)
        .eq('institution_id', profile.institution_id)
        .order('delivery_date', { ascending: false });

      if (startDate) {
        query = query.gte('delivery_date', startDate);
      }
      
      if (endDate) {
        query = query.lte('delivery_date', endDate);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.institution_id,
  });
};

interface CreateDeliveryData {
  family_id: string;
  blocking_period_days: number;
  notes?: string;
}

export const useCreateDelivery = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDeliveryData) => {
      if (!profile?.institution_id) throw new Error('Institution not found');

      const { error } = await supabase
        .from('deliveries')
        .insert({
          family_id: data.family_id,
          institution_id: profile.institution_id,
          blocking_period_days: data.blocking_period_days,
          delivered_by_user_id: profile.id,
          notes: data.notes,
          delivery_date: new Date().toISOString(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institution-deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['families'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
};