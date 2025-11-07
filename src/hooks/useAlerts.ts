import { useQuery } from '@tanstack/react-query';
import { useDeliveries } from './useDeliveries';
import { useFamilies } from './useFamilies';
import { useInstitutions } from './useInstitutions';

interface Alert {
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
  const { data: deliveries = [] } = useDeliveries();
  const { data: families = [] } = useFamilies();
  const { data: institutions = [] } = useInstitutions();

  return useQuery({
    queryKey: ['alerts', deliveries.length, families.length],
    queryFn: async (): Promise<Alert[]> => {
      const alerts: Alert[] = [];

      // Detect families with multiple deliveries in the same month
      const deliveriesByFamily = new Map<string, any[]>();
      deliveries.forEach((delivery: any) => {
        if (!delivery.family_id) return;
        if (!deliveriesByFamily.has(delivery.family_id)) {
          deliveriesByFamily.set(delivery.family_id, []);
        }
        deliveriesByFamily.get(delivery.family_id)!.push(delivery);
      });

      deliveriesByFamily.forEach((familyDeliveries, familyId) => {
        // Group by month
        const deliveriesByMonth = new Map<string, any[]>();
        familyDeliveries.forEach((delivery: any) => {
          if (!delivery.delivery_date) return;
          const date = new Date(delivery.delivery_date);
          const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
          if (!deliveriesByMonth.has(monthKey)) {
            deliveriesByMonth.set(monthKey, []);
          }
          deliveriesByMonth.get(monthKey)!.push(delivery);
        });

        // Check for multiple deliveries in same month
        deliveriesByMonth.forEach((monthDeliveries, monthKey) => {
          if (monthDeliveries.length >= 2) {
            const uniqueInstitutions = new Set(
              monthDeliveries.map((d: any) => d.institution_id).filter(Boolean)
            );

            if (uniqueInstitutions.size >= 2) {
              const family = families.find((f: any) => f.id === familyId);
              alerts.push({
                id: `fraude-${familyId}-${monthKey}`,
                type: 'fraude',
                severity: 'alta',
                title: 'Possível tentativa de fraude detectada',
                description: `A família ${family?.name || family?.contact_person || 'N/A'} recebeu cestas em ${uniqueInstitutions.size} instituições diferentes no mesmo mês.`,
                familyId,
                createdAt: monthDeliveries[0].delivery_date || new Date().toISOString(),
                resolved: false
              });
            }
          }
        });
      });

      // Detect families registered in multiple institutions
      const familiesByInstitution = new Map<string, Set<string>>();
      deliveries.forEach((delivery: any) => {
        if (!delivery.family_id || !delivery.institution_id) return;
        if (!familiesByInstitution.has(delivery.family_id)) {
          familiesByInstitution.set(delivery.family_id, new Set());
        }
        familiesByInstitution.get(delivery.family_id)!.add(delivery.institution_id);
      });

      familiesByInstitution.forEach((institutionIds, familyId) => {
        if (institutionIds.size > 1) {
          const family = families.find((f: any) => f.id === familyId);
          alerts.push({
            id: `duplicado-${familyId}`,
            type: 'duplicado',
            severity: 'média',
            title: 'Solicitação duplicada',
            description: `A família ${family?.name || family?.contact_person || 'N/A'} aparece registrada em múltiplas instituições.`,
            familyId,
            createdAt: new Date().toISOString(),
            resolved: false
          });
        }
      });

      // Sort by severity and date
      const severityOrder = { alta: 0, média: 1, baixa: 2 };
      alerts.sort((a, b) => {
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      return alerts;
    },
    enabled: deliveries.length > 0 || families.length > 0
  });
};

