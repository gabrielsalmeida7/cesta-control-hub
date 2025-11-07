
import React, { useState, useMemo } from 'react';
import Header from '@/components/Header';
import InstitutionNavigationButtons from '@/components/InstitutionNavigationButtons';
import { Calendar, Download, Package, Users, BarChart3, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import DashboardCard from '@/components/DashboardCard';
import { useInstitutionDeliveries } from '@/hooks/useInstitutionDeliveries';
import { useReportExport } from '@/hooks/useReportExport';


const InstitutionReports = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: deliveries = [], isLoading, error } = useInstitutionDeliveries(startDate, endDate);
  const { exportDeliveriesReport } = useReportExport();

  const filteredDeliveries = deliveries;

  const totalDeliveries = filteredDeliveries.length;
  const totalFamilies = new Set(filteredDeliveries.map(d => d.family?.id)).size;
  const totalItems = filteredDeliveries.length; // Assumindo 1 item por entrega (cesta básica)

  const exportReport = () => {
    exportDeliveriesReport(startDate, endDate);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <InstitutionNavigationButtons />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <InstitutionNavigationButtons />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-red-600">Erro ao carregar relatórios: {error.message}</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <InstitutionNavigationButtons />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Relatórios de Entregas
            </h2>
            <p className="text-gray-600">
              Acompanhe as entregas realizadas pela sua instituição
            </p>
          </div>

          {/* Filtros */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Data Inicial</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Data Final</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={exportReport} variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Relatório
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas do Período */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <DashboardCard
              title="Total de Entregas"
              value={totalDeliveries.toString()}
              description="Entregas realizadas no período"
              icon={<Package className="h-6 w-6" />}
            />
            
            <DashboardCard
              title="Famílias Atendidas"
              value={totalFamilies.toString()}
              description="Famílias únicas atendidas"
              icon={<Users className="h-6 w-6" />}
            />
            
            <DashboardCard
              title="Total de Itens"
              value={totalItems.toString()}
              description="Itens entregues no período"
              icon={<BarChart3 className="h-6 w-6" />}
            />
          </div>

          {/* Tabela de Entregas */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Entregas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Família</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Itens Entregues</TableHead>
                    <TableHead>Período Bloqueio</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeliveries.map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell>
                        {new Date(delivery.delivery_date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="font-medium">
                        {delivery.family?.name || 'N/A'}
                      </TableCell>
                      <TableCell>{delivery.family?.contact_person || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="secondary" className="text-xs">
                            Cesta Básica
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {delivery.blocking_period_days} dias
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {delivery.notes || '-'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredDeliveries.length === 0 && (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Nenhuma entrega encontrada no período selecionado
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Família</TableHead>
                      <TableHead>Itens Entregues</TableHead>
                      <TableHead>Período Bloqueio</TableHead>
                      <TableHead>Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDeliveries.map((delivery) => (
                      <TableRow key={delivery.id}>
                        <TableCell>
                          {new Date(delivery.delivery_date).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="font-medium">
                          {delivery.family_name}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {delivery.items_delivered.map((item, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {delivery.blocking_period} dias
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {delivery.notes || '-'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default InstitutionReports;
