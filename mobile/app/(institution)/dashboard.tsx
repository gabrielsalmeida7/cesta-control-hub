import React from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Users, Package, AlertTriangle, Calendar } from 'lucide-react-native';
import { DashboardCard } from '@/components/domain/DashboardCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { InstitutionDeliveriesChart } from '@/components/domain/InstitutionDeliveriesChart';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardStats, type InstitutionStats } from '@/hooks/useDashboardStats';
import { useInstitutionData } from '@/hooks/useInstitutions';
import { useFamiliesWithMultipleInstitutions } from '@/hooks/useAlerts';
import { useInstitutionDeliveriesChart } from '@/hooks/useInstitutionDeliveriesChart';

export default function InstitutionDashboardScreen() {
  const { profile } = useAuth();
  const { data: stats, isLoading, refetch, isRefetching } = useDashboardStats();
  const { data: institutionData, isLoading: isLoadingInstitution } = useInstitutionData();
  const { data: multiInstFamilies = [] } = useFamiliesWithMultipleInstitutions(
    profile?.institution_id
  );
  const { data: chartData = [], isLoading: chartLoading } = useInstitutionDeliveriesChart();
  const institutionStats = stats as InstitutionStats | undefined;

  return (
    <ScrollView
      className="flex-1 bg-background"
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <View className="gap-4 p-4">
        <View>
          <Text className="text-xl font-bold text-foreground">Dashboard - Instituição</Text>
          <Text className="text-sm text-muted-foreground">
            Bem-vindo(a), {profile?.full_name}! Acompanhe as atividades da sua instituição.
          </Text>
        </View>

        {multiInstFamilies.length > 0 ? (
          <Pressable onPress={() => router.push('/(institution)/reports')}>
            <Card className="border-danger">
              <CardContent className="flex-row items-center justify-between py-4">
                <View className="flex-1 flex-row items-center gap-3">
                  <AlertTriangle size={22} color="#EF476F" />
                  <View className="flex-1">
                    <Text className="font-semibold text-danger">Alertas de Fraude</Text>
                    <Text className="text-sm text-muted-foreground">
                      {multiInstFamilies.length} família(s) em múltiplas instituições
                    </Text>
                  </View>
                </View>
                <Badge variant="destructive">{multiInstFamilies.length}</Badge>
              </CardContent>
            </Card>
          </Pressable>
        ) : null}

        <View className="flex-row flex-wrap gap-3">
          <DashboardCard
            title="Famílias Cadastradas"
            value={isLoading ? '...' : String(institutionStats?.associatedFamilies ?? 0)}
            description="Total de famílias cadastradas"
            icon={<Users size={24} color="#004E64" />}
          />
          <DashboardCard
            title="Entregas Este Mês"
            value={isLoading ? '...' : String(institutionStats?.recentDeliveries ?? 0)}
            description="Cestas entregues no mês"
            icon={<Package size={24} color="#004E64" />}
          />
          <DashboardCard
            title="Famílias Atendidas"
            value={isLoading ? '...' : String(institutionStats?.blockedByInstitution ?? 0)}
            description="Bloqueadas por esta instituição"
            icon={<AlertTriangle size={24} color="#EF476F" />}
          />
          <DashboardCard
            title="Total de Entregas no Ano"
            value={isLoading ? '...' : String(institutionStats?.institutionDeliveriesThisYear ?? 0)}
            description="Entregas realizadas no ano"
            icon={<Calendar size={24} color="#004E64" />}
          />
        </View>

        <InstitutionDeliveriesChart data={chartData} isLoading={chartLoading} />

        <Card>
          <CardHeader>
            <CardTitle>Informações da Instituição</CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            {isLoadingInstitution ? (
              <>
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </>
            ) : institutionData ? (
              <>
                <View>
                  <Text className="text-sm text-muted-foreground">Nome da Instituição</Text>
                  <Text className="font-medium">{institutionData.name}</Text>
                </View>
                <View>
                  <Text className="text-sm text-muted-foreground">Responsável</Text>
                  <Text className="font-medium">{profile?.full_name}</Text>
                </View>
                <View>
                  <Text className="text-sm text-muted-foreground">E-mail</Text>
                  <Text className="font-medium">
                    {institutionData.email || profile?.email || 'Não informado'}
                  </Text>
                </View>
                {institutionData.address ? (
                  <View>
                    <Text className="text-sm text-muted-foreground">Endereço</Text>
                    <Text className="font-medium">{institutionData.address}</Text>
                  </View>
                ) : null}
                {institutionData.phone ? (
                  <View>
                    <Text className="text-sm text-muted-foreground">Telefone</Text>
                    <Text className="font-medium">{institutionData.phone}</Text>
                  </View>
                ) : null}
              </>
            ) : (
              <Text className="text-sm text-muted-foreground">Dados não disponíveis</Text>
            )}
          </CardContent>
        </Card>
      </View>
    </ScrollView>
  );
}
