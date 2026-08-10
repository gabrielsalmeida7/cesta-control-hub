
import React, { useState, useMemo } from 'react';
import { Search, Download, Package, Users, BarChart3, Loader2, Eye, FileText, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DashboardCard from '@/components/DashboardCard';
import { InstitutionLayout } from '@/components/layout/InstitutionLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  DeliveryReportMobileCard,
  DeliveryReportItemsFallback,
} from '@/components/institution/DeliveryReportMobileCard';
import {
  FamilyReportSelector,
  slugifyFamilyName,
} from '@/components/institution/FamilyReportSelector';
import { useInstitutionDeliveries } from '@/hooks/useInstitutionDeliveries';
import { useInstitutionReportExport } from '@/hooks/useInstitutionReportExport';
import { useInstitutionData } from '@/hooks/useInstitutions';
import { useInstitutionFamilies } from '@/hooks/useFamilies';
import { useFamiliesWithMultipleInstitutions } from '@/hooks/useAlerts';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatDateBrasilia, formatDateTimeBrasilia } from '@/utils/dateFormat';
import {
  countDeliveryItems,
  parseDeliveryNotes,
  type DeliveryMovementItem,
} from '@/utils/deliveryItems';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

type ReportType = 'deliveries-summary' | 'family-items-by-date';

const renderDeliveryMovementBadges = (deliveryItems: DeliveryMovementItem[]) =>
  deliveryItems.map((movement, index) => {
    const cancelled = movement.status === 'CANCELLED';
    const unit = movement.product?.unit || 'unidade';

    return (
      <Badge
        key={index}
        variant={cancelled ? 'secondary' : 'outline'}
        className={`text-xs ${cancelled ? 'line-through opacity-70' : ''}`}
        title={
          cancelled
            ? `Cancelado: ${movement.cancellation_reason || 'sem motivo registrado'}`
            : `${movement.quantity} ${unit}`
        }
      >
        {movement.product?.name || 'Produto'}
        <span className="ml-1 text-gray-500">
          ({movement.quantity} {unit})
        </span>
        {cancelled ? <span className="ml-1">· cancelado</span> : null}
      </Badge>
    );
  });

const renderDeliveryMovementDetails = (deliveryItems: DeliveryMovementItem[]) =>
  deliveryItems.map((movement, index) => {
    const cancelled = movement.status === 'CANCELLED';
    const unit = movement.product?.unit || 'unidade';

    return (
      <div
        key={index}
        className={`flex items-center gap-2 bg-white p-2 rounded border ${cancelled ? 'opacity-60' : ''}`}
      >
        <Badge variant={cancelled ? 'secondary' : 'outline'} className="text-xs">
          {movement.product?.name || 'Produto'}
          {cancelled ? ' (cancelado)' : ''}
        </Badge>
        <span className={`text-sm text-gray-600 ${cancelled ? 'line-through' : ''}`}>
          {movement.quantity} {unit}
        </span>
      </div>
    );
  });

const formatBrDateInput = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

const parseBrDateToIso = (value: string): string | null => {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  if (year < 1000 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return `${match[3]}-${match[2]}-${match[1]}`;
};

const buildPeriodLabel = (startDate: string, endDate: string): string => {
  if (startDate && endDate) {
    return `${formatDateBrasilia(startDate)} a ${formatDateBrasilia(endDate)}`;
  }
  if (startDate) {
    return `A partir de ${formatDateBrasilia(startDate)}`;
  }
  if (endDate) {
    return `Até ${formatDateBrasilia(endDate)}`;
  }
  return 'Todos os períodos';
};

const InstitutionReports = () => {
  const [draftStartDate, setDraftStartDate] = useState('');
  const [draftEndDate, setDraftEndDate] = useState('');
  const [appliedStartDate, setAppliedStartDate] = useState('');
  const [appliedEndDate, setAppliedEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [reportType, setReportType] = useState<ReportType>('family-items-by-date');
  const [selectedFamilyId, setSelectedFamilyId] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const { data: deliveries = [], isLoading, error } = useInstitutionDeliveries(appliedStartDate, appliedEndDate);
  const { data: institutionFamilies = [] } = useInstitutionFamilies(profile?.institution_id);
  const { data: familiesWithMultiple = [] } = useFamiliesWithMultipleInstitutions(profile?.institution_id);
  const { data: institutionData } = useInstitutionData();
  const {
    exportDeliveriesSummary,
    exportFamilyItemsByDateCSV,
    exportFamilyItemsByDatePDF,
  } = useInstitutionReportExport();

  const filteredDeliveries = useMemo(() => {
    let result = deliveries;

    if (selectedFamilyId && selectedFamilyId !== 'all') {
      result = result.filter((delivery) => {
        const familyId = delivery.family?.id ?? (delivery as { family_id?: string }).family_id;
        return String(familyId) === selectedFamilyId;
      });
    }

    const q = searchTerm.trim().toLowerCase();
    if (!q) return result;

    return result.filter((delivery) => {
      const familyName = (delivery.family?.name ?? '').toLowerCase();
      const contactPerson = (delivery.family?.contact_person ?? '').toLowerCase();
      return familyName.includes(q) || contactPerson.includes(q);
    });
  }, [deliveries, searchTerm, selectedFamilyId]);

  const selectedFamily = useMemo(
    () => institutionFamilies.find((family) => family.id === selectedFamilyId),
    [institutionFamilies, selectedFamilyId]
  );

  const familyReportOptions = useMemo(
    () =>
      institutionFamilies.map((family) => ({
        id: family.id,
        name: family.name,
        contact_person: family.contact_person,
      })),
    [institutionFamilies]
  );

  const applyDateFilters = () => {
    if (draftStartDate.trim()) {
      const startIso = parseBrDateToIso(draftStartDate);
      if (!startIso) {
        toast({
          title: 'Data inválida',
          description: 'Informe a data inicial no formato DD/MM/AAAA.',
          variant: 'destructive',
        });
        return;
      }
      setAppliedStartDate(startIso);
    } else {
      setAppliedStartDate('');
    }

    if (draftEndDate.trim()) {
      const endIso = parseBrDateToIso(draftEndDate);
      if (!endIso) {
        toast({
          title: 'Data inválida',
          description: 'Informe a data final no formato DD/MM/AAAA.',
          variant: 'destructive',
        });
        return;
      }
      setAppliedEndDate(endIso);
    } else {
      setAppliedEndDate('');
    }
  };

  const totalDeliveries = filteredDeliveries.length;
  const totalFamilies = new Set(filteredDeliveries.map(d => d.family?.id)).size;
  const totalItems = filteredDeliveries.reduce(
    (total, delivery) => total + countDeliveryItems(delivery),
    0
  );

  const periodLabel = buildPeriodLabel(appliedStartDate, appliedEndDate);
  const institutionName = institutionData?.name || 'Instituição';

  const getFamilyExportMeta = () => {
    if (!selectedFamily) {
      return { familyLabel: undefined, filenamePrefix: 'relatorio_itens_por_familia' };
    }

    const contactSuffix = selectedFamily.contact_person
      ? ` (${selectedFamily.contact_person})`
      : '';

    return {
      familyLabel: `${selectedFamily.name}${contactSuffix}`,
      filenamePrefix: `relatorio_itens_${slugifyFamilyName(selectedFamily.name)}`,
    };
  };

  const canExportFamilyItemsPdf =
    reportType === 'family-items-by-date' &&
    Boolean(selectedFamilyId && selectedFamilyId !== 'all');

  const pdfDisabledReason = (() => {
    if (reportType === 'deliveries-summary') {
      return 'PDF disponível apenas no relatório "Itens por família e data".';
    }
    if (!selectedFamilyId || selectedFamilyId === 'all') {
      return 'Selecione uma família no campo acima para exportar PDF.';
    }
    return null;
  })();

  const handleExportCSV = () => {
    if (reportType === 'family-items-by-date' && !selectedFamilyId) {
      toast({
        title: 'Família não selecionada',
        description: 'Selecione uma família para exportar o relatório de itens.',
        variant: 'destructive',
      });
      return;
    }

    if (reportType === 'deliveries-summary') {
      exportDeliveriesSummary(filteredDeliveries);
      return;
    }

    const { filenamePrefix } = getFamilyExportMeta();
    exportFamilyItemsByDateCSV(filteredDeliveries, { filenamePrefix });
  };

  const handleExportPDF = () => {
    if (!selectedFamilyId) {
      toast({
        title: 'Família não selecionada',
        description: 'Selecione uma família para exportar o relatório de itens.',
        variant: 'destructive',
      });
      return;
    }

    const { familyLabel, filenamePrefix } = getFamilyExportMeta();
    exportFamilyItemsByDatePDF(filteredDeliveries, {
      institutionName,
      periodLabel,
      familyLabel,
      filenamePrefix,
    });
  };

  const handleReportTypeChange = (value: ReportType) => {
    setReportType(value);
    if (value === 'family-items-by-date' && selectedFamilyId === 'all') {
      setSelectedFamilyId('');
    }
    if (value === 'deliveries-summary' && !selectedFamilyId) {
      setSelectedFamilyId('all');
    }
  };

  const renderDeliveryItems = (delivery: (typeof filteredDeliveries)[number]) => {
    const deliveryItems = (delivery as { stock_movements?: DeliveryMovementItem[] }).stock_movements || [];

    if (deliveryItems.length === 0) {
      const { items: additionalItems } = parseDeliveryNotes(delivery.notes);
      return (
        <>
          <DeliveryReportItemsFallback />
          {additionalItems.map((item, index) => (
            <Badge key={index} variant="outline" className="text-xs" title={`${item.quantity} ${item.unit}`}>
              {item.name}
            </Badge>
          ))}
        </>
      );
    }

    return renderDeliveryMovementBadges(deliveryItems);
  };


  const loadingContent = (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );

  if (isLoading) {
    return (
      <InstitutionLayout title="Relatórios">
        {loadingContent}
      </InstitutionLayout>
    );
  }

  if (error) {
    return (
      <InstitutionLayout title="Relatórios">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-red-600">Erro ao carregar relatórios: {error.message}</p>
          </CardContent>
        </Card>
      </InstitutionLayout>
    );
  }

  return (
    <InstitutionLayout title="Relatórios">
      <PageHeader
        title="Relatórios de Entregas"
        description="Acompanhe as entregas realizadas pela sua instituição"
      />

          {/* Filtros */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="delivery-search" className="text-sm text-muted-foreground">
                    Buscar
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="delivery-search"
                      placeholder="Nome da família ou contato..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="start-date" className="text-sm font-medium mb-2 block">
                    Data Inicial
                  </Label>
                  <Input
                    id="start-date"
                    type="text"
                    inputMode="numeric"
                    placeholder="DD/MM/AAAA"
                    maxLength={10}
                    value={draftStartDate}
                    onChange={(e) => setDraftStartDate(formatBrDateInput(e.target.value))}
                    onKeyDown={(e) => e.key === 'Enter' && applyDateFilters()}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date" className="text-sm font-medium mb-2 block">
                    Data Final
                  </Label>
                  <Input
                    id="end-date"
                    type="text"
                    inputMode="numeric"
                    placeholder="DD/MM/AAAA"
                    maxLength={10}
                    value={draftEndDate}
                    onChange={(e) => setDraftEndDate(formatBrDateInput(e.target.value))}
                    onKeyDown={(e) => e.key === 'Enter' && applyDateFilters()}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={applyDateFilters} className="w-full">
                    Filtrar
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FamilyReportSelector
                  families={familyReportOptions}
                  value={selectedFamilyId}
                  onValueChange={setSelectedFamilyId}
                  allowAll={reportType === 'deliveries-summary'}
                  required={reportType === 'family-items-by-date'}
                />
                <div>
                  <Label htmlFor="report-type" className="text-sm font-medium mb-2 block">
                    Tipo de relatório
                  </Label>
                  <Select
                    value={reportType}
                    onValueChange={(value) => handleReportTypeChange(value as ReportType)}
                  >
                    <SelectTrigger id="report-type">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="family-items-by-date">
                        Itens por família e data
                      </SelectItem>
                      <SelectItem value="deliveries-summary">
                        Entregas (resumo)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-end">
                  <Button onClick={handleExportCSV} variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </Button>
                </div>
                <div className="space-y-2">
                  <Button
                    onClick={handleExportPDF}
                    variant="outline"
                    className="w-full"
                    disabled={!canExportFamilyItemsPdf}
                    title={pdfDisabledReason ?? undefined}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Exportar PDF
                  </Button>
                  {pdfDisabledReason ? (
                    <p className="text-xs text-muted-foreground">{pdfDisabledReason}</p>
                  ) : null}
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
                          {(family.cpf_masked || family.cpf) && (
                            <p>
                              <strong>CPF:</strong>{' '}
                              {family.cpf_masked ??
                                family.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                            </p>
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
              {isMobile ? (
                <div className="space-y-3">
                  {filteredDeliveries.length > 0 ? (
                    filteredDeliveries.map((delivery) => {
                      const blockingJustification = (delivery as { blocking_justification?: string }).blocking_justification;
                      const { observations } = parseDeliveryNotes(delivery.notes);

                      return (
                        <DeliveryReportMobileCard
                          key={delivery.id}
                          deliveryDate={delivery.delivery_date}
                          familyName={delivery.family?.name || 'N/A'}
                          contactPerson={delivery.family?.contact_person}
                          itemsContent={renderDeliveryItems(delivery)}
                          blockingPeriodDays={delivery.blocking_period_days}
                          hasJustification={!!blockingJustification}
                          justificationPreview={blockingJustification}
                          observationsPreview={observations || '-'}
                          onViewDetails={() => {
                            setSelectedDelivery(delivery);
                            setIsDetailsOpen(true);
                          }}
                        />
                      );
                    })
                  ) : (
                    <div className="py-8 text-center">
                      <Package className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                      <p className="text-gray-500">
                        {searchTerm.trim()
                          ? 'Nenhuma entrega encontrada para a busca'
                          : appliedStartDate || appliedEndDate
                            ? 'Nenhuma entrega encontrada no período selecionado'
                            : 'Nenhuma entrega registrada ainda'}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
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
                            {(() => {
                              // Buscar itens das movimentações de estoque vinculadas à entrega
                              const deliveryItems = (delivery as any).stock_movements || [];
                              
                              if (deliveryItems.length === 0) {
                                // Fallback: tentar parsear do notes (para entregas antigas)
                                const { items: additionalItems } = parseDeliveryNotes(delivery.notes);
                                return (
                                  <>
                                    <Badge variant="secondary" className="text-xs">
                                      <Package className="h-3 w-3 mr-1" />
                                      Cesta Básica
                                    </Badge>
                                    {additionalItems.map((item, index) => (
                                      <Badge key={index} variant="outline" className="text-xs" title={`${item.quantity} ${item.unit}`}>
                                        {item.name}
                                      </Badge>
                                    ))}
                                  </>
                                );
                              }
                              
                              // Exibir itens das movimentações de estoque
                              return renderDeliveryMovementBadges(deliveryItems);
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
                          {searchTerm.trim()
                            ? 'Nenhuma entrega encontrada para a busca'
                            : appliedStartDate || appliedEndDate
                              ? 'Nenhuma entrega encontrada no período selecionado'
                              : 'Nenhuma entrega registrada ainda'}
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              )}
            </CardContent>
          </Card>

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
                    {(() => {
                      // Buscar itens das movimentações de estoque vinculadas à entrega
                      const deliveryItems = (selectedDelivery as any).stock_movements || [];
                      
                      if (deliveryItems.length === 0) {
                        // Fallback: tentar parsear do notes (para entregas antigas)
                        return (
                          <>
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
                          </>
                        );
                      }
                      
                      // Exibir itens das movimentações de estoque
                      return renderDeliveryMovementDetails(deliveryItems);
                    })()}
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
    </InstitutionLayout>
  );
};

export default InstitutionReports;
