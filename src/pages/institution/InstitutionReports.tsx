
import React, { useState } from 'react';
import Header from '@/components/Header';
import InstitutionNavigationButtons from '@/components/InstitutionNavigationButtons';
import { Calendar, Download, Package, Users, BarChart3, Loader2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import DashboardCard from '@/components/DashboardCard';
import { useInstitutionDeliveries } from '@/hooks/useInstitutionDeliveries';
import { useReportExport } from '@/hooks/useReportExport';
import { useFamiliesWithMultipleInstitutions } from '@/hooks/useAlerts';
import { useAuth } from '@/hooks/useAuth';
import { formatDateBrasilia, formatDateTimeBrasilia } from '@/utils/dateFormat';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';


// Função para parsear itens adicionais e observações do campo notes
const parseDeliveryNotes = (notes: string | null | undefined) => {
  if (!notes) return { items: [], observations: null };
  
  const itemsStartIndex = notes.indexOf('__ITEMS_START__');
  const itemsEndIndex = notes.indexOf('__ITEMS_END__');
  
  if (itemsStartIndex !== -1 && itemsEndIndex !== -1) {
    // Extrair itens
    const itemsSection = notes.substring(
      itemsStartIndex + '__ITEMS_START__'.length,
      itemsEndIndex
    ).trim();
    
    const items = itemsSection
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [name, quantity, unit] = line.split('|');
        return {
          name: name?.trim() || '',
          quantity: parseInt(quantity?.trim() || '1'),
          unit: unit?.trim() || 'unidade'
        };
      })
      .filter(item => item.name);
    
    // Extrair observações (tudo depois de __ITEMS_END__)
    const observations = notes.substring(itemsEndIndex + '__ITEMS_END__'.length).trim();
    
    return {
      items,
      observations: observations || null
    };
  }
  
  // Se não há itens estruturados, tudo é observação
  return {
    items: [],
    observations: notes
  };
};

const InstitutionReports = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { profile } = useAuth();

  const { data: deliveries = [], isLoading, error } = useInstitutionDeliveries(startDate, endDate);
  const { data: familiesWithMultiple = [], isLoading: familiesLoading } = useFamiliesWithMultipleInstitutions(profile?.institution_id);
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

          {/* Alert: Famílias em Múltiplas Instituições */}
          {familiesWithMultiple.length > 0 && (
            <Card className="mb-6 border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <AlertTriangle className="h-5 w-5" />
                  Famílias em Múltiplas Instituições
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-orange-700 mb-4">
                  As seguintes famílias vinculadas à sua instituição também estão cadastradas em outras instituições:
                </p>
                <div className="space-y-3">
                  {familiesWithMultiple.map((family) => (
                    <Alert key={family.id} className="bg-white border-orange-200">
                      <AlertTitle className="flex items-center gap-2">
                        {family.name}
                        <Badge variant="outline" className="bg-orange-50 text-orange-700">
                          {family.institutions.length} instituições
                        </Badge>
                      </AlertTitle>
                      <AlertDescription className="mt-2">
                        <div className="space-y-1 text-sm">
                          <p><strong>Contato:</strong> {family.contact_person}</p>
                          {family.cpf && (
                            <p><strong>CPF:</strong> {family.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</p>
                          )}
                          <div>
                            <strong>Instituições:</strong>
                            <ul className="list-disc list-inside mt-1">
                              {family.institutions.map((inst) => (
                                <li key={inst.id}>{inst.name}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

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
                    <TableHead>Justificativa</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeliveries.length > 0 ? (
                    filteredDeliveries.map((delivery) => (
                      <TableRow key={delivery.id}>
                        <TableCell>
                          {formatDateBrasilia(delivery.delivery_date)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {delivery.family?.name || 'N/A'}
                        </TableCell>
                        <TableCell>{delivery.family?.contact_person || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="secondary" className="text-xs">
                              <Package className="h-3 w-3 mr-1" />
                              Cesta Básica
                            </Badge>
                            {(() => {
                              const { items: additionalItems } = parseDeliveryNotes(delivery.notes);
                              return additionalItems.map((item, index) => (
                                <Badge key={index} variant="outline" className="text-xs" title={`${item.quantity} ${item.unit}`}>
                                  {item.name}
                                </Badge>
                              ));
                            })()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {delivery.blocking_period_days} dias
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600 line-clamp-2 max-w-xs">
                            {(() => {
                              const { observations } = parseDeliveryNotes(delivery.notes);
                              if (!observations) return '-';
                              return observations.length > 50 
                                ? `${observations.substring(0, 50)}...`
                                : observations;
                            })()}
                          </span>
                        </TableCell>
                        <TableCell>
                          {(delivery as any).blocking_justification ? (
                            <div className="max-w-xs">
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                Justificada
                              </Badge>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {(delivery as any).blocking_justification}
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedDelivery(delivery);
                              setIsDetailsOpen(true);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">
                          {startDate || endDate 
                            ? 'Nenhuma entrega encontrada no período selecionado'
                            : 'Nenhuma entrega registrada ainda'}
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Modal de Detalhes da Entrega */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>Detalhes da Entrega</DialogTitle>
            <DialogDescription>
              Informações completas sobre a entrega realizada
            </DialogDescription>
          </DialogHeader>
          
          {selectedDelivery && (() => {
            const { items: additionalItems, observations } = parseDeliveryNotes(selectedDelivery.notes);
            
            return (
              <div className="px-6 space-y-4 overflow-y-auto flex-1 min-h-0">
                {/* Informações da Família */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-3">Família Atendida</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Nome:</strong> {selectedDelivery.family?.name || 'N/A'}</p>
                    <p><strong>Contato:</strong> {selectedDelivery.family?.contact_person || 'N/A'}</p>
                  </div>
                </div>

                {/* Data da Entrega */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Data da Entrega</h4>
                  <p className="text-sm">{formatDateTimeBrasilia(selectedDelivery.delivery_date)}</p>
                </div>

                {/* Itens Entregues */}
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-3">Itens Entregues</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-sm">
                        <Package className="h-3 w-3 mr-1" />
                        Cesta Básica
                      </Badge>
                      <span className="text-sm text-gray-600">1 unidade</span>
                    </div>
                    {additionalItems.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-green-200">
                        <p className="text-sm font-medium text-green-800 mb-2">Itens Adicionais:</p>
                        <div className="space-y-2">
                          {additionalItems.map((item, index) => (
                            <div key={index} className="flex items-center gap-2 bg-white p-2 rounded border">
                              <Badge variant="outline" className="text-xs">
                                {item.name}
                              </Badge>
                              <span className="text-sm text-gray-600">
                                {item.quantity} {item.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Período de Bloqueio */}
                <div className="p-4 bg-orange-50 rounded-lg">
                  <h4 className="font-medium text-orange-800 mb-2">Período de Bloqueio</h4>
                  <Badge variant="outline" className="bg-white">
                    {selectedDelivery.blocking_period_days} dias
                  </Badge>
                </div>

                {/* Observações */}
                {observations && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">Observações</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {observations}
                    </p>
                  </div>
                )}

                {/* Justificativa (se houver) */}
                {(selectedDelivery as any).blocking_justification && (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h4 className="font-medium text-yellow-800 mb-2">Justificativa para Entrega</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {(selectedDelivery as any).blocking_justification}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
          
          <DialogFooter className="px-6 pb-6 pt-4 border-t">
            <Button onClick={() => setIsDetailsOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InstitutionReports;
