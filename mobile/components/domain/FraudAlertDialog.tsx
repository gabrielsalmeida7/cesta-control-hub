import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { AlertTriangle } from 'lucide-react-native';
import { formatDateBrasilia } from '@/utils/dateFormat';

interface FraudAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyName: string;
  blockingReason?: string | null;
  blockedByInstitutionName?: string | null;
  blockedUntil?: string | null;
  daysRemaining?: number;
  justification: string;
  onJustificationChange: (value: string) => void;
  onConfirm: () => void;
  onCancel?: () => void;
  loading?: boolean;
}

export function FraudAlertDialog({
  open,
  onOpenChange,
  familyName,
  blockingReason,
  blockedByInstitutionName,
  blockedUntil,
  daysRemaining,
  justification,
  onJustificationChange,
  onConfirm,
  onCancel,
  loading,
}: FraudAlertDialogProps) {
  useEffect(() => {
    if (!open) {
      onJustificationChange('');
    }
  }, [open, onJustificationChange]);

  const handleCancel = () => {
    onJustificationChange('');
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <View className="mb-2 flex-row items-center gap-2">
            <AlertTriangle size={24} color="#EF476F" />
            <DialogTitle>Alerta: Possível Fraude</DialogTitle>
          </View>
          <DialogDescription>
            Esta família está bloqueada e pode estar tentando receber múltiplas cestas.
          </DialogDescription>
        </DialogHeader>

        <View className="rounded-lg border border-danger bg-danger/10 p-3">
          <Text className="text-sm text-danger">
            A família <Text className="font-bold">{familyName}</Text>
            {blockedByInstitutionName ? (
              <>
                {' '}
                está bloqueada pela instituição{' '}
                <Text className="font-bold">{blockedByInstitutionName}</Text>
              </>
            ) : null}
            {blockedUntil ? (
              <>
                {' '}
                até <Text className="font-bold">{formatDateBrasilia(blockedUntil)}</Text>
              </>
            ) : null}
            {daysRemaining !== undefined && daysRemaining > 0 ? (
              <Text> ({daysRemaining} dia(s) restante(s))</Text>
            ) : null}
            .
          </Text>
          {blockingReason ? (
            <Text className="mt-2 text-sm text-danger">Motivo: {blockingReason}</Text>
          ) : null}
        </View>

        <Text className="text-sm text-muted-foreground">
          Se deseja prosseguir, informe uma justificativa obrigatória para auditoria.
        </Text>

        <View className="gap-2">
          <Label>Justificativa *</Label>
          <Textarea
            value={justification}
            onChangeText={onJustificationChange}
            placeholder="Informe o motivo para assistir esta família mesmo bloqueada..."
          />
        </View>

        <View className="mt-4 flex-row gap-2">
          <Button variant="outline" className="flex-1" onPress={handleCancel}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            loading={loading}
            disabled={!justification.trim()}
            onPress={onConfirm}
          >
            Confirmar Entrega
          </Button>
        </View>
      </DialogContent>
    </Dialog>
  );
}
