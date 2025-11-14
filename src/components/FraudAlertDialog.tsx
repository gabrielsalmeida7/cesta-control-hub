import React, { useState } from 'react';
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
import { AlertTriangle } from 'lucide-react';
import { formatDateBrasilia } from '@/utils/dateFormat';

interface FraudAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (justification: string) => void;
  onCancel: () => void;
  familyName: string;
  blockedByInstitutionName?: string;
  blockedUntil?: string;
  isLoading?: boolean;
}

const FraudAlertDialog: React.FC<FraudAlertDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  familyName,
  blockedByInstitutionName,
  blockedUntil,
  isLoading = false,
}) => {
  const [justification, setJustification] = useState('');

  const handleConfirm = () => {
    if (!justification.trim()) {
      return;
    }
    onConfirm(justification.trim());
  };

  const handleCancel = () => {
    setJustification('');
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Alerta: Possível Fraude
          </DialogTitle>
          <DialogDescription>
            Esta família está bloqueada e pode estar tentando receber múltiplas cestas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Atenção!</AlertTitle>
            <AlertDescription>
              A família <strong>{familyName}</strong> está bloqueada pela instituição{' '}
              <strong>{blockedByInstitutionName || 'outra instituição'}</strong>
              {blockedUntil && (
                <> até <strong>{formatDateBrasilia(blockedUntil)}</strong></>
              )}
              . Isso pode indicar uma possível tentativa de fraude.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">
              Deseja realmente realizar esta entrega para esta família?
            </p>
            <p className="text-sm text-gray-600">
              Se sim, é obrigatório informar o motivo pelo qual você deseja assistir esta família mesmo ela estando bloqueada.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="justification" className="text-sm font-medium text-gray-700 block">
              Justificativa <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="justification"
              placeholder="Informe o motivo pelo qual você deseja assistir esta família mesmo ela estando bloqueada por outra instituição..."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              rows={4}
              className="w-full"
              required
            />
            <p className="text-xs text-gray-500">
              Este campo é obrigatório e será registrado no histórico de entregas para auditoria.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading || !justification.trim()}
          >
            {isLoading ? (
              <>
                <span className="mr-2">Processando...</span>
              </>
            ) : (
              'Confirmar Entrega'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FraudAlertDialog;

