import React, { useState, useMemo, useEffect } from 'react';
import {
  useStockMovements,
  useCancelStockMovement,
  useCancelDeliveryMovements,
  type StockMovementStatus,
} from '@/hooks/useInventory';
import { useAuth } from '@/hooks/useAuth';
import { useInstitutions } from '@/hooks/useInstitutions';
import { useGenerateMovementReceipt, useGenerateDeliveryReceipt } from '@/hooks/useReceipts';
import { Button } from '@/components/ui/button';
import { Plus, Download, Eye, Loader2, Ban } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDateTimeBrasilia } from '@/utils/dateFormat';
import StockEntryForm from './StockEntryForm';
import StockExitForm from './StockExitForm';
import DeliveryDetailsModal from './DeliveryDetailsModal';
import CancelMovementDialog, { type CancelMovementDialogTarget } from './CancelMovementDialog';
import type { Tables } from '@/integrations/supabase/types';

type StockMovement = Tables<'stock_movements'> & {
  product: { id: string; name: string; unit: string };
  supplier: { id: string; name: string } | null;
  institution: { id: string; name: string };
  delivery: {
    id: string;
    delivery_date: string | null;
    family: { id: string; name: string } | null;
  } | null;
  beneficiary_institution: { id: string; full_name: string; trade_name: string | null } | null;
};

type GroupedMovement = {
  type: 'grouped';
  delivery_id: string;
  delivery_date: string;
  family_name: string;
  institution_name: string;
  item_count: number;
  active_count: number;
  cancelled_count: number;
  movements: StockMovement[];
};

type IndividualMovement = {
  type: 'individual';
  movement: StockMovement;
};

type ProcessedMovement = GroupedMovement | IndividualMovement;

interface StockMovementsTabProps {
  institutionId?: string;
}

const isMovementCancelled = (movement: StockMovement) => movement.status === 'CANCELLED';

const MovementStatusBadge = ({ movement }: { movement: StockMovement }) => {
  if (isMovementCancelled(movement)) {
    return <Badge variant="secondary">Cancelada</Badge>;
  }
  return <Badge variant="outline">Ativa</Badge>;
};

const CancellationNotes = ({ movement }: { movement: StockMovement }) => {
  if (!isMovementCancelled(movement)) {
    return <span>{movement.notes || '-'}</span>;
  }

  const tooltipContent = [
    movement.cancellation_reason,
    movement.cancelled_at
      ? `Cancelada em ${formatDateTimeBrasilia(movement.cancelled_at)}`
      : null,
  ]
    .filter(Boolean)
    .join(' — ');

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-help text-muted-foreground truncate block max-w-xs">
          {movement.cancellation_reason || 'Cancelada'}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-sm">
        <p>{tooltipContent}</p>
      </TooltipContent>
    </Tooltip>
  );
};

const StockMovementsTab = ({ institutionId: propInstitutionId }: StockMovementsTabProps) => {
  const { profile } = useAuth();
  const { data: institutions = [] } = useInstitutions();
  const isAdmin = profile?.role === 'admin';

  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string | undefined>(
    isAdmin ? undefined : (propInstitutionId || profile?.institution_id)
  );

  const [filters, setFilters] = useState<{
    startDate?: string;
    endDate?: string;
    movementType?: 'ENTRADA' | 'SAIDA';
    status?: StockMovementStatus;
  }>({});
  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false);
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedDeliveryMovements, setSelectedDeliveryMovements] = useState<StockMovement[]>([]);
  const [selectedDeliveryMeta, setSelectedDeliveryMeta] = useState<{
    deliveryId: string;
    familyName: string;
  } | null>(null);
  const [generatingReceiptId, setGeneratingReceiptId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<CancelMovementDialogTarget | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  const generateMovementReceipt = useGenerateMovementReceipt();
  const generateDeliveryReceipt = useGenerateDeliveryReceipt();
  const cancelStockMovement = useCancelStockMovement();
  const cancelDeliveryMovements = useCancelDeliveryMovements();

  const { data: movements = [], isLoading } = useStockMovements({
    ...filters,
    institutionId: selectedInstitutionId,
  });

  const processMovements = (allMovements: StockMovement[]): ProcessedMovement[] => {
    const groupedMap = new Map<string, StockMovement[]>();
    const individualMovements: StockMovement[] = [];

    allMovements.forEach((movement) => {
      if (movement.delivery_id && movement.movement_type === 'SAIDA') {
        const deliveryId = movement.delivery_id;
        if (!groupedMap.has(deliveryId)) {
          groupedMap.set(deliveryId, []);
        }
        groupedMap.get(deliveryId)!.push(movement);
      } else {
        individualMovements.push(movement);
      }
    });

    const grouped: GroupedMovement[] = Array.from(groupedMap.entries()).map(([deliveryId, movs]) => {
      const firstMovement = movs[0];
      const activeCount = movs.filter((m) => !isMovementCancelled(m)).length;
      const cancelledCount = movs.length - activeCount;

      return {
        type: 'grouped',
        delivery_id: deliveryId,
        delivery_date: firstMovement.delivery?.delivery_date || firstMovement.movement_date,
        family_name: firstMovement.delivery?.family?.name || 'Família não identificada',
        institution_name: firstMovement.institution?.name || 'Instituição não identificada',
        item_count: movs.length,
        active_count: activeCount,
        cancelled_count: cancelledCount,
        movements: movs,
      };
    });

    const individual: IndividualMovement[] = individualMovements.map((movement) => ({
      type: 'individual',
      movement,
    }));

    const withDate: { item: ProcessedMovement; date: string }[] = [
      ...grouped.map((g) => ({ item: g as ProcessedMovement, date: g.delivery_date })),
      ...individual.map((i) => ({ item: i as ProcessedMovement, date: i.movement.movement_date })),
    ];
    withDate.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return withDate.map(({ item }) => item);
  };

  const processedMovements = useMemo(() => processMovements(movements), [movements]);

  useEffect(() => {
    if (!isDetailsModalOpen || !selectedDeliveryMeta?.deliveryId) return;

    const updatedMovements = movements.filter(
      (movement) => movement.delivery_id === selectedDeliveryMeta.deliveryId
    );

    if (updatedMovements.length > 0) {
      setSelectedDeliveryMovements(updatedMovements);
    }
  }, [movements, isDetailsModalOpen, selectedDeliveryMeta?.deliveryId]);

  const handleShowDetails = (groupedMovement: GroupedMovement) => {
    setSelectedDeliveryMovements(groupedMovement.movements);
    setSelectedDeliveryMeta({
      deliveryId: groupedMovement.delivery_id,
      familyName: groupedMovement.family_name,
    });
    setIsDetailsModalOpen(true);
  };

  const handleGenerateReceipt = async (processed: ProcessedMovement) => {
    if (processed.type === 'grouped') {
      if (processed.active_count === 0) return;

      setGeneratingReceiptId(`grouped-${processed.delivery_id}`);
      try {
        await generateDeliveryReceipt.mutateAsync(processed.delivery_id);
      } finally {
        setGeneratingReceiptId(null);
      }
    } else {
      if (isMovementCancelled(processed.movement)) return;

      setGeneratingReceiptId(processed.movement.id);
      try {
        await generateMovementReceipt.mutateAsync(processed.movement.id);
      } finally {
        setGeneratingReceiptId(null);
      }
    }
  };

  const openCancelSingle = (movement: StockMovement) => {
    setCancelTarget({
      mode: 'single',
      movementId: movement.id,
      movementType: movement.movement_type as 'ENTRADA' | 'SAIDA',
      productName: movement.product?.name || 'Produto',
      quantity: movement.quantity,
      unit: movement.product?.unit || '',
      movementDate: movement.movement_date,
    });
    setIsCancelDialogOpen(true);
  };

  const openCancelDelivery = (groupedMovement: GroupedMovement) => {
    const activeMovements = groupedMovement.movements.filter((m) => !isMovementCancelled(m));

    setCancelTarget({
      mode: 'delivery',
      deliveryId: groupedMovement.delivery_id,
      familyName: groupedMovement.family_name,
      activeCount: activeMovements.length,
      items: activeMovements.map((m) => ({
        productName: m.product?.name || 'Produto',
        quantity: m.quantity,
        unit: m.product?.unit || '',
      })),
    });
    setIsCancelDialogOpen(true);
  };

  const handleConfirmCancel = async (reason: string) => {
    if (!cancelTarget) return;

    try {
      if (cancelTarget.mode === 'single') {
        await cancelStockMovement.mutateAsync({
          movementId: cancelTarget.movementId,
          reason,
        });
      } else {
        await cancelDeliveryMovements.mutateAsync({
          deliveryId: cancelTarget.deliveryId,
          reason,
        });
      }

      setIsCancelDialogOpen(false);
      setCancelTarget(null);
    } catch {
      // Erros tratados nos hooks
    }
  };

  const isCancelling =
    cancelStockMovement.isPending || cancelDeliveryMovements.isPending;

  const columnCount = isAdmin ? 9 : 8;

  return (
    <TooltipProvider>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Movimentações de Estoque</h2>
          <div className="flex gap-2 items-center">
            {isAdmin && (
              <Select
                value={selectedInstitutionId || 'all'}
                onValueChange={(value) => setSelectedInstitutionId(value === 'all' ? undefined : value)}
              >
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Selecione uma instituição" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Instituições</SelectItem>
                  {institutions.map((inst) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      {inst.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {!isAdmin && (
              <>
                <Button onClick={() => setIsEntryDialogOpen(true)} variant="default">
                  <Plus className="h-4 w-4 mr-2" />
                  Entrada
                </Button>
                <Button onClick={() => setIsExitDialogOpen(true)} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Saída
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Input
            type="date"
            placeholder="Data Inicial"
            value={filters.startDate || ''}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />
          <Input
            type="date"
            placeholder="Data Final"
            value={filters.endDate || ''}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
          <Select
            value={filters.movementType || 'all'}
            onValueChange={(value) =>
              setFilters({
                ...filters,
                movementType: value === 'all' ? undefined : (value as 'ENTRADA' | 'SAIDA'),
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="ENTRADA">Entrada</SelectItem>
              <SelectItem value="SAIDA">Saída</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) =>
              setFilters({
                ...filters,
                status: value === 'all' ? undefined : (value as StockMovementStatus),
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="ACTIVE">Ativas</SelectItem>
              <SelectItem value="CANCELLED">Canceladas</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setFilters({})}>
            Limpar Filtros
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Quantidade</TableHead>
                  {isAdmin && <TableHead>Instituição</TableHead>}
                  <TableHead>Destino/Beneficiado</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedMovements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columnCount} className="text-center py-8 text-gray-500">
                      Nenhuma movimentação encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  processedMovements.map((processed) => {
                    if (processed.type === 'grouped') {
                      const allCancelled = processed.active_count === 0;
                      const partiallyCancelled =
                        processed.cancelled_count > 0 && processed.active_count > 0;

                      return (
                        <TableRow
                          key={`grouped-${processed.delivery_id}`}
                          className={allCancelled ? 'opacity-60' : undefined}
                        >
                          <TableCell>{formatDateTimeBrasilia(processed.delivery_date)}</TableCell>
                          <TableCell>
                            <Badge variant="destructive">SAIDA</Badge>
                          </TableCell>
                          <TableCell>
                            {allCancelled ? (
                              <Badge variant="secondary">Cancelada</Badge>
                            ) : partiallyCancelled ? (
                              <Badge variant="outline">
                                {processed.cancelled_count}/{processed.item_count} cancelados
                              </Badge>
                            ) : (
                              <Badge variant="outline">Ativa</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              Entrega para {processed.family_name} - {processed.item_count}{' '}
                              {processed.item_count === 1 ? 'item' : 'itens'}
                            </span>
                          </TableCell>
                          <TableCell>-</TableCell>
                          {isAdmin && <TableCell>{processed.institution_name}</TableCell>}
                          <TableCell>Beneficiado: {processed.family_name}</TableCell>
                          <TableCell className="max-w-xs truncate">-</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleShowDetails(processed)}
                                title="Ver detalhes da entrega"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleGenerateReceipt(processed)}
                                      disabled={
                                        allCancelled ||
                                        generatingReceiptId === `grouped-${processed.delivery_id}`
                                      }
                                      title={
                                        allCancelled
                                          ? 'Entrega cancelada'
                                          : 'Gerar recibo PDF'
                                      }
                                    >
                                      {generatingReceiptId === `grouped-${processed.delivery_id}` ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Download className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                {allCancelled && (
                                  <TooltipContent>Entrega cancelada</TooltipContent>
                                )}
                              </Tooltip>
                              {!isAdmin && processed.active_count > 0 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openCancelDelivery(processed)}
                                  title="Cancelar entrega inteira"
                                >
                                  <Ban className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    }

                    const movement = processed.movement;
                    const cancelled = isMovementCancelled(movement);

                    return (
                      <TableRow
                        key={movement.id}
                        className={cancelled ? 'opacity-60' : undefined}
                      >
                        <TableCell>{formatDateTimeBrasilia(movement.movement_date)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={movement.movement_type === 'ENTRADA' ? 'default' : 'destructive'}
                          >
                            {movement.movement_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <MovementStatusBadge movement={movement} />
                        </TableCell>
                        <TableCell>{movement.product?.name || '-'}</TableCell>
                        <TableCell className={cancelled ? 'line-through' : undefined}>
                          {movement.quantity} {movement.product?.unit || ''}
                        </TableCell>
                        {isAdmin && <TableCell>{movement.institution?.name || '-'}</TableCell>}
                        <TableCell>
                          {(() => {
                            if (
                              movement.beneficiary_institution_id &&
                              movement.beneficiary_institution
                            ) {
                              return `Instituição: ${movement.beneficiary_institution.trade_name || movement.beneficiary_institution.full_name}`;
                            }
                            if (movement.supplier_id && movement.supplier?.name) {
                              return `Fornecedor: ${movement.supplier.name}`;
                            }
                            if (movement.notes && movement.notes.trim()) {
                              return movement.notes;
                            }
                            return '-';
                          })()}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          <CancellationNotes movement={movement} />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleGenerateReceipt(processed)}
                                    disabled={
                                      cancelled || generatingReceiptId === movement.id
                                    }
                                    title={
                                      cancelled
                                        ? 'Movimentação cancelada'
                                        : 'Gerar recibo PDF'
                                    }
                                  >
                                    {generatingReceiptId === movement.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Download className="h-4 w-4" />
                                    )}
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              {cancelled && (
                                <TooltipContent>Movimentação cancelada</TooltipContent>
                              )}
                            </Tooltip>
                            {!isAdmin && !cancelled && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openCancelSingle(movement)}
                                title="Cancelar movimentação"
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <StockEntryForm
          open={isEntryDialogOpen}
          onOpenChange={setIsEntryDialogOpen}
          institutionId={selectedInstitutionId || propInstitutionId || profile?.institution_id}
        />

        <StockExitForm
          open={isExitDialogOpen}
          onOpenChange={setIsExitDialogOpen}
          institutionId={selectedInstitutionId || propInstitutionId || profile?.institution_id}
        />

        <DeliveryDetailsModal
          open={isDetailsModalOpen}
          onOpenChange={setIsDetailsModalOpen}
          movements={selectedDeliveryMovements}
          deliveryId={selectedDeliveryMeta?.deliveryId}
          familyName={selectedDeliveryMeta?.familyName}
          canCancel={!isAdmin}
          onCancelMovement={openCancelSingle}
          onCancelDelivery={(deliveryId, familyName, activeMovements) => {
            setCancelTarget({
              mode: 'delivery',
              deliveryId,
              familyName,
              activeCount: activeMovements.length,
              items: activeMovements.map((m) => ({
                productName: m.product?.name || 'Produto',
                quantity: m.quantity,
                unit: m.product?.unit || '',
              })),
            });
            setIsCancelDialogOpen(true);
          }}
        />

        <CancelMovementDialog
          open={isCancelDialogOpen}
          onOpenChange={setIsCancelDialogOpen}
          target={cancelTarget}
          onConfirm={handleConfirmCancel}
          isLoading={isCancelling}
        />
      </div>
    </TooltipProvider>
  );
};

export default StockMovementsTab;
