
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { startOfMonth } from 'date-fns';

export interface AdminStats {
  totalInstitutions: number;
  totalFamilies: number;
  totalDeliveries: number;
  blockedFamilies: number;
}

export interface InstitutionStats {
  associatedFamilies: number;
  institutionDeliveries: number;
  institutionDeliveriesThisYear: number;
  blockedByInstitution: number;
  recentDeliveries: number;
}

export const useDashboardStats = () => {
  const { profile, user, session } = useAuth();

  return useQuery({
    queryKey: ['dashboard-stats', profile?.role, profile?.institution_id],
    queryFn: async (): Promise<AdminStats | InstitutionStats | null> => {
      
      if (!profile) {
        console.log('❌ No profile available, returning null');
        return null;
      }

      try {
        // Stats para Admin
        if (profile.role === 'admin') {
          console.log('🔑 Fetching admin stats...');
          
          // Test each query individually
          console.log('📝 Testing institutions query...');
          const instResult = await supabase.from('institutions').select('*', { count: 'exact', head: true });
          console.log('📝 Institutions result:', instResult);

          console.log('📝 Testing families query...');
          const famResult = await supabase.from('families').select('*', { count: 'exact', head: true });
          console.log('📝 Families result:', famResult);

          console.log('📝 Testing deliveries query...');
          const delResult = await supabase.from('deliveries').select('*', { count: 'exact', head: true });
          console.log('📝 Deliveries result:', delResult);

          console.log('📝 Testing blocked families query...');
          const blockResult = await supabase.from('families').select('*', { count: 'exact', head: true }).eq('is_blocked', true);
          console.log('📝 Blocked families result:', blockResult);

          const stats: AdminStats = {
            totalInstitutions: instResult.count || 0,
            totalFamilies: famResult.count || 0,
            totalDeliveries: delResult.count || 0,
            blockedFamilies: blockResult.count || 0,
          };

          console.log('✅ Final admin stats:', stats);
          return stats;
        }

        // Stats para Instituição
        if (profile.role === 'institution' && profile.institution_id) {
          console.log('🏢 Fetching institution stats for:', profile.institution_id);
          
          // Test each institution query individually
          console.log('📝 Testing institution families query...');
          const famResult = await supabase
            .from('institution_families')
            .select('*', { count: 'exact', head: true })
            .eq('institution_id', profile.institution_id);
          console.log('📝 Institution families result:', famResult);

          console.log('📝 Testing institution deliveries query...');
          const delResult = await supabase
            .from('deliveries')
            .select('*', { count: 'exact', head: true })
            .eq('institution_id', profile.institution_id);
          console.log('📝 Institution deliveries result:', delResult);

          console.log('📝 Testing blocked by institution query...');
          const blockResult = await supabase
            .from('families')
            .select('*', { count: 'exact', head: true })
            .eq('blocked_by_institution_id', profile.institution_id)
            .eq('is_blocked', true);
          console.log('📝 Blocked by institution result:', blockResult);

          console.log('📝 Testing recent deliveries query...');
          const recentResult = await supabase
            .from('deliveries')
            .select('*')
            .eq('institution_id', profile.institution_id)
            .gte('delivery_date', startOfMonth(new Date()).toISOString());
          console.log('📝 Recent deliveries result:', recentResult);

          console.log('📝 Testing deliveries this year query...');
          const currentYear = new Date().getFullYear();
          const yearStart = new Date(currentYear, 0, 1).toISOString(); // 1 de janeiro
          const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59).toISOString(); // 31 de dezembro
          const yearDeliveriesResult = await supabase
            .from('deliveries')
            .select('*', { count: 'exact', head: true })
            .eq('institution_id', profile.institution_id)
            .gte('delivery_date', yearStart)
            .lte('delivery_date', yearEnd);
          console.log('📝 Deliveries this year result:', yearDeliveriesResult);

          const stats: InstitutionStats = {
            associatedFamilies: famResult.count || 0,
            institutionDeliveries: delResult.count || 0,
            institutionDeliveriesThisYear: yearDeliveriesResult.count || 0,
            blockedByInstitution: blockResult.count || 0,
            recentDeliveries: recentResult.data?.length || 0,
          };

          console.log('✅ Final institution stats:', stats);
          return stats;
        }

        console.log('❌ No matching role or missing institution_id');
        return null;
      } catch (error) {
        console.error('💥 Error in dashboard stats:', error);
        throw error;
      }
    },
    enabled: !!profile,
    retry: 1,
    refetchOnWindowFocus: false
  });
};
