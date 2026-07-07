import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, FlatList } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { useAuth } from '@/hooks/useAuth';
import { useSuppliers, useCreateSupplier } from '@/hooks/useSuppliers';
import { useProducts, useCreateProduct } from '@/hooks/useProducts';
import { useInventory } from '@/hooks/useInventory';
import { useToast } from '@/hooks/useToast';
import { ArrowLeft } from 'lucide-react-native';

type Tab = 'suppliers' | 'products' | 'inventory';

export default function InstitutionSuppliersScreen() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('suppliers');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newProductName, setNewProductName] = useState('');

  const institutionId = profile?.institution_id;
  const { data: suppliers = [], refetch: refetchSuppliers } = useSuppliers(institutionId);
  const createSupplier = useCreateSupplier();
  const { data: products = [], refetch: refetchProducts } = useProducts(institutionId);
  const createProduct = useCreateProduct();
  const { data: inventory = [] } = useInventory(institutionId);

  const handleCreateSupplier = async () => {
    if (!institutionId || !newSupplierName.trim()) return;
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
    if (!institutionId || !newProductName.trim()) return;
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

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="gap-4 p-4">
        <Pressable className="flex-row items-center gap-2" onPress={() => router.back()}>
          <ArrowLeft size={20} color="#004E64" />
          <Text className="text-primary">Voltar</Text>
        </Pressable>

        <Text className="text-xl font-bold">Fornecedores e Estoque</Text>

        <View className="flex-row gap-2">
          {(['suppliers', 'products', 'inventory'] as Tab[]).map((t) => (
            <Pressable
              key={t}
              className={`flex-1 rounded-lg p-2 ${tab === t ? 'bg-primary' : 'bg-secondary'}`}
              onPress={() => setTab(t)}
            >
              <Text
                className={`text-center text-xs font-medium ${tab === t ? 'text-white' : 'text-foreground'}`}
              >
                {t === 'suppliers' ? 'Fornecedores' : t === 'products' ? 'Produtos' : 'Estoque'}
              </Text>
            </Pressable>
          ))}
        </View>

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
                data={inventory as Array<{ id: string; quantity: number; product: { name: string; unit: string } }>}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <Text className="border-b border-border py-2">
                    {item.product.name}: {item.quantity} {item.product.unit}
                  </Text>
                )}
                ListEmptyComponent={
                  <Text className="text-muted-foreground">Estoque vazio</Text>
                }
              />
            </CardContent>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}
