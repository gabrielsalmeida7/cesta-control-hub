import React from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { Users, Building2, Package, AlertTriangle } from 'lucide-react-native';
import { DashboardCard } from '@/components/domain/DashboardCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { AdminDeliveriesChart } from '@/components/domain/AdminDeliveriesChart';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardStats, type AdminStats } from '@/hooks/useDashboardStats';
import { useAdminRecentDeliveries } from '@/hooks/useAdminRecentDeliveries';
import { formatDateTimeBrasilia } from '@/utils/dateFormat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

import { screenStyle } from '@/constants/layout';

export default function AdminDashboardScreen() {
  const { profile } = useAuth();
  const { data: stats, isLoading, refetch, isRefetching } = useDashboardStats();
  const { data: recentDeliveries = [] } = useAdminRecentDeliveries();
  const adminStats = stats as AdminStats | undefined;

  return (
    <ScrollView
      style={screenStyle}
      className="flex-1 bg-background"
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <View className="gap-4 p-4">
        <View>
          <Text className="text-xl font-bold">Dashboard - Administrador</Text>
          <Text className="text-sm text-muted-foreground">
            Bem-vindo(a), {profile?.full_name}!
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-3">
          {isLoading ? (
            <>
              <Skeleton className="h-28 flex-1 min-w-[45%]" />
              <Skeleton className="h-28 flex-1 min-w-[45%]" />
            </>
          ) : (
            <>
              <DashboardCard
                title="Total de Famílias"
                value={adminStats?.totalFamilies ?? 0}
                description="Famílias cadastradas"
                icon={<Users size={24} color="#004E64" />}
              />
              <DashboardCard
                title="Instituições Ativas"
                value={adminStats?.totalInstitutions ?? 0}
                description="Instituições parceiras"
                icon={<Building2 size={24} color="#004E64" />}
              />
              <DashboardCard
                title="Total de Entregas"
                value={adminStats?.totalDeliveries ?? 0}
                description="Entregas registradas"
                icon={<Package size={24} color="#004E64" />}
              />
              <DashboardCard
                title="Famílias Bloqueadas"
                value={adminStats?.blockedFamilies ?? 0}
                description="Com bloqueio ativo"
                icon={<AlertTriangle size={24} color="#EF476F" />}
              />
            </>
          )}
        </View>

        <AdminDeliveriesChart />

        <Card>
          <CardHeader>
            <CardTitle>Entregas Recentes</CardTitle>
          </CardHeader>
          <CardContent className="gap-2">
            {(recentDeliveries as Array<{ id: string; delivery_date: string; family?: { name?: string } | null; institution?: { name?: string } | null }>).slice(0, 10).map((d) => (
              <View key={d.id} className="border-b border-border py-2">
                <Text className="font-medium">{d.family?.name ?? 'Família'}</Text>
                <Text className="text-xs text-muted-foreground">
                  {d.institution?.name} · {formatDateTimeBrasilia(d.delivery_date)}
                </Text>
              </View>
            ))}
          </CardContent>
        </Card>
      </View>
    </ScrollView>
  );
}
