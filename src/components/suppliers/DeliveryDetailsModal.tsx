import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
}

const DeliveryDetailsModal = ({ open, onOpenChange, movements }: DeliveryDetailsModalProps) => {
  if (movements.length === 0) return null;

  const firstMovement = movements[0];
  const familyName = firstMovement.delivery?.family?.name || 'Família não identificada';
  const deliveryDate = firstMovement.delivery?.delivery_date || firstMovement.movement_date;
  const institutionName = firstMovement.institution?.name || 'Instituição não identificada';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Entrega</DialogTitle>
          <DialogDescription>
            Itens entregues para a família {familyName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Informações da Entrega */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Família:</span>
              <span className="text-sm font-semibold">{familyName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Data da Entrega:</span>
              <span className="text-sm">{formatDateTimeBrasilia(deliveryDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Instituição:</span>
              <span className="text-sm">{institutionName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Total de Itens:</span>
              <Badge variant="secondary">{movements.length} {movements.length === 1 ? 'item' : 'itens'}</Badge>
            </div>
          </div>

          {/* Tabela de Itens */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Unidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell className="font-medium">
                      {movement.product?.name || 'Produto não identificado'}
                    </TableCell>
                    <TableCell>
                      {movement.quantity}
                    </TableCell>
                    <TableCell>
                      {movement.product?.unit || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeliveryDetailsModal;

