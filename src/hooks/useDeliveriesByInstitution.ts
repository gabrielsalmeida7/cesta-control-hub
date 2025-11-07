import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { startOfMonth, format, subMonths } from 'date-fns';

export const useDeliveriesByInstitution = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['deliveries-by-institution'],
    queryFn: async () => {
      // Buscar entregas dos últimos 6 meses
      const sixMonthsAgo = subMonths(new Date(), 5);
      const startDate = startOfMonth(sixMonthsAgo);

      const { data: deliveries, error } = await supabase
        .from('deliveries')
        .select(`
          delivery_date,
          institution:institutions(name)
        `)
        .gte('delivery_date', startDate.toISOString())
        .order('delivery_date', { ascending: true });
      
      if (error) throw error;

      // Agrupar entregas por mês e instituição
      const monthlyData: Record<string, Record<string, number>> = {};
      
      deliveries?.forEach((delivery) => {
        if (delivery.delivery_date && delivery.institution) {
          const monthKey = format(new Date(delivery.delivery_date), 'MMM');
          const institutionName = delivery.institution.name;
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {};
          }
          
          monthlyData[monthKey][institutionName] = (monthlyData[monthKey][institutionName] || 0) + 1;
        }
      });

      // Converter para formato do gráfico
      const chartData = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthKey = format(date, 'MMM');
        
        const monthData: any = { name: monthKey };
        
        // Adicionar dados de cada instituição para este mês
        if (monthlyData[monthKey]) {
          Object.keys(monthlyData[monthKey]).forEach(institutionName => {
            monthData[institutionName] = monthlyData[monthKey][institutionName];
          });
        }
        
        chartData.push(monthData);
      }

      // Buscar todas as instituições para garantir consistência
      const { data: institutions } = await supabase
        .from('institutions')
        .select('name')
        .order('name');

      return {
        chartData,
        institutions: institutions || []
      };
    },
    enabled: !!profile && profile.role === 'admin',
  });
};