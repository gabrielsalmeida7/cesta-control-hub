import React, { useMemo } from 'react';
import { InstitutionDeliveriesChart } from '@/components/domain/InstitutionDeliveriesChart';
import { useDeliveriesByInstitution } from '@/hooks/useDeliveriesByInstitution';

export function AdminDeliveriesChart() {
  const { data, isLoading } = useDeliveriesByInstitution();

  const chartData = useMemo(() => {
    if (!data?.chartData) return [];

    return data.chartData.map((month) => {
      const total = Object.entries(month)
        .filter(([key]) => key !== 'name')
        .reduce((sum, [, value]) => sum + (Number(value) || 0), 0);

      return {
        label: String(month.name),
        value: total,
      };
    });
  }, [data?.chartData]);

  return (
    <InstitutionDeliveriesChart
      data={chartData}
      isLoading={isLoading}
      title="Entregas por Mês (Todas as Instituições)"
    />
  );
}
