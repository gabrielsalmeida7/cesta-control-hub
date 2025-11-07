import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useAdminRecentDeliveries = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['admin-recent-deliveries'],
    queryFn: async () => {
      console.log('🚚 Fetching recent deliveries for admin...');
      
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          family:families(name, contact_person),
          institution:institutions(name)
        `)
        .order('delivery_date', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('❌ Error fetching recent deliveries:', error);
        throw error;
      }
      
      console.log('✅ Recent deliveries fetched:', data?.length || 0, 'records');
      return data;
    },
    enabled: !!profile && profile.role === 'admin',
    retry: 1,
    refetchOnWindowFocus: false
  });
};