import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { useInventory, useCreateStockMovement } from '@/hooks/useInventory';
import { useAuth } from '@/hooks/useAuth';
import { useBeneficiaryInstitutions } from '@/hooks/useBeneficiaryInstitutions';
import { getCurrentDateTimeISO } from '@/utils/dateFormat';
import { Loader2 } from 'lucide-react';

type DestinationType = 'free' | 'institution';

interface StockExitFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  institutionId?: string;
}

const StockExitForm = ({ open, onOpenChange, institutionId }: StockExitFormProps) => {
  const { profile } = useAuth();
  const instId = institutionId || profile?.institution_id;
  const { data: inventory = [] } = useInventory(instId);
  const { data: beneficiaryInstitutions = [] } = useBeneficiaryInstitutions(instId);
  const createMovement = useCreateStockMovement();

  const form = useForm<{
    product_id: string;
    quantity: string;
    destinationType: DestinationType;
    beneficiary_institution_id: string;
    destination: string;
    notes: string;
  }>({
    defaultValues: {
      product_id: '',
      quantity: '',
      destinationType: 'free',
      beneficiary_institution_id: '',
      destination: '',
      notes: '',
    },
  });

  const selectedProductId = form.watch('product_id');
  const destinationType = form.watch('destinationType');
  const availableQuantity = inventory.find(
    (item) => item.product_id === selectedProductId
  )?.quantity || 0;

  const handleSubmit = async (data: {
    product_id: string;
    quantity: string;
    destinationType: DestinationType;
    beneficiary_institution_id: string;
    destination: string;
    notes: string;
  }) => {
    if (!instId) return;

    if (parseFloat(data.quantity) > availableQuantity) {
      form.setError('quantity', {
        type: 'manual',
        message: `Quantidade disponível: ${availableQuantity}`,
      });
      return;
    }

    if (data.destinationType === 'institution' && !data.beneficiary_institution_id) {
      form.setError('beneficiary_institution_id', {
        type: 'manual',
        message: 'Selecione a instituição beneficiada',
      });
      return;
    }

    try {
      const notesWithDestination =
        data.destinationType === 'free' && data.destination
          ? `${data.destination}${data.notes ? ' | ' + data.notes : ''}`
          : data.notes || null;

      await createMovement.mutateAsync({
        institution_id: instId,
        product_id: data.product_id,
        movement_type: 'SAIDA',
        quantity: parseFloat(data.quantity),
        movement_date: getCurrentDateTimeISO(),
        notes: notesWithDestination,
        beneficiary_institution_id:
          data.destinationType === 'institution' && data.beneficiary_institution_id
            ? data.beneficiary_institution_id
            : null,
      });
      onOpenChange(false);
      form.reset();
    } catch {
      // Error handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Saída de Estoque</DialogTitle>
          <DialogDescription>
            Registre a saída de alimentos/materiais do estoque.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="destinationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de destino</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={(v: DestinationType) => {
                        field.onChange(v);
                        if (v === 'free') form.setValue('beneficiary_institution_id', '');
                        else form.setValue('destination', '');
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Destino livre</SelectItem>
                        <SelectItem value="institution">Saída para instituição</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {destinationType === 'institution' && (
              <FormField
                control={form.control}
                name="beneficiary_institution_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instituição beneficiada *</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a instituição" />
                        </SelectTrigger>
                        <SelectContent>
                          {beneficiaryInstitutions.map((inst) => (
                            <SelectItem key={inst.id} value={inst.id}>
                              {inst.trade_name || inst.full_name}
                            </SelectItem>
                          ))}
                          {beneficiaryInstitutions.length === 0 && (
                            <SelectItem value="__none__" disabled>
                              Nenhuma instituição cadastrada. Cadastre na aba Instituições.
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="product_id"
              rules={{ required: 'Produto é obrigatório' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Produto *</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {inventory
                          .filter((item) => item.quantity > 0)
                          .map((item) => (
                            <SelectItem key={item.product_id} value={item.product_id}>
                              {item.product?.name} ({item.product?.unit}) - Disponível: {item.quantity}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {selectedProductId && (
              <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                Quantidade disponível: <strong>{availableQuantity}</strong>
              </div>
            )}
            <FormField
              control={form.control}
              name="quantity"
              rules={{
                required: 'Quantidade é obrigatória',
                min: { value: 0.01, message: 'Quantidade deve ser maior que zero' },
                max: {
                  value: availableQuantity,
                  message: `Quantidade não pode ser maior que ${availableQuantity}`,
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade *</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" step="0.01" min="0.01" max={availableQuantity} placeholder="0.00" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {destinationType === 'free' && (
              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destino</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Entrega para família, Transferência para outra instituição, etc." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Observações sobre a saída" rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createMovement.isPending}>
                {createMovement.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Registrar Saída'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default StockExitForm;

