import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  RefreshControl,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DashboardCard } from '@/components/domain/DashboardCard';
import { InstitutionDeliveriesChart } from '@/components/domain/InstitutionDeliveriesChart';
import { FraudAlertCard } from '@/components/domain/FraudAlertCard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog';
import { useAuth } from '@/hooks/useAuth';
import { useInstitutionDeliveries } from '@/hooks/useInstitutionDeliveries';
import { useReportExport } from '@/hooks/useReportExport';
import {
  useFamiliesWithMultipleInstitutions,
  type FamilyWithMultipleInstitutions,
} from '@/hooks/useAlerts';
import { useInstitutionDeliveriesChart } from '@/hooks/useInstitutionDeliveriesChart';
import { formatDateBrasilia, formatDateTimeBrasilia } from '@/utils/dateFormat';
import { formatCpf } from '@/utils/documentFormat';
import { AlertTriangle, Package, Users, BarChart3, Eye } from 'lucide-react-native';

interface DeliveryRow {
  id: string;
  delivery_date: string;
  blocking_period_days?: number | null;
  notes?: string | null;
  blocking_justification?: string | null;
  family?: { id?: string; name?: string; contact_person?: string } | null;
  stock_movements?: Array<{
    quantity: number;
    status?: string;
    product?: { name?: string; unit?: string } | null;
  }>;
}

export default function InstitutionReportsScreen() {
  const { profile } = useAuth();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exporting, setExporting] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState<FamilyWithMultipleInstitutions | null>(
    null
  );
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryRow | null>(null);

  const {
    data: deliveries = [],
    refetch,
    isRefetching,
    isLoading,
  } = useInstitutionDeliveries(startDate || undefined, endDate || undefined);

  const { data: multiInstFamilies = [] } = useFamiliesWithMultipleInstitutions(
    profile?.institution_id
  );
  const { data: chartData = [], isLoading: chartLoading } = useInstitutionDeliveriesChart();
  const { exportDeliveriesReport, exportFamiliesReport } = useReportExport();

  const deliveryRows = deliveries as DeliveryRow[];

  const periodStats = useMemo(() => {
    const uniqueFamilies = new Set(
      deliveryRows.map((d) => d.family?.id).filter(Boolean)
    ).size;
    const totalItems = deliveryRows.reduce((sum, delivery) => {
      const movements = delivery.stock_movements ?? [];
      return sum + movements.filter((m) => m.status !== 'CANCELLED').length;
    }, 0);

    return {
      totalDeliveries: deliveryRows.length,
      uniqueFamilies,
      totalItems: totalItems || deliveryRows.length,
    };
  }, [deliveryRows]);

  const handleExportDeliveries = async () => {
    setExporting(true);
    try {
      await exportDeliveriesReport(
        startDate || undefined,
        endDate || undefined
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <View className="gap-4 p-4">
        <View>
          <Text className="text-xl font-bold">Relatórios de Entregas</Text>
          <Text className="text-sm text-muted-foreground">
            Acompanhe as entregas realizadas pela sua instituição
          </Text>
        </View>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            <View className="gap-2">
              <Label>Data inicial (AAAA-MM-DD)</Label>
              <Input
                value={startDate}
                onChangeText={setStartDate}
                placeholder="2026-01-01"
              />
            </View>
            <View className="gap-2">
              <Label>Data final (AAAA-MM-DD)</Label>
              <Input
                value={endDate}
                onChangeText={setEndDate}
                placeholder="2026-12-31"
              />
            </View>
            <Button onPress={handleExportDeliveries} loading={exporting} variant="outline">
              Exportar Relatório CSV
            </Button>
            <Button variant="outline" onPress={() => exportFamiliesReport()}>
              Exportar Famílias CSV
            </Button>
          </CardContent>
        </Card>

        {multiInstFamilies.length > 0 ? (
          <Card className="border-danger">
            <CardHeader>
              <View className="flex-row items-center gap-2">
                <AlertTriangle size={20} color="#EF476F" />
                <CardTitle>Famílias em Múltiplas Instituições</CardTitle>
              </View>
            </CardHeader>
            <CardContent>
              <Text className="mb-3 text-sm text-muted-foreground">
                Famílias vinculadas à sua instituição que também estão cadastradas em outras
                instituições. Toque para ver detalhes.
              </Text>
              {multiInstFamilies.map((family) => (
                <FraudAlertCard
                  key={family.id}
                  family={family}
                  onPress={() => setSelectedFamily(family)}
                />
              ))}
            </CardContent>
          </Card>
        ) : null}

        <View className="flex-row flex-wrap gap-3">
          <DashboardCard
            title="Total de Entregas"
            value={isLoading ? '...' : String(periodStats.totalDeliveries)}
            description="Entregas no período filtrado"
            icon={<Package size={24} color="#004E64" />}
          />
          <DashboardCard
            title="Famílias Atendidas"
            value={isLoading ? '...' : String(periodStats.uniqueFamilies)}
            description="Famílias únicas atendidas"
            icon={<Users size={24} color="#004E64" />}
          />
          <DashboardCard
            title="Total de Itens"
            value={isLoading ? '...' : String(periodStats.totalItems)}
            description="Itens entregues no período"
            icon={<BarChart3 size={24} color="#004E64" />}
          />
        </View>

        <InstitutionDeliveriesChart data={chartData} isLoading={chartLoading} />

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Entregas</CardTitle>
          </CardHeader>
          <CardContent>
            <FlatList
              data={deliveryRows}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => {
                const items = item.stock_movements?.filter((m) => m.status !== 'CANCELLED') ?? [];
                const itemSummary = items
                  .slice(0, 2)
                  .map((m) => `${m.product?.name ?? 'Item'} (${m.quantity})`)
                  .join(', ');

                return (
                  <Pressable
                    onPress={() => setSelectedDelivery(item)}
                    className="mb-2 border-b border-border pb-3"
                  >
                    <View className="flex-row items-start justify-between gap-2">
                      <View className="flex-1">
                        <Text className="font-medium">{item.family?.name ?? 'Família'}</Text>
                        <Text className="text-xs text-muted-foreground">
                          {formatDateBrasilia(item.delivery_date)}
                        </Text>
                        <Text className="text-xs text-muted-foreground">
                          {item.family?.contact_person ?? '—'}
                        </Text>
                        {itemSummary ? (
                          <Text className="mt-1 text-xs text-muted-foreground" numberOfLines={1}>
                            {itemSummary}
                            {items.length > 2 ? '…' : ''}
                          </Text>
                        ) : null}
                      </View>
                      <View className="items-end gap-1">
                        <Badge variant="outline">{item.blocking_period_days ?? 0}d bloqueio</Badge>
                        {item.blocking_justification ? (
                          <Badge variant="destructive">Justificada</Badge>
                        ) : null}
                        <Eye size={16} color="#6B7280" />
                      </View>
                    </View>
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                !isLoading ? (
                  <Text className="text-center text-muted-foreground">
                    Nenhuma entrega registrada
                  </Text>
                ) : null
              }
            />
          </CardContent>
        </Card>
      </View>

      <Dialog open={!!selectedFamily} onOpenChange={(open) => !open && setSelectedFamily(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedFamily?.name}</DialogTitle>
            <DialogDescription>Alerta de possível fraude</DialogDescription>
          </DialogHeader>
          {selectedFamily ? (
            <View className="gap-2">
              <Text className="text-sm">
                <Text className="font-semibold">Contato: </Text>
                {selectedFamily.contact_person}
              </Text>
              {selectedFamily.cpf ? (
                <Text className="text-sm">
                  <Text className="font-semibold">CPF: </Text>
                  {formatCpf(selectedFamily.cpf)}
                </Text>
              ) : null}
              <Text className="font-semibold text-sm">Instituições vinculadas:</Text>
              {selectedFamily.institutions.map((inst) => (
                <Text key={inst.id} className="text-sm text-muted-foreground">
                  • {inst.name}
                </Text>
              ))}
              <Text className="mt-2 text-xs text-danger">
                Esta família está cadastrada em {selectedFamily.institutions.length} instituições.
                Verifique antes de registrar novas entregas.
              </Text>
            </View>
          ) : null}
          <View className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onPress={() => setSelectedFamily(null)}>
              Fechar
            </Button>
            <Button
              className="flex-1"
              onPress={() => {
                setSelectedFamily(null);
                router.push('/(institution)/families');
              }}
            >
              Ver Famílias
            </Button>
          </View>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedDelivery}
        onOpenChange={(open) => !open && setSelectedDelivery(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Entrega</DialogTitle>
            <DialogDescription>
              {selectedDelivery?.family?.name ?? 'Família'}
            </DialogDescription>
          </DialogHeader>
          {selectedDelivery ? (
            <View className="gap-2">
              <Text className="text-sm">
                <Text className="font-semibold">Data: </Text>
                {formatDateTimeBrasilia(selectedDelivery.delivery_date)}
              </Text>
              <Text className="text-sm">
                <Text className="font-semibold">Contato: </Text>
                {selectedDelivery.family?.contact_person ?? '—'}
              </Text>
              <Text className="text-sm">
                <Text className="font-semibold">Bloqueio: </Text>
                {selectedDelivery.blocking_period_days ?? 0} dias
              </Text>
              {(selectedDelivery.stock_movements ?? []).length > 0 ? (
                <View className="gap-1">
                  <Text className="font-semibold text-sm">Itens entregues:</Text>
                  {selectedDelivery.stock_movements?.map((movement, index) => (
                    <Text key={index} className="text-sm text-muted-foreground">
                      • {movement.product?.name ?? 'Produto'} — {movement.quantity}{' '}
                      {movement.product?.unit ?? 'un'}
                      {movement.status === 'CANCELLED' ? ' (cancelado)' : ''}
                    </Text>
                  ))}
                </View>
              ) : null}
              {selectedDelivery.notes ? (
                <Text className="text-sm">
                  <Text className="font-semibold">Observações: </Text>
                  {selectedDelivery.notes}
                </Text>
              ) : null}
              {selectedDelivery.blocking_justification ? (
                <View className="rounded-lg border border-danger bg-danger/10 p-2">
                  <Text className="text-sm text-danger">
                    <Text className="font-semibold">Justificativa anti-fraude: </Text>
                    {selectedDelivery.blocking_justification}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
          <Button variant="outline" onPress={() => setSelectedDelivery(null)}>
            Fechar
          </Button>
        </DialogContent>
      </Dialog>
    </ScrollView>
  );
}
