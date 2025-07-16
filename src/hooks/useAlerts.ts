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
      const { data: recentDeliveries, error: deliveriesError } = await supabase
        .from('deliveries')
        .select(`
          *,
          families(name),
          institutions(name)
        `)
        .gte('delivery_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('delivery_date', { ascending: false });

      if (deliveriesError) {
        console.error('Error fetching deliveries:', deliveriesError);
      }

      if (recentDeliveries && recentDeliveries.length > 0) {
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
            const institutions = [...new Set(deliveries.map(d => d.institutions?.name).filter(Boolean))];
            if (institutions.length > 1) {
              alerts.push({
                id: `fraud-${familyId}`,
                type: 'fraude',
                severity: 'alta',
                title: 'Possível tentativa de fraude detectada',
                description: `A família ${deliveries[0].families?.name || 'Desconhecida'} recebeu cestas de ${institutions.length} instituições diferentes no último mês: ${institutions.join(', ')}.`,
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
      const { data: blockedFamilies, error: familiesError } = await supabase
        .from('families')
        .select('*')
        .eq('is_blocked', true)
        .lt('blocked_until', new Date().toISOString());

      if (familiesError) {
        console.error('Error fetching blocked families:', familiesError);
      }

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

      // Check for high activity institutions (optional - simplified for now)
      const { data: highActivityDeliveries } = await supabase
        .from('deliveries')
        .select(`
          institution_id,
          institutions(name)
        `)
        .gte('delivery_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (highActivityDeliveries && highActivityDeliveries.length > 0) {
        // Count deliveries per institution
        const institutionCounts: { [key: string]: { count: number, name: string } } = {};
        highActivityDeliveries.forEach(delivery => {
          const institutionId = delivery.institution_id;
          if (!institutionCounts[institutionId]) {
            institutionCounts[institutionId] = { 
              count: 0, 
              name: delivery.institutions?.name || 'Instituição Desconhecida' 
            };
          }
          institutionCounts[institutionId].count++;
        });

        // Generate alerts for institutions with high activity (>10 deliveries in a week)
        Object.entries(institutionCounts).forEach(([institutionId, data]) => {
          if (data.count > 10) {
            alerts.push({
              id: `high-activity-${institutionId}`,
              type: 'outro',
              severity: 'média',
              title: 'Alta atividade detectada',
              description: `A instituição ${data.name} realizou ${data.count} entregas nos últimos 7 dias.`,
              institutionId: institutionId,
              createdAt: new Date().toISOString(),
              resolved: false
            });
          }
        });
      }

      console.log('Generated alerts:', alerts);
      return alerts;
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
};