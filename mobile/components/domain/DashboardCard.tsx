import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Text, View } from 'react-native';

interface DashboardCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
}

export function DashboardCard({ title, value, description, icon }: DashboardCardProps) {
  return (
    <Card className="flex-1 min-w-[45%]">
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
        <View>{icon}</View>
      </CardHeader>
      <CardContent>
        <Text className="text-2xl font-bold text-foreground">{value}</Text>
        <Text className="mt-1 text-xs text-muted-foreground">{description}</Text>
      </CardContent>
    </Card>
  );
}
