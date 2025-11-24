import React, { useState, useMemo } from 'react';
import { useStockMovements } from '@/hooks/useInventory';
import { useAuth } from '@/hooks/useAuth';
import { useInstitutions } from '@/hooks/useInstitutions';
import { useGenerateMovementReceipt, useGenerateDeliveryReceipt } from '@/hooks/useReceipts';
import { Button } from '@/components/ui/button';
import { Plus, Download, Eye, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTimeBrasilia } from '@/utils/dateFormat';
import StockEntryForm from './StockEntryForm';
import StockExitForm from './StockExitForm';
import DeliveryDetailsModal from './DeliveryDetailsModal';
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
};

type GroupedMovement = {
  type: 'grouped';
  delivery_id: string;
  delivery_date: string;
  family_name: string;
  institution_name: string;
  item_count: number;
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

const StockMovementsTab = ({ institutionId: propInstitutionId }: StockMovementsTabProps) => {
  const { profile } = useAuth();
  const { data: institutions = [] } = useInstitutions();
  const isAdmin = profile?.role === 'admin';
  
  // Se for admin, permite selecionar instituição; senão, usa a prop ou a do perfil
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string | undefined>(
    isAdmin ? undefined : (propInstitutionId || profile?.institution_id)
  );

  const [filters, setFilters] = useState<{
    startDate?: string;
    endDate?: string;
    movementType?: 'ENTRADA' | 'SAIDA';
  }>({});
  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false);
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedDeliveryMovements, setSelectedDeliveryMovements] = useState<StockMovement[]>([]);
  const [generatingReceiptId, setGeneratingReceiptId] = useState<string | null>(null);

  const generateMovementReceipt = useGenerateMovementReceipt();
  const generateDeliveryReceipt = useGenerateDeliveryReceipt();

  const { data: movements = [], isLoading } = useStockMovements({
    ...filters,
    institutionId: selectedInstitutionId,
  });

  // Função para agrupar movimentações por entrega
  const processMovements = (movements: StockMovement[]): ProcessedMovement[] => {
    const groupedMap = new Map<string, StockMovement[]>();
    const individualMovements: StockMovement[] = [];

    // Separar movimentações com delivery_id das individuais
    movements.forEach((movement) => {
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

    // Criar objetos GroupedMovement
    const grouped: GroupedMovement[] = Array.from(groupedMap.entries()).map(([deliveryId, movs]) => {
      const firstMovement = movs[0];
      return {
        type: 'grouped',
        delivery_id: deliveryId,
        delivery_date: firstMovement.delivery?.delivery_date || firstMovement.movement_date,
        family_name: firstMovement.delivery?.family?.name || 'Família não identificada',
        institution_name: firstMovement.institution?.name || 'Instituição não identificada',
        item_count: movs.length,
        movements: movs,
      };
    });

    // Criar objetos IndividualMovement
    const individual: IndividualMovement[] = individualMovements.map((movement) => ({
      type: 'individual',
      movement,
    }));

    // Ordenar: agrupados primeiro (por data mais recente), depois individuais
    const sortedGrouped = grouped.sort((a, b) => 
      new Date(b.delivery_date).getTime() - new Date(a.delivery_date).getTime()
    );
    const sortedIndividual = individual.sort((a, b) =>
      new Date(b.movement.movement_date).getTime() - new Date(a.movement.movement_date).getTime()
    );

    return [...sortedGrouped, ...sortedIndividual];
  };

  const processedMovements = useMemo(() => processMovements(movements), [movements]);

  const handleShowDetails = (groupedMovement: GroupedMovement) => {
    setSelectedDeliveryMovements(groupedMovement.movements);
    setIsDetailsModalOpen(true);
  };

  const handleGenerateReceipt = async (processed: ProcessedMovement) => {
    if (processed.type === 'grouped') {
      // Gerar recibo de entrega
      setGeneratingReceiptId(`grouped-${processed.delivery_id}`);
      try {
        await generateDeliveryReceipt.mutateAsync(processed.delivery_id);
      } finally {
        setGeneratingReceiptId(null);
      }
    } else {
      // Gerar recibo de movimentação individual
      setGeneratingReceiptId(processed.movement.id);
      try {
        await generateMovementReceipt.mutateAsync(processed.movement.id);
      } finally {
        setGeneratingReceiptId(null);
      }
    }
  };

  return (
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

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="ENTRADA">Entrada</SelectItem>
            <SelectItem value="SAIDA">Saída</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() => setFilters({})}
        >
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
                  <TableCell colSpan={isAdmin ? 8 : 7} className="text-center py-8 text-gray-500">
                    Nenhuma movimentação encontrada
                  </TableCell>
                </TableRow>
              ) : (
                processedMovements.map((processed) => {
                  if (processed.type === 'grouped') {
                    return (
                      <TableRow key={`grouped-${processed.delivery_id}`}>
                        <TableCell>
                          {formatDateTimeBrasilia(processed.delivery_date)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive">SAIDA</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            Entrega para {processed.family_name} - {processed.item_count} {processed.item_count === 1 ? 'item' : 'itens'}
                          </span>
                        </TableCell>
                        <TableCell>-</TableCell>
                        {isAdmin && (
                          <TableCell>{processed.institution_name}</TableCell>
                        )}
                        <TableCell>
                          Beneficiado: {processed.family_name}
                        </TableCell>
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
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleGenerateReceipt(processed)}
                              disabled={generatingReceiptId === `grouped-${processed.delivery_id}`}
                              title="Gerar recibo PDF"
                            >
                              {generatingReceiptId === `grouped-${processed.delivery_id}` ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  } else {
                    const movement = processed.movement;
                    return (
                      <TableRow key={movement.id}>
                        <TableCell>
                          {formatDateTimeBrasilia(movement.movement_date)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={movement.movement_type === 'ENTRADA' ? 'default' : 'destructive'}
                          >
                            {movement.movement_type}
                          </Badge>
                        </TableCell>
                        <TableCell>{movement.product?.name || '-'}</TableCell>
                        <TableCell>
                          {movement.quantity} {movement.product?.unit || ''}
                        </TableCell>
                        {isAdmin && (
                          <TableCell>{movement.institution?.name || '-'}</TableCell>
                        )}
                        <TableCell>
                          {(() => {
                            // Se tem supplier_id (e não tem delivery_id), é fornecedor
                            if (movement.supplier_id && movement.supplier?.name) {
                              return `Fornecedor: ${movement.supplier.name}`;
                            }
                            // Caso contrário, mostrar texto das notas (destino manual)
                            if (movement.notes && movement.notes.trim()) {
                              return movement.notes;
                            }
                            // Caso contrário
                            return '-';
                          })()}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {movement.notes || '-'}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleGenerateReceipt(processed)}
                            disabled={generatingReceiptId === movement.id}
                            title="Gerar recibo PDF"
                          >
                            {generatingReceiptId === movement.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  }
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Entry Dialog */}
      <StockEntryForm
        open={isEntryDialogOpen}
        onOpenChange={setIsEntryDialogOpen}
        institutionId={selectedInstitutionId || propInstitutionId || profile?.institution_id}
      />

      {/* Exit Dialog */}
      <StockExitForm
        open={isExitDialogOpen}
        onOpenChange={setIsExitDialogOpen}
        institutionId={selectedInstitutionId || propInstitutionId || profile?.institution_id}
      />

      {/* Delivery Details Modal */}
      <DeliveryDetailsModal
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        movements={selectedDeliveryMovements}
      />
    </div>
  );
};

export default StockMovementsTab;

