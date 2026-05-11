import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useFieldArray, useForm } from 'react-hook-form';
import { useInventory, useCreateStockMovement, useCreateStockMovementsBatch } from '@/hooks/useInventory';
import { useAuth } from '@/hooks/useAuth';
import { useBeneficiaryInstitutions } from '@/hooks/useBeneficiaryInstitutions';
import { getCurrentDateTimeISO } from '@/utils/dateFormat';
import { formatCnpj } from '@/utils/documentFormat';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';

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
  const createMovementsBatch = useCreateStockMovementsBatch();

  const form = useForm<{
    destinationType: DestinationType;
    beneficiary_institution_id: string;
    destination: string;
    notes: string;
    // Modo "Destino livre"
    product_id: string;
    quantity: string;
    // Modo "Saída para instituição"
    items: { product_id: string; quantity: string }[];
  }>({
    defaultValues: {
      product_id: '',
      quantity: '',
      destinationType: 'free',
      beneficiary_institution_id: '',
      destination: '',
      notes: '',
      items: [],
    },
  });

  const selectedProductId = form.watch('product_id');
  const destinationType = form.watch('destinationType');
  const watchedItems = form.watch('items');
  const selectedItemProductIds = new Set(
    (watchedItems || []).map((i) => i.product_id).filter(Boolean)
  );
  const [beneficiaryPopoverOpen, setBeneficiaryPopoverOpen] = useState(false);
  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  useEffect(() => {
    if (destinationType !== 'institution') {
      setBeneficiaryPopoverOpen(false);
    }
  }, [destinationType]);

  useEffect(() => {
    if (destinationType === 'institution' && itemFields.length === 0) {
      appendItem({ product_id: '', quantity: '' });
    }
  }, [appendItem, destinationType, itemFields.length]);

  const availableQuantity = inventory.find(
    (item) => item.product_id === selectedProductId
  )?.quantity || 0;

  const handleSubmit = async (data: {
    destinationType: DestinationType;
    beneficiary_institution_id: string;
    destination: string;
    notes: string;
    // Modo "Destino livre"
    product_id: string;
    quantity: string;
    // Modo "Saída para instituição"
    items: { product_id: string; quantity: string }[];
  }) => {
    if (!instId) return;

    if (data.destinationType === 'free') {
      if (parseFloat(data.quantity) > availableQuantity) {
        form.setError('quantity', {
          type: 'manual',
          message: `Quantidade disponível: ${availableQuantity}`,
        });
        return;
      }

      try {
        const destinationPrefix =
          data.destination && data.destination.trim()
            ? data.destination.trim()
            : null;

        const notesWithDestination = destinationPrefix
          ? `${destinationPrefix}${data.notes ? ' | ' + data.notes : ''}`
          : data.notes || null;

        await createMovement.mutateAsync({
          institution_id: instId,
          product_id: data.product_id,
          movement_type: 'SAIDA',
          quantity: parseFloat(data.quantity),
          movement_date: getCurrentDateTimeISO(),
          notes: notesWithDestination,
          beneficiary_institution_id: null,
        });
        onOpenChange(false);
        form.reset();
      } catch {
        // Error handled by hook
      }
      return;
    }

    if (!data.beneficiary_institution_id) {
      form.setError('beneficiary_institution_id', {
        type: 'manual',
        message: 'Selecione a instituição beneficiada',
      });
      return;
    }

    const normalizedItems = (data.items || [])
      .map((item) => ({
        product_id: item.product_id,
        quantity: parseFloat(item.quantity),
      }))
      .filter((item) => item.product_id);

    if (normalizedItems.length === 0) {
      form.setError('items' as any, {
        type: 'manual',
        message: 'Selecione pelo menos um produto e informe a quantidade.',
      });
      return;
    }

    const productIds = normalizedItems.map((i) => i.product_id);
    const duplicatedIds = productIds.filter(
      (id, index) => productIds.indexOf(id) !== index
    );
    if (duplicatedIds.length > 0) {
      form.setError('items' as any, {
        type: 'manual',
        message: 'Não é permitido repetir o mesmo produto na mesma saída. Ajuste as linhas e quantidades.',
      });
      return;
    }

    try {
      const notesWithDestination = data.notes || null;
      const rows = normalizedItems.map((item) => ({
        institution_id: instId,
        product_id: item.product_id,
        movement_type: 'SAIDA' as const,
        quantity: item.quantity,
        movement_date: getCurrentDateTimeISO(),
        notes: notesWithDestination,
        beneficiary_institution_id: data.beneficiary_institution_id,
      }));

      await createMovementsBatch.mutateAsync(rows);
      onOpenChange(false);
      form.reset();
    } catch {
      // Error handled by hook
    }
  };

  const isPending =
    destinationType === 'institution'
      ? createMovementsBatch.isPending
      : createMovement.isPending;

  const itemsErrorMessage = (form.formState.errors.items as any)?.message as
    | string
    | undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'sm:max-w-[500px] max-h-[80vh] overflow-y-auto',
          destinationType === 'institution' && 'sm:max-w-[900px]'
        )}
      >
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
                render={({ field }) => {
                  const selectedInst = beneficiaryInstitutions.find(
                    (i) => i.id === field.value
                  );
                  const triggerLabel = selectedInst
                    ? selectedInst.trade_name || selectedInst.full_name
                    : null;
                  return (
                    <FormItem className="flex flex-col">
                      <FormLabel>Instituição beneficiada *</FormLabel>
                      <Popover
                        open={beneficiaryPopoverOpen}
                        onOpenChange={setBeneficiaryPopoverOpen}
                      >
                        <FormControl>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              role="combobox"
                              aria-expanded={beneficiaryPopoverOpen}
                              disabled={beneficiaryInstitutions.length === 0}
                              className={cn(
                                'w-full justify-between font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              <span className="truncate text-left">
                                {beneficiaryInstitutions.length === 0
                                  ? 'Nenhuma instituição cadastrada'
                                  : triggerLabel ?? 'Selecione a instituição'}
                              </span>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                        </FormControl>
                        <PopoverContent
                          className="p-0 w-[min(calc(100vw-2rem),500px)]"
                          align="start"
                        >
                          <Command shouldFilter>
                            <CommandInput placeholder="Buscar por nome, fantasia ou CNPJ…" />
                            <CommandList>
                              <CommandEmpty>
                                Nenhuma instituição encontrada com esse termo.
                              </CommandEmpty>
                              <CommandGroup>
                                {beneficiaryInstitutions.map((inst) => {
                                  const primary = inst.trade_name || inst.full_name;
                                  const secondary =
                                    inst.trade_name && inst.trade_name !== inst.full_name
                                      ? inst.full_name
                                      : null;
                                  const cnpjLabel = inst.cnpj
                                    ? formatCnpj(inst.cnpj)
                                    : '';
                                  const searchBlob = [
                                    inst.full_name,
                                    inst.trade_name,
                                    inst.cnpj,
                                    inst.cnpj?.replace(/\D/g, ''),
                                    inst.city,
                                  ]
                                    .filter(Boolean)
                                    .join(' ');
                                  return (
                                    <CommandItem
                                      key={inst.id}
                                      value={searchBlob}
                                      onSelect={() => {
                                        field.onChange(inst.id);
                                        setBeneficiaryPopoverOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          'mr-2 h-4 w-4 shrink-0',
                                          field.value === inst.id ? 'opacity-100' : 'opacity-0'
                                        )}
                                      />
                                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                        <span className="truncate font-medium">{primary}</span>
                                        {secondary ? (
                                          <span className="truncate text-xs text-muted-foreground">
                                            {secondary}
                                          </span>
                                        ) : null}
                                        {cnpjLabel ? (
                                          <span className="text-xs text-muted-foreground">
                                            CNPJ: {cnpjLabel}
                                          </span>
                                        ) : null}
                                      </div>
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {beneficiaryInstitutions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Cadastre instituições beneficiadas na aba Instituições.
                        </p>
                      ) : null}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            )}
            {destinationType === 'institution' ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <FormLabel>Produtos e quantidades *</FormLabel>
                  {itemsErrorMessage ? (
                    <p className="text-sm text-destructive">{itemsErrorMessage}</p>
                  ) : null}
                </div>

                {itemFields.map((itemField, index) => {
                  const lineProductId = watchedItems?.[index]?.product_id || '';
                  const availableForLine =
                    inventory.find((inv) => inv.product_id === lineProductId)?.quantity || 0;

                  const productOptions = inventory
                    .filter((inv) => inv.quantity > 0)
                    .filter(
                      (inv) =>
                        !selectedItemProductIds.has(inv.product_id) ||
                        inv.product_id === lineProductId
                    );

                  const quantityRules =
                    availableForLine > 0
                      ? {
                          required: 'Quantidade é obrigatória',
                          min: { value: 0.01, message: 'Quantidade deve ser maior que zero' },
                          max: {
                            value: availableForLine,
                            message: `Quantidade não pode ser maior que ${availableForLine}`,
                          },
                        }
                      : {
                          required: 'Quantidade é obrigatória',
                          min: { value: 0.01, message: 'Quantidade deve ser maior que zero' },
                        };

                  return (
                    <div
                      key={itemField.id}
                      className="grid grid-cols-1 sm:grid-cols-[1fr_140px_auto] gap-3 items-end"
                    >
                      <FormField
                        control={form.control}
                        name={`items.${index}.product_id`}
                        rules={{ required: 'Produto é obrigatório' }}
                        render={({ field }) => (
                          <FormItem className="min-w-0">
                            <FormLabel>Produto</FormLabel>
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={(v) => {
                                  field.onChange(v);
                                  form.setValue(`items.${index}.quantity`, '', {
                                    shouldValidate: true,
                                  });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o produto" />
                                </SelectTrigger>
                                <SelectContent>
                                  {productOptions.map((inv) => (
                                    <SelectItem key={inv.product_id} value={inv.product_id}>
                                      {inv.product?.name} ({inv.product?.unit}) - Disponível: {inv.quantity}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        rules={quantityRules as any}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Qtd</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                step="0.01"
                                min="0.01"
                                disabled={!lineProductId}
                                placeholder="0.00"
                              />
                            </FormControl>
                            {lineProductId ? (
                              <p className="text-xs text-gray-600 bg-gray-50 p-1 rounded mt-1">
                                Disponível: <strong>{availableForLine}</strong>
                              </p>
                            ) : null}
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => removeItem(index)}
                        disabled={itemFields.length === 1}
                      >
                        Remover
                      </Button>
                    </div>
                  );
                })}

                <div className="flex">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => appendItem({ product_id: '', quantity: '' })}
                  >
                    Adicionar produto
                  </Button>
                </div>
              </div>
            ) : (
              <>
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
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          min="0.01"
                          max={availableQuantity}
                          placeholder="0.00"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="destination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destino</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ex: Entrega para família, Transferência para outra instituição, etc."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
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
              <Button type="submit" disabled={isPending}>
                {isPending ? (
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

