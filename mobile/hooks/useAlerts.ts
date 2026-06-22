import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['alerts'],
    queryFn: async (): Promise<Alert[]> => {
      console.log('🚨 Fetching alerts...');
      
      if (!profile) {
        console.log('❌ No profile available for alerts');
        return [];
      }

      try {
        const alerts: Alert[] = [];
        
        // 1. Verificar possíveis fraudes (múltiplas entregas para a mesma família)
        const { data: deliveries, error: deliveriesError } = await supabase
          .from('deliveries')
          .select(`
            *,
            family:families(name),
            institution:institutions(name)
          `)
          .gte('delivery_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        if (deliveriesError) {
          console.error('❌ Error fetching deliveries for alerts:', deliveriesError);
        } else if (deliveries) {
          // Agrupar por família e verificar múltiplas entregas
          const familyDeliveries = deliveries.reduce((acc, delivery) => {
            const familyId = delivery.family_id;
            if (!acc[familyId]) acc[familyId] = [];
            acc[familyId].push(delivery);
            return acc;
          }, {} as Record<string, any[]>);

          Object.entries(familyDeliveries).forEach(([familyId, familyDeliveries]) => {
            if (familyDeliveries.length > 1) {
              alerts.push({
                id: `fraud-${familyId}`,
                type: 'fraude',
                severity: 'alta',
                title: 'Possível Fraude Detectada',
                description: `A família ${familyDeliveries[0].family?.name} recebeu ${familyDeliveries.length} entregas nos últimos 7 dias de diferentes instituições.`,
                familyId,
                createdAt: new Date().toISOString(),
                resolved: false
              });
            }
          });
        }

        // 2. Verificar famílias com bloqueio expirado que ainda estão marcadas como bloqueadas
        const { data: expiredFamilies, error: expiredError } = await supabase
          .from('families')
          .select('*')
          .eq('is_blocked', true)
          .lt('blocked_until', new Date().toISOString());

        if (expiredError) {
          console.error('❌ Error fetching expired families:', expiredError);
        } else if (expiredFamilies) {
          expiredFamilies.forEach(family => {
            const blockedUntilLabel = family.blocked_until
              ? new Date(family.blocked_until).toLocaleDateString('pt-BR')
              : 'data desconhecida';

            alerts.push({
              id: `expired-${family.id}`,
              type: 'expirado',
              severity: 'média',
              title: 'Bloqueio Expirado',
              description: `A família ${family.name} tem bloqueio expirado desde ${blockedUntilLabel} e deve ser liberada.`,
              familyId: family.id,
              createdAt: new Date().toISOString(),
              resolved: false
            });
          });
        }

        // 3. Verificar entregas duplicadas no mesmo dia (possível duplicação)
        if (deliveries) {
          const dailyDeliveries = deliveries.reduce((acc, delivery) => {
            if (!delivery.delivery_date) {
              return acc;
            }

            const date = new Date(delivery.delivery_date).toDateString();
            const familyId = delivery.family_id;
            const key = `${date}-${familyId}`;
            
            if (!acc[key]) acc[key] = [];
            acc[key].push(delivery);
            return acc;
          }, {} as Record<string, any[]>);

          Object.entries(dailyDeliveries).forEach(([key, dayDeliveries]) => {
            if (dayDeliveries.length > 1) {
              alerts.push({
                id: `duplicate-${key}`,
                type: 'duplicado',
                severity: 'alta',
                title: 'Entrega Duplicada Detectada',
                description: `A família ${dayDeliveries[0].family?.name} recebeu ${dayDeliveries.length} entregas no mesmo dia de diferentes instituições.`,
                familyId: dayDeliveries[0].family_id,
                createdAt: new Date().toISOString(),
                resolved: false
              });
            }
          });
        }

        // 4. Verificar instituições com alta atividade (mais de 15 entregas nos últimos 7 dias)
        if (profile.role === 'admin') {
          const { data: institutionStats, error: statsError } = await supabase
            .from('deliveries')
            .select('institution_id, institutions(name)')
            .gte('delivery_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

          if (statsError) {
            console.error('❌ Error fetching institution stats:', statsError);
          } else if (institutionStats) {
            const institutionCounts = institutionStats.reduce((acc, delivery) => {
              const institutionId = delivery.institution_id;
              if (!acc[institutionId]) {
                acc[institutionId] = {
                  count: 0,
                  name: delivery.institutions?.name || 'Instituição desconhecida'
                };
              }
              acc[institutionId].count++;
              return acc;
            }, {} as Record<string, { count: number; name: string }>);

            Object.entries(institutionCounts).forEach(([institutionId, data]) => {
              if (data.count > 15) {
                alerts.push({
                  id: `high-activity-${institutionId}`,
                  type: 'outro',
                  severity: 'baixa',
                  title: 'Alta Atividade Detectada',
                  description: `A instituição ${data.name} realizou ${data.count} entregas nos últimos 7 dias. Verificar se é atividade normal.`,
                  institutionId,
                  createdAt: new Date().toISOString(),
                  resolved: false
                });
              }
            });
          }
        }

        // 5. Verificar famílias sem entregas há muito tempo (mais de 6 meses)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const { data: familiesWithoutDeliveries, error: noDeliveryError } = await supabase
          .from('families')
          .select(`
            *,
            deliveries!left(delivery_date)
          `)
          .eq('is_blocked', false);

        if (noDeliveryError) {
          console.error('❌ Error fetching families without deliveries:', noDeliveryError);
        } else if (familiesWithoutDeliveries) {
          familiesWithoutDeliveries.forEach(family => {
            const hasRecentDelivery = family.deliveries?.some((delivery: any) => 
              new Date(delivery.delivery_date) > sixMonthsAgo
            );
            
            if (!hasRecentDelivery && family.deliveries?.length === 0) {
              alerts.push({
                id: `no-delivery-${family.id}`,
                type: 'outro',
                severity: 'baixa',
                title: 'Família Sem Entregas',
                description: `A família ${family.name} está cadastrada mas nunca recebeu entregas. Verificar se ainda precisa de assistência.`,
                familyId: family.id,
                createdAt: new Date().toISOString(),
                resolved: false
              });
            }
          });
        }

        console.log('✅ Alerts generated:', alerts.length);
        return alerts.sort((a, b) => {
          // Ordenar por severidade e depois por data
          const severityOrder = { 'alta': 3, 'média': 2, 'baixa': 1 };
          const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
          if (severityDiff !== 0) return severityDiff;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      } catch (error) {
        console.error('💥 Error generating alerts:', error);
        throw error;
      }
    },
    enabled: !!profile,
    refetchInterval: 5 * 60 * 1000, // Refresh alerts every 5 minutes
    retry: 1
  });
};

export interface FamilyWithMultipleInstitutions {
  id: string;
  name: string;
  cpf: string | null;
  contact_person: string;
  institutions: Array<{
    id: string;
    name: string;
  }>;
}

/**
 * Busca famílias vinculadas a múltiplas instituições
 * @param institutionId - Se fornecido, retorna apenas famílias dessa instituição que estão em múltiplas instituições
 */
export const useFamiliesWithMultipleInstitutions = (institutionId?: string) => {
  return useQuery({
    queryKey: ['families-multiple-institutions', institutionId],
    queryFn: async (): Promise<FamilyWithMultipleInstitutions[]> => {
      console.log('🔍 Fetching families with multiple institutions...', institutionId ? `for institution ${institutionId}` : 'all');
      
      // Buscar todas as associações família-instituição
      let query = supabase
        .from('institution_families')
        .select(`
          family_id,
          institution_id,
          family:families(
            id,
            name,
            cpf,
            contact_person
          ),
          institution:institutions(
            id,
            name
          )
        `);

      // Se institutionId fornecido, filtrar apenas associações dessa instituição
      if (institutionId) {
        query = query.eq('institution_id', institutionId);
      }

      const { data: associations, error } = await query;

      if (error) {
        console.error('❌ Error fetching families with multiple institutions:', error);
        throw error;
      }

      if (!associations || associations.length === 0) {
        console.log('✅ No families found');
        return [];
      }

      // Agrupar por família e contar instituições
      const familiesMap = new Map<string, FamilyWithMultipleInstitutions>();

      associations.forEach((assoc: any) => {
        const familyId = assoc.family_id;
        const family = assoc.family;
        const institution = assoc.institution;

        if (!family || !institution) return;

        if (!familiesMap.has(familyId)) {
          familiesMap.set(familyId, {
            id: family.id,
            name: family.name,
            cpf: family.cpf,
            contact_person: family.contact_person,
            institutions: []
          });
        }

        const familyData = familiesMap.get(familyId)!;
        // Evitar duplicatas
        if (!familyData.institutions.some(inst => inst.id === institution.id)) {
          familyData.institutions.push({
            id: institution.id,
            name: institution.name
          });
        }
      });

      // Filtrar apenas famílias com mais de 1 instituição
      const familiesWithMultiple = Array.from(familiesMap.values())
        .filter(family => family.institutions.length > 1);

      console.log('✅ Found', familiesWithMultiple.length, 'families with multiple institutions');
      return familiesWithMultiple;
    },
    enabled: true,
    retry: 1
  });
};