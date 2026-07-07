import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useReportExport } from '@/hooks/useReportExport';
import { useAlerts, useFamiliesWithMultipleInstitutions } from '@/hooks/useAlerts';
import { AlertTriangle } from 'lucide-react-native';

export default function AdminReportsScreen() {
  const {
    exportDeliveriesReport,
    exportFamiliesReport,
    exportInstitutionsReport,
    exportSummaryReport,
  } = useReportExport();
  const { data: alerts = [] } = useAlerts();
  const { data: multiInst = [] } = useFamiliesWithMultipleInstitutions();
  const [loading, setLoading] = useState<string | null>(null);

  const runExport = async (key: string, fn: () => Promise<void>) => {
    setLoading(key);
    try {
      await fn();
    } finally {
      setLoading(null);
    }
  };

  const unresolvedAlerts = alerts.filter((alert) => !alert.resolved);

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="gap-4 p-4">
        <Text className="text-xl font-bold">Relatórios</Text>

        {(unresolvedAlerts.length > 0 || multiInst.length > 0) && (
          <Card className="border-danger">
            <CardHeader>
              <View className="flex-row items-center gap-2">
                <AlertTriangle size={20} color="#EF476F" />
                <CardTitle>Alertas</CardTitle>
              </View>
            </CardHeader>
            <CardContent className="gap-3">
              <Text className="text-sm">
                {unresolvedAlerts.length} alerta(s) · {multiInst.length} família(s) em múltiplas
                instituições
              </Text>

              {unresolvedAlerts.length > 0 && (
                <View className="gap-2">
                  <Text className="font-medium">Alertas recentes</Text>
                  {unresolvedAlerts.slice(0, 5).map((alert) => (
                    <View key={alert.id} className="rounded-lg border border-border p-3">
                      <View className="flex-row items-center gap-2">
                        <Badge
                          variant={alert.severity === 'alta' ? 'destructive' : 'outline'}
                        >
                          {alert.severity}
                        </Badge>
                        <Text className="font-medium">{alert.title}</Text>
                      </View>
                      <Text className="mt-1 text-sm text-muted-foreground">
                        {alert.description}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {multiInst.length > 0 && (
                <View className="gap-2">
                  <Text className="font-medium">Famílias em múltiplas instituições</Text>
                  {multiInst.slice(0, 5).map((family) => (
                    <View key={family.id} className="rounded-lg border border-border p-3">
                      <Text className="font-medium">{family.name}</Text>
                      <Text className="text-sm text-muted-foreground">
                        {family.institutions.map((inst) => inst.name).join(' · ')}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Exportar Relatórios (CSV)</CardTitle>
          </CardHeader>
          <CardContent className="gap-2">
            <Button
              loading={loading === 'deliveries'}
              onPress={() => runExport('deliveries', exportDeliveriesReport)}
            >
              Entregas
            </Button>
            <Button
              loading={loading === 'families'}
              onPress={() => runExport('families', exportFamiliesReport)}
            >
              Famílias
            </Button>
            <Button
              loading={loading === 'institutions'}
              onPress={() => runExport('institutions', exportInstitutionsReport)}
            >
              Instituições
            </Button>
            <Button
              loading={loading === 'summary'}
              onPress={() => runExport('summary', exportSummaryReport)}
            >
              Resumo Geral
            </Button>
          </CardContent>
        </Card>
      </View>
    </ScrollView>
  );
}
