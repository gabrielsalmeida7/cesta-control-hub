import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useFieldArray, useForm } from 'react-hook-form';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useProducts } from '@/hooks/useProducts';
import { useCreateStockMovementsBatch } from '@/hooks/useInventory';
import { useAuth } from '@/hooks/useAuth';
import { getCurrentDateTimeISO } from '@/utils/dateFormat';
import { Loader2 } from 'lucide-react';

type EntryFormValues = {
  supplier_id: string;
  notes: string;
  items: { product_id: string; quantity: string }[];
};

interface StockEntryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  institutionId?: string;
}

const StockEntryForm = ({ open, onOpenChange, institutionId }: StockEntryFormProps) => {
  const { profile } = useAuth();
  const finalInstitutionId = institutionId || profile?.institution_id;
  const { data: suppliers = [] } = useSuppliers(finalInstitutionId);
  const { data: products = [] } = useProducts(finalInstitutionId);
  const createMovementsBatch = useCreateStockMovementsBatch();

  const form = useForm<EntryFormValues>({
    defaultValues: {
      supplier_id: '',
      notes: '',
      items: [{ product_id: '', quantity: '' }],
    },
  });

  const watchedItems = form.watch('items');
  const selectedItemProductIds = new Set(
    (watchedItems || []).map((i) => i.product_id).filter(Boolean)
  );
  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  useEffect(() => {
    if (itemFields.length === 0) {
      appendItem({ product_id: '', quantity: '' });
    }
  }, [appendItem, itemFields.length]);

  const handleSubmit = async (data: EntryFormValues) => {
    if (!finalInstitutionId) return;

    const normalizedItems = (data.items || [])
      .map((item, index) => ({
        index,
        product_id: item.product_id,
        quantity: parseFloat(String(item.quantity ?? '').replace(',', '.')),
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
        message: 'Não é permitido repetir o mesmo produto na mesma entrada. Ajuste as linhas e quantidades.',
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
    }

    try {
      const rows = normalizedItems.map((item) => ({
        institution_id: finalInstitutionId,
        product_id: item.product_id,
        movement_type: 'ENTRADA' as const,
        quantity: item.quantity,
        supplier_id: data.supplier_id || null,
        movement_date: getCurrentDateTimeISO(),
        notes: data.notes || null,
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
          <DialogTitle>Registrar Entrada de Estoque</DialogTitle>
          <DialogDescription>
            Registre a entrada de alimentos/materiais no estoque.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form noValidate onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="supplier_id"
              rules={{ required: 'Fornecedor é obrigatório' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fornecedor *</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o fornecedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-3">
              <div className="space-y-2">
                <FormLabel>Produtos e quantidades *</FormLabel>
                {itemsErrorMessage ? (
                  <p className="text-sm text-destructive">{itemsErrorMessage}</p>
                ) : null}
              </div>

              {itemFields.map((itemField, index) => {
                const lineProductId = watchedItems?.[index]?.product_id || '';
                const productOptions = products.filter(
                  (product) =>
                    !selectedItemProductIds.has(product.id) ||
                    product.id === lineProductId
                );

                const quantityRules = {
                  required: 'Quantidade é obrigatória',
                  validate: (value: string) => {
                    const n = parseFloat(String(value ?? '').replace(',', '.'));
                    if (!Number.isFinite(n) || n <= 0) {
                      return 'Quantidade é obrigatória';
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
                                {productOptions.map((product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    {product.name} ({product.unit})
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
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Observações sobre a entrada" rows={3} />
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
                  'Registrar Entrada'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default StockEntryForm;
