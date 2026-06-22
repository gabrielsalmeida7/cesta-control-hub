import React, { useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { useSuppliers, useCreateSupplier } from '@/hooks/useSuppliers';
import { useProducts, useCreateProduct } from '@/hooks/useProducts';
import { useInventory } from '@/hooks/useInventory';
import { useToast } from '@/hooks/useToast';

type Tab = 'suppliers' | 'products' | 'inventory' | 'movements';

interface SuppliersManagementProps {
  institutionId: string;
  institutionName?: string;
}

export function SuppliersManagement({
  institutionId,
  institutionName,
}: SuppliersManagementProps) {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('suppliers');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newProductName, setNewProductName] = useState('');

  const { data: suppliers = [], refetch: refetchSuppliers } = useSuppliers(institutionId);
  const createSupplier = useCreateSupplier();
  const { data: products = [], refetch: refetchProducts } = useProducts(institutionId);
  const createProduct = useCreateProduct();
  const { data: inventory = [] } = useInventory(institutionId);

  const handleCreateSupplier = async () => {
    if (!newSupplierName.trim()) return;
    try {
      await createSupplier.mutateAsync({
        institution_id: institutionId,
        name: newSupplierName.trim(),
        supplier_type: 'FORNECEDOR',
      });
      setNewSupplierName('');
      refetchSuppliers();
      toast({ title: 'Sucesso', description: 'Fornecedor cadastrado.' });
    } catch {
      toast({ title: 'Erro', description: 'Erro ao cadastrar fornecedor.', variant: 'destructive' });
    }
  };

  const handleCreateProduct = async () => {
    if (!newProductName.trim()) return;
    try {
      await createProduct.mutateAsync({
        institution_id: institutionId,
        name: newProductName.trim(),
        unit: 'un',
      });
      setNewProductName('');
      refetchProducts();
      toast({ title: 'Sucesso', description: 'Produto cadastrado.' });
    } catch {
      toast({ title: 'Erro', description: 'Erro ao cadastrar produto.', variant: 'destructive' });
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'suppliers', label: 'Fornecedores' },
    { id: 'products', label: 'Produtos' },
    { id: 'inventory', label: 'Estoque' },
    { id: 'movements', label: 'Movimentações' },
  ];

  return (
    <View className="gap-4">
      {institutionName ? (
        <Text className="text-sm text-muted-foreground">Instituição: {institutionName}</Text>
      ) : null}

      <Tabs items={tabs} value={tab} onChange={setTab} />

      {tab === 'suppliers' && (
        <Card>
          <CardHeader>
            <CardTitle>Fornecedores</CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            <View className="gap-2">
              <Label>Novo fornecedor</Label>
              <Input value={newSupplierName} onChangeText={setNewSupplierName} placeholder="Nome" />
              <Button onPress={handleCreateSupplier} loading={createSupplier.isPending}>
                Adicionar
              </Button>
            </View>
            <FlatList
              data={suppliers as Array<{ id: string; name: string }>}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <Text className="border-b border-border py-2">{item.name}</Text>
              )}
            />
          </CardContent>
        </Card>
      )}

      {tab === 'products' && (
        <Card>
          <CardHeader>
            <CardTitle>Produtos</CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            <View className="gap-2">
              <Label>Novo produto</Label>
              <Input value={newProductName} onChangeText={setNewProductName} placeholder="Nome" />
              <Button onPress={handleCreateProduct} loading={createProduct.isPending}>
                Adicionar
              </Button>
            </View>
            <FlatList
              data={products as Array<{ id: string; name: string; unit: string }>}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <Text className="border-b border-border py-2">
                  {item.name} ({item.unit})
                </Text>
              )}
            />
          </CardContent>
        </Card>
      )}

      {tab === 'inventory' && (
        <Card>
          <CardHeader>
            <CardTitle>Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <FlatList
              data={
                inventory as Array<{
                  id: string;
                  quantity: number;
                  product: { name: string; unit: string };
                }>
              }
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <Text className="border-b border-border py-2">
                  {item.product.name}: {item.quantity} {item.product.unit}
                </Text>
              )}
              ListEmptyComponent={<Text className="text-muted-foreground">Estoque vazio</Text>}
            />
          </CardContent>
        </Card>
      )}

      {tab === 'movements' && (
        <Card>
          <CardHeader>
            <CardTitle>Movimentações</CardTitle>
          </CardHeader>
          <CardContent>
            <Text className="text-sm text-muted-foreground">
              O histórico detalhado de movimentações está disponível no painel web. No mobile,
              consulte o estoque atual na aba Estoque.
            </Text>
          </CardContent>
        </Card>
      )}
    </View>
  );
}
