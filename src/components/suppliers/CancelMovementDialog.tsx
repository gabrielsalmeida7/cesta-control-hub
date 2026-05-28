import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { formatDateTimeBrasilia } from '@/utils/dateFormat';
import { Badge } from '@/components/ui/badge';

const MIN_REASON_LENGTH = 10;

export type CancelMovementDialogTarget =
  | {
      mode: 'single';
      movementId: string;
      movementType: 'ENTRADA' | 'SAIDA';
      productName: string;
      quantity: number;
      unit: string;
      movementDate: string;
    }
  | {
      mode: 'delivery';
      deliveryId: string;
      familyName: string;
      activeCount: number;
      items: Array<{ productName: string; quantity: number; unit: string }>;
    };

interface CancelMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: CancelMovementDialogTarget | null;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
}

const CancelMovementDialog: React.FC<CancelMovementDialogProps> = ({
  open,
  onOpenChange,
  target,
  onConfirm,
  isLoading = false,
}) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!open) {
      setReason('');
    }
  }, [open, target]);

  const trimmedReason = reason.trim();
  const isReasonValid = trimmedReason.length >= MIN_REASON_LENGTH;

  const handleConfirm = () => {
    if (!isReasonValid) return;
    onConfirm(trimmedReason);
  };

  if (!target) return null;

  const stockImpact =
    target.mode === 'single'
      ? target.movementType === 'SAIDA'
        ? 'A quantidade será devolvida ao estoque.'
        : 'A quantidade será subtraída do estoque (se houver saldo suficiente).'
      : 'As quantidades dos itens ativos serão devolvidas ao estoque.';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Cancelar movimentação
          </DialogTitle>
          <DialogDescription>
            O registro permanecerá visível no histórico como cancelado para consultas futuras.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Atenção</AlertTitle>
            <AlertDescription>{stockImpact}</AlertDescription>
          </Alert>

          <div className="rounded-lg border bg-gray-50 p-4 space-y-2 text-sm">
            {target.mode === 'single' ? (
              <>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Tipo</span>
                  <Badge variant={target.movementType === 'ENTRADA' ? 'default' : 'destructive'}>
                    {target.movementType}
                  </Badge>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Produto</span>
                  <span className="font-medium text-right">{target.productName}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Quantidade</span>
                  <span className="font-medium">
                    {target.quantity} {target.unit}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Data</span>
                  <span>{formatDateTimeBrasilia(target.movementDate)}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Entrega para</span>
                  <span className="font-medium text-right">{target.familyName}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Itens ativos</span>
                  <span className="font-medium">{target.activeCount}</span>
                </div>
                <ul className="mt-2 space-y-1 text-xs text-gray-700">
                  {target.items.map((item, index) => (
                    <li key={`${item.productName}-${index}`}>
                      {item.productName} — {item.quantity} {item.unit}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="cancellation-reason" className="text-sm font-medium text-gray-700 block">
              Motivo do cancelamento <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="cancellation-reason"
              placeholder="Descreva por que esta movimentação foi registrada por engano..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              required
            />
            <p className="text-xs text-gray-500">
              Mínimo de {MIN_REASON_LENGTH} caracteres. Será registrado permanentemente para auditoria.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Voltar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading || !isReasonValid}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cancelando...
              </>
            ) : (
              'Confirmar cancelamento'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CancelMovementDialog;
