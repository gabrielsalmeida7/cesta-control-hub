
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useDashboardStats = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['dashboard-stats', profile?.role, profile?.institution_id],
    queryFn: async () => {
      if (!profile) return null;

      // Stats para Admin
      if (profile.role === 'admin') {
        const [
          { count: totalInstitutions },
          { count: totalFamilies },
          { count: totalDeliveries },
          { count: blockedFamilies }
        ] = await Promise.all([
          supabase.from('institutions').select('*', { count: 'exact', head: true }),
          supabase.from('families').select('*', { count: 'exact', head: true }),
          supabase.from('deliveries').select('*', { count: 'exact', head: true }),
          supabase.from('families').select('*', { count: 'exact', head: true }).eq('is_blocked', true)
        ]);

        return {
          totalInstitutions: totalInstitutions || 0,
          totalFamilies: totalFamilies || 0,
          totalDeliveries: totalDeliveries || 0,
          blockedFamilies: blockedFamilies || 0,
        };
      }

      // Stats para Instituição
      if (profile.role === 'institution' && profile.institution_id) {
        const [
          { count: associatedFamilies },
          { count: institutionDeliveries },
          { count: blockedByInstitution },
          { data: recentDeliveries }
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

        return {
          associatedFamilies: associatedFamilies || 0,
          institutionDeliveries: institutionDeliveries || 0,
          blockedByInstitution: blockedByInstitution || 0,
          recentDeliveries: recentDeliveries?.length || 0,
        };
      }

      return null;
    },
    enabled: !!profile,
  });
};
