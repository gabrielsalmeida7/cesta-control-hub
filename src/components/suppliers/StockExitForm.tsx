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
import { useInventory, useCreateStockMovementsBatch } from '@/hooks/useInventory';
import { useAuth } from '@/hooks/useAuth';
import { useBeneficiaryInstitutions } from '@/hooks/useBeneficiaryInstitutions';
import { getCurrentDateTimeISO } from '@/utils/dateFormat';
import { formatCnpj } from '@/utils/documentFormat';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';

type DestinationType = 'free' | 'institution';

type ExitFormValues = {
  destinationType: DestinationType;
  beneficiary_institution_id: string;
  destination: string;
  notes: string;
  items: { product_id: string; quantity: string }[];
};

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
  const createMovementsBatch = useCreateStockMovementsBatch();

  const form = useForm<ExitFormValues>({
    defaultValues: {
      destinationType: 'free',
      beneficiary_institution_id: '',
      destination: '',
      notes: '',
      items: [{ product_id: '', quantity: '' }],
    },
  });

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
    if (itemFields.length === 0) {
      appendItem({ product_id: '', quantity: '' });
    }
  }, [appendItem, itemFields.length]);

  const handleSubmit = async (data: ExitFormValues) => {
    if (!instId) return;

    if (data.destinationType === 'institution' && !data.beneficiary_institution_id) {
      form.setError('beneficiary_institution_id', {
        type: 'manual',
        message: 'Selecione a instituição beneficiada',
      });
      return;
    }

    const normalizedItems = (data.items || [])
      .map((item, index) => ({
        index,
        product_id: item.product_id,
        quantity: parseFloat(item.quantity),
      }))
      .filter((item) => item.product_id);

    if (normalizedItems.length === 0) {
      form.setError('items', {
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
      form.setError('items', {
        type: 'manual',
        message: 'Não é permitido repetir o mesmo produto na mesma saída. Ajuste as linhas e quantidades.',
      });
      return;
    }

    for (const item of normalizedItems) {
      if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
        form.setError(`items.${item.index}.quantity`, {
          type: 'manual',
          message: 'Quantidade deve ser maior que zero',
        });
        return;
      }

      const available =
        inventory.find((inv) => inv.product_id === item.product_id)?.quantity || 0;
      if (item.quantity > available) {
        form.setError(`items.${item.index}.quantity`, {
          type: 'manual',
          message: `Quantidade disponível: ${available}`,
        });
        return;
      }
    }

    let notesWithDestination: string | null;
    let beneficiaryInstitutionId: string | null;

    switch (data.destinationType) {
      case 'free': {
        const destinationPrefix = data.destination.trim() || null;
        notesWithDestination = destinationPrefix
          ? `${destinationPrefix}${data.notes ? ' | ' + data.notes : ''}`
          : data.notes || null;
        beneficiaryInstitutionId = null;
        break;
      }
      case 'institution': {
        notesWithDestination = data.notes || null;
        beneficiaryInstitutionId = data.beneficiary_institution_id;
        break;
      }
      default: {
        const _exhaustive: never = data.destinationType;
        return _exhaustive;
      }
    }

    try {
      const rows = normalizedItems.map((item) => ({
        institution_id: instId,
        product_id: item.product_id,
        movement_type: 'SAIDA' as const,
        quantity: item.quantity,
        movement_date: getCurrentDateTimeISO(),
        notes: notesWithDestination,
        beneficiary_institution_id: beneficiaryInstitutionId,
      }));

      await createMovementsBatch.mutateAsync(rows);
      onOpenChange(false);
      form.reset();
    } catch {
      // Error handled by hook
    }
  };

  const isPending = createMovementsBatch.isPending;

  const itemsErrorMessage =
    form.formState.errors.items && 'message' in form.formState.errors.items
      ? form.formState.errors.items.message
      : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Saída de Estoque</DialogTitle>
          <DialogDescription>
            Registre a saída de alimentos/materiais do estoque.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form noValidate onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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

                const quantityRules = {
                  required: 'Quantidade é obrigatória',
                  validate: (value: string) => {
                    const n = parseFloat(String(value ?? '').replace(',', '.'));
                    if (!Number.isFinite(n) || n <= 0) {
                      return 'Quantidade é obrigatória';
                    }
                    if (availableForLine > 0 && n > availableForLine) {
                      return `Quantidade não pode ser maior que ${availableForLine}`;
                    }
                    return true;
                  },
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
                                form.setValue(`items.${index}.quantity`, '');
                                void form.trigger(`items.${index}.quantity`);
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
                          <FormMessage className="sr-only" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      rules={quantityRules}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Qtd *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              step="0.01"
                              min="0.01"
                              disabled={!lineProductId}
                              placeholder="0.00"
                              onChange={(e) => {
                                field.onChange(e);
                                void form.trigger(`items.${index}.quantity`);
                              }}
                            />
                          </FormControl>
                          <FormMessage className="sr-only" />
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
            {destinationType === 'free' && (
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

