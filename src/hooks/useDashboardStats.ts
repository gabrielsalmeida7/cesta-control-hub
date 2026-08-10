
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
        if (import.meta.env.DEV) {
          console.log('❌ No profile available, returning null');
        }
        return null;
      }

      try {
        // Stats para Admin
        if (profile.role === 'admin') {
          if (import.meta.env.DEV) {
            console.log('🔑 Fetching admin stats...');
          }
          
          // Test each query individually
          if (import.meta.env.DEV) {
            console.log('📝 Testing institutions query...');
          }
          const { data: allInstitutions, count: totalCount } = await supabase
            .from('institutions')
            .select('*', { count: 'exact', head: false });
          
          const instResult = { 
            count: totalCount || 0,
            data: allInstitutions 
          };
          if (import.meta.env.DEV) {
            console.log('📝 Institutions result:', instResult);
          }

          if (import.meta.env.DEV) {
            console.log('📝 Testing families query...');
          }
          const famResult = await supabase.from('families').select('*', { count: 'exact', head: true });
          if (import.meta.env.DEV) {
            console.log('📝 Families result:', famResult);
          }

          if (import.meta.env.DEV) {
            console.log('📝 Testing deliveries query...');
          }
          const delResult = await supabase.from('deliveries').select('*', { count: 'exact', head: true });
          if (import.meta.env.DEV) {
            console.log('📝 Deliveries result:', delResult);
          }

          if (import.meta.env.DEV) {
            console.log('📝 Testing blocked families query...');
          }
          const blockResult = await supabase.from('families').select('*', { count: 'exact', head: true }).eq('is_blocked', true);
          if (import.meta.env.DEV) {
            console.log('📝 Blocked families result:', blockResult);
          }

          const stats: AdminStats = {
            totalInstitutions: instResult.count || 0,
            totalFamilies: famResult.count || 0,
            totalDeliveries: delResult.count || 0,
            blockedFamilies: blockResult.count || 0,
          };

          if (import.meta.env.DEV) {
            console.log('✅ Final admin stats:', stats);
          }
          return stats;
        }

        // Stats para Instituição (via RPC — evita SELECT direto bloqueado por RLS)
        if (profile.role === 'institution' && profile.institution_id) {
          if (import.meta.env.DEV) {
            console.log('🏢 Fetching institution stats for:', profile.institution_id);
          }

          const { data: statsJson, error: statsError } = await supabase.rpc(
            'get_institution_dashboard_stats',
            { p_institution_id: profile.institution_id }
          );

          if (statsError) {
            throw statsError;
          }

          const payload = (statsJson ?? {}) as Record<string, number | string | null>;

          const stats: InstitutionStats = {
            associatedFamilies: Number(payload.associated_families ?? 0),
            institutionDeliveries: Number(payload.institution_deliveries ?? 0),
            institutionDeliveriesThisYear: Number(payload.institution_deliveries_this_year ?? 0),
            blockedByInstitution: Number(payload.blocked_by_institution ?? 0),
            recentDeliveries: Number(payload.recent_deliveries ?? 0),
          };

          if (import.meta.env.DEV) {
            console.log('✅ Final institution stats:', stats);
          }
          return stats;
        }

        if (import.meta.env.DEV) {
          console.log('❌ No matching role or missing institution_id');
        }
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
