import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Alert {
  id: string;
  type: 'fraude' | 'duplicado' | 'expirado' | 'outro';
  severity: 'alta' | 'média' | 'baixa';
  title: string;
  description: string;
  familyId?: string;
  institutionId?: string;
  createdAt: string;
  resolved: boolean;
}

export const useAlerts = () => {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: async (): Promise<Alert[]> => {
      // Generate alerts based on real data
      const alerts: Alert[] = [];

      // Check for families receiving multiple deliveries
      const { data: recentDeliveries } = await supabase
        .from('deliveries')
        .select(`
          *,
          families!inner(name),
          institutions!inner(name)
        `)
        .gte('delivery_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('delivery_date', { ascending: false });

      if (recentDeliveries) {
        // Group deliveries by family
        const deliveriesByFamily: { [key: string]: any[] } = {};
        recentDeliveries.forEach(delivery => {
          if (!deliveriesByFamily[delivery.family_id]) {
            deliveriesByFamily[delivery.family_id] = [];
          }
          deliveriesByFamily[delivery.family_id].push(delivery);
        });

        // Check for potential fraud (multiple deliveries in short period)
        Object.entries(deliveriesByFamily).forEach(([familyId, deliveries]) => {
          if (deliveries.length > 1) {
            const institutions = [...new Set(deliveries.map(d => d.institutions.name))];
            if (institutions.length > 1) {
              alerts.push({
                id: `fraud-${familyId}`,
                type: 'fraude',
                severity: 'alta',
                title: 'Possível tentativa de fraude detectada',
                description: `A família ${deliveries[0].families.name} recebeu cestas de ${institutions.length} instituições diferentes no último mês.`,
                familyId: familyId,
                institutionId: deliveries[0].institution_id,
                createdAt: new Date().toISOString(),
                resolved: false
              });
            }
          }
        });
      }

      // Check for blocked families that should be unblocked
      const { data: blockedFamilies } = await supabase
        .from('families')
        .select('*')
        .eq('is_blocked', true)
        .lt('blocked_until', new Date().toISOString());

      if (blockedFamilies && blockedFamilies.length > 0) {
        blockedFamilies.forEach(family => {
          alerts.push({
            id: `expired-block-${family.id}`,
            type: 'expirado',
            severity: 'baixa',
            title: 'Bloqueio de família expirado',
            description: `A família ${family.name} está bloqueada mas o período de bloqueio já expirou.`,
            familyId: family.id,
            createdAt: new Date().toISOString(),
            resolved: false
          });
        });
      }

      // Check for high activity institutions
      const { data: institutionStats } = await supabase
        .from('deliveries')
        .select(`
          institution_id,
          institutions!inner(name),
          count(*)
        `)
        .gte('delivery_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      return alerts;
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
};