import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useProducts } from '@/hooks/useProducts';
import { useCreateStockMovement } from '@/hooks/useInventory';
import { useAuth } from '@/hooks/useAuth';
import { getCurrentDateBrasilia } from '@/utils/dateFormat';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StockEntryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  institutionId?: string;
}

const StockEntryForm = ({ open, onOpenChange, institutionId }: StockEntryFormProps) => {
  const { profile } = useAuth();
  const { data: suppliers = [] } = useSuppliers();
  const { data: products = [] } = useProducts();
  const createMovement = useCreateStockMovement();
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      supplier_id: '',
      product_id: '',
      quantity: '',
      movement_date: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const handleSubmit = async (data: any) => {
    if (!profile?.institution_id && !institutionId) {
      return;
    }

    try {
      const movement = await createMovement.mutateAsync({
        institution_id: institutionId || profile!.institution_id!,
        product_id: data.product_id,
        movement_type: 'ENTRADA',
        quantity: parseFloat(data.quantity),
        supplier_id: data.supplier_id || null,
        movement_date: getCurrentDateBrasilia(),
        notes: data.notes || null,
      });

      // Gerar recibo (opcional - pode ser feito depois também)
      // Por enquanto, apenas mostrar mensagem de sucesso
      // A geração de recibo pode ser feita manualmente depois na lista de movimentações

      onOpenChange(false);
      form.reset();
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Entrada de Estoque</DialogTitle>
          <DialogDescription>
            Registre a entrada de alimentos/materiais no estoque.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} ({product.unit})
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
              name="quantity"
              rules={{ required: 'Quantidade é obrigatória', min: { value: 0.01, message: 'Quantidade deve ser maior que zero' } }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade *</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" step="0.01" min="0.01" placeholder="0.00" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
              <Button type="submit" disabled={createMovement.isPending}>
                {createMovement.isPending ? (
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

