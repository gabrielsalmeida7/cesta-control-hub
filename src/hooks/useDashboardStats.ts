
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface AdminStats {
  totalInstitutions: number;
  totalFamilies: number;
  totalDeliveries: number;
  blockedFamilies: number;
}

export interface InstitutionStats {
  associatedFamilies: number;
  institutionDeliveries: number;
  blockedByInstitution: number;
  recentDeliveries: number;
}

export const useDashboardStats = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['dashboard-stats', profile?.role, profile?.institution_id],
    queryFn: async (): Promise<AdminStats | InstitutionStats | null> => {
      console.log('📊 Fetching dashboard stats for profile:', {
        role: profile?.role,
        institution_id: profile?.institution_id,
        user_id: profile?.id,
        email: profile?.email
      });
      
      if (!profile) {
        console.log('❌ No profile available');
        return null;
      }

      try {
        // Stats para Admin
        if (profile.role === 'admin') {
          console.log('🔑 Fetching admin stats...');
          
          const [
            { count: totalInstitutions, error: instError },
            { count: totalFamilies, error: famError },
            { count: totalDeliveries, error: delError },
            { count: blockedFamilies, error: blockError }
          ] = await Promise.all([
            supabase.from('institutions').select('*', { count: 'exact', head: true }),
            supabase.from('families').select('*', { count: 'exact', head: true }),
            supabase.from('deliveries').select('*', { count: 'exact', head: true }),
            supabase.from('families').select('*', { count: 'exact', head: true }).eq('is_blocked', true)
          ]);

          if (instError) console.error('❌ Error fetching institutions:', instError);
          if (famError) console.error('❌ Error fetching families:', famError);
          if (delError) console.error('❌ Error fetching deliveries:', delError);
          if (blockError) console.error('❌ Error fetching blocked families:', blockError);

          const stats: AdminStats = {
            totalInstitutions: totalInstitutions || 0,
            totalFamilies: totalFamilies || 0,
            totalDeliveries: totalDeliveries || 0,
            blockedFamilies: blockedFamilies || 0,
          };

          console.log('✅ Admin stats:', stats);
          return stats;
        }

        // Stats para Instituição
        if (profile.role === 'institution' && profile.institution_id) {
          console.log('🏢 Fetching institution stats for:', profile.institution_id);
          
          const [
            { count: associatedFamilies, error: famError },
            { count: institutionDeliveries, error: delError },
            { count: blockedByInstitution, error: blockError },
            { data: recentDeliveries, error: recentError }
          ] = await Promise.all([
            supabase
              .from('institution_families')
              .select('*', { count: 'exact', head: true })
              .eq('institution_id', profile.institution_id),
            supabase
              .from('deliveries')
              .select('*', { count: 'exact', head: true })
              .eq('institution_id', profile.institution_id),
            supabase
              .from('families')
              .select('*', { count: 'exact', head: true })
              .eq('blocked_by_institution_id', profile.institution_id)
              .eq('is_blocked', true),
            supabase
              .from('deliveries')
              .select('*')
              .eq('institution_id', profile.institution_id)
              .gte('delivery_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          ]);

          if (famError) console.error('❌ Error fetching associated families:', famError);
          if (delError) console.error('❌ Error fetching institution deliveries:', delError);
          if (blockError) console.error('❌ Error fetching blocked by institution:', blockError);
          if (recentError) console.error('❌ Error fetching recent deliveries:', recentError);

          const stats: InstitutionStats = {
            associatedFamilies: associatedFamilies || 0,
            institutionDeliveries: institutionDeliveries || 0,
            blockedByInstitution: blockedByInstitution || 0,
            recentDeliveries: recentDeliveries?.length || 0,
          };

          console.log('✅ Institution stats:', stats);
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
