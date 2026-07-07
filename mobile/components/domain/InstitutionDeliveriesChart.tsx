import React from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { BarChart3 } from 'lucide-react-native';
import type { MonthlyDeliveryPoint } from '@/hooks/useInstitutionDeliveriesChart';

interface InstitutionDeliveriesChartProps {
  data: MonthlyDeliveryPoint[];
  isLoading?: boolean;
  title?: string;
}

const CHART_HEIGHT = 180;
const PADDING = { top: 16, right: 12, bottom: 32, left: 28 };

export function InstitutionDeliveriesChart({
  data,
  isLoading,
  title = 'Entregas por Mês',
}: InstitutionDeliveriesChartProps) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(width - 48, 280);
  const innerWidth = chartWidth - PADDING.left - PADDING.right;
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[180px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const barGap = 8;
  const barWidth = Math.max(
    12,
    (innerWidth - barGap * (data.length - 1)) / Math.max(data.length, 1)
  );

  return (
    <Card>
      <CardHeader>
        <View className="flex-row items-center gap-2">
          <BarChart3 size={20} color="#004E64" />
          <CardTitle>{title}</CardTitle>
        </View>
      </CardHeader>
      <CardContent>
        {data.every((d) => d.value === 0) ? (
          <Text className="text-center text-sm text-muted-foreground">
            Nenhuma entrega nos últimos 6 meses
          </Text>
        ) : (
          <Svg width={chartWidth} height={CHART_HEIGHT}>
            <Line
              x1={PADDING.left}
              y1={PADDING.top + innerHeight}
              x2={chartWidth - PADDING.right}
              y2={PADDING.top + innerHeight}
              stroke="#E5E7EB"
              strokeWidth={1}
            />
            {data.map((point, index) => {
              const barHeight = (point.value / maxValue) * innerHeight;
              const x = PADDING.left + index * (barWidth + barGap);
              const y = PADDING.top + innerHeight - barHeight;

              return (
                <React.Fragment key={point.label}>
                  <Rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={Math.max(barHeight, point.value > 0 ? 4 : 0)}
                    rx={4}
                    fill="#004E64"
                  />
                  <SvgText
                    x={x + barWidth / 2}
                    y={PADDING.top + innerHeight + 18}
                    fontSize={10}
                    fill="#6B7280"
                    textAnchor="middle"
                  >
                    {point.label}
                  </SvgText>
                  {point.value > 0 ? (
                    <SvgText
                      x={x + barWidth / 2}
                      y={y - 4}
                      fontSize={10}
                      fill="#004E64"
                      textAnchor="middle"
                    >
                      {String(point.value)}
                    </SvgText>
                  ) : null}
                </React.Fragment>
              );
            })}
          </Svg>
        )}
      </CardContent>
    </Card>
  );
}
