import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Ban } from 'lucide-react';
import { formatDateTimeBrasilia } from '@/utils/dateFormat';
import type { Tables } from '@/integrations/supabase/types';

type StockMovement = Tables<'stock_movements'> & {
  product: { id: string; name: string; unit: string };
  institution: { id: string; name: string };
  delivery: {
    id: string;
    delivery_date: string | null;
    family: { id: string; name: string } | null;
  } | null;
};

interface DeliveryDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movements: StockMovement[];
  deliveryId?: string;
  familyName?: string;
  canCancel?: boolean;
  onCancelMovement?: (movement: StockMovement) => void;
  onCancelDelivery?: (
    deliveryId: string,
    familyName: string,
    activeMovements: StockMovement[]
  ) => void;
}

const isMovementCancelled = (movement: StockMovement) => movement.status === 'CANCELLED';

const DeliveryDetailsModal = ({
  open,
  onOpenChange,
  movements,
  deliveryId,
  familyName,
  canCancel = false,
  onCancelMovement,
  onCancelDelivery,
}: DeliveryDetailsModalProps) => {
  if (movements.length === 0) return null;

  const firstMovement = movements[0];
  const resolvedFamilyName =
    familyName || firstMovement.delivery?.family?.name || 'Família não identificada';
  const deliveryDate = firstMovement.delivery?.delivery_date || firstMovement.movement_date;
  const institutionName = firstMovement.institution?.name || 'Instituição não identificada';
  const resolvedDeliveryId = deliveryId || firstMovement.delivery_id || '';
  const activeMovements = movements.filter((m) => !isMovementCancelled(m));
  const allCancelled = activeMovements.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[760px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Entrega</DialogTitle>
          <DialogDescription>
            Itens entregues para a família {resolvedFamilyName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Família:</span>
              <span className="text-sm font-semibold">{resolvedFamilyName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Data da Entrega:</span>
              <span className="text-sm">{formatDateTimeBrasilia(deliveryDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Instituição:</span>
              <span className="text-sm">{institutionName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Total de Itens:</span>
              <Badge variant="secondary">
                {movements.length} {movements.length === 1 ? 'item' : 'itens'}
              </Badge>
            </div>
            {movements.some(isMovementCancelled) && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Cancelados:</span>
                <Badge variant="outline">
                  {movements.length - activeMovements.length} de {movements.length}
                </Badge>
              </div>
            )}
          </div>

          {canCancel && resolvedDeliveryId && activeMovements.length > 0 && onCancelDelivery && (
            <div className="flex justify-end">
              <Button
                variant="destructive"
                size="sm"
                onClick={() =>
                  onCancelDelivery(resolvedDeliveryId, resolvedFamilyName, activeMovements)
                }
              >
                <Ban className="h-4 w-4 mr-2" />
                Cancelar entrega inteira
              </Button>
            </div>
          )}

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Status</TableHead>
                  {canCancel && <TableHead className="w-[80px]">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => {
                  const cancelled = isMovementCancelled(movement);

                  return (
                    <TableRow key={movement.id} className={cancelled ? 'opacity-60' : undefined}>
                      <TableCell className="font-medium">
                        {movement.product?.name || 'Produto não identificado'}
                      </TableCell>
                      <TableCell className={cancelled ? 'line-through' : undefined}>
                        {movement.quantity}
                      </TableCell>
                      <TableCell>{movement.product?.unit || '-'}</TableCell>
                      <TableCell>
                        {cancelled ? (
                          <Badge variant="secondary">Cancelada</Badge>
                        ) : (
                          <Badge variant="outline">Ativa</Badge>
                        )}
                      </TableCell>
                      {canCancel && (
                        <TableCell>
                          {!cancelled && onCancelMovement ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onCancelMovement(movement)}
                              title="Cancelar item"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          ) : null}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {allCancelled && (
            <p className="text-sm text-muted-foreground">
              Todos os itens desta entrega foram cancelados.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeliveryDetailsModal;
