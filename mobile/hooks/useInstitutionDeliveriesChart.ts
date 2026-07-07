import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, startOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface MonthlyDeliveryPoint {
  label: string;
  value: number;
}

export const useInstitutionDeliveriesChart = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['institution-deliveries-chart', profile?.institution_id],
    queryFn: async (): Promise<MonthlyDeliveryPoint[]> => {
      if (!profile?.institution_id) return [];

      const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));

      const { data: deliveries, error } = await supabase
        .from('deliveries')
        .select('delivery_date')
        .eq('institution_id', profile.institution_id)
        .gte('delivery_date', sixMonthsAgo.toISOString());

      if (error) throw error;

      const monthlyCounts: Record<string, number> = {};

      deliveries?.forEach((delivery) => {
        if (!delivery.delivery_date) return;
        const monthKey = format(new Date(delivery.delivery_date), 'yyyy-MM');
        monthlyCounts[monthKey] = (monthlyCounts[monthKey] ?? 0) + 1;
      });

      const points: MonthlyDeliveryPoint[] = [];
      for (let i = 5; i >= 0; i -= 1) {
        const date = subMonths(new Date(), i);
        const monthKey = format(date, 'yyyy-MM');
        const label = format(date, 'MMM/yy', { locale: ptBR });
        points.push({
          label,
          value: monthlyCounts[monthKey] ?? 0,
        });
      }

      return points;
    },
    enabled: !!profile?.institution_id,
  });
};
