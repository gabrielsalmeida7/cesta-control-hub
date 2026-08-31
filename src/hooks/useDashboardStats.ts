
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface AdminStats {
  totalInstitutions: number;
  totalFamilies: number;
  deliveriesThisMonth: number;
  deliveriesThisYear: number;
  blockedFamilies: number;
  monthlyCoverageRate: number;
}

export interface InstitutionStats {
  associatedFamilies: number;
  institutionDeliveries: number;
  institutionDeliveriesThisYear: number;
  blockedByInstitution: number;
  recentDeliveries: number;
}

function mapAdminStatsPayload(payload: Record<string, number | string | null>): AdminStats {
  return {
    totalInstitutions: Number(payload.total_institutions ?? 0),
    totalFamilies: Number(payload.total_families ?? 0),
    deliveriesThisMonth: Number(payload.deliveries_this_month ?? 0),
    deliveriesThisYear: Number(payload.deliveries_this_year ?? 0),
    blockedFamilies: Number(payload.blocked_families ?? 0),
    monthlyCoverageRate: Number(payload.monthly_coverage_rate ?? 0),
  };
}

export const useDashboardStats = () => {
  const { profile } = useAuth();

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
        if (profile.role === 'admin') {
          if (import.meta.env.DEV) {
            console.log('🔑 Fetching admin stats via RPC...');
          }

          const { data: statsJson, error: statsError } = await supabase.rpc(
            'get_admin_dashboard_stats'
          );

          if (statsError) {
            throw statsError;
          }

          const stats = mapAdminStatsPayload((statsJson ?? {}) as Record<string, number | string | null>);

          if (import.meta.env.DEV) {
            console.log('✅ Final admin stats:', stats);
          }

          return stats;
        }

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
    refetchOnWindowFocus: false,
  });
};
