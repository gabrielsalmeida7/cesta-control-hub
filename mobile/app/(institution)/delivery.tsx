import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Plus, Minus, AlertTriangle, History } from 'lucide-react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { FraudAlertDialog } from '@/components/domain/FraudAlertDialog';
import {
  SearchFamilyByCpf,
  type SelectedFamilyForDelivery,
} from '@/components/domain/SearchFamilyByCpf';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { useInstitutionFamilies } from '@/hooks/useFamilies';
import {
  useCreateDelivery,
  useInstitutionDeliveries,
} from '@/hooks/useInstitutionDeliveries';
import { useInventory, useCreateStockMovement } from '@/hooks/useInventory';
import { useGenerateDeliveryReceipt } from '@/hooks/useReceipts';
import { getCurrentDateBrasilia, formatDateBrasilia } from '@/utils/dateFormat';
import { getFamilyBlockStatus } from '@/utils/familyBlockStatus';
import {
  validateDeliveryStock,
  getMaxQuantityForProduct,
} from '@/utils/validateDeliveryStock';

interface DeliveryItem {
  item_name: string;
  quantity: number;
  unit: string;
  product_id?: string;
}

interface InventoryRow {
  id: string;
  product_id: string;
  quantity: number;
  product: { id: string; name: string; unit: string };
}

type FamilyRow = SelectedFamilyForDelivery;

export default function InstitutionDeliveryScreen() {
  const [listSearchTerm, setListSearchTerm] = useState('');
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');
  const [selectedFamily, setSelectedFamily] = useState<FamilyRow | null>(null);
  const [blockingPeriod, setBlockingPeriod] = useState('30');
  const [notes, setNotes] = useState('');
  const [deliveryItems, setDeliveryItems] = useState<DeliveryItem[]>([]);
  const [showFraudAlert, setShowFraudAlert] = useState(false);
  const [blockingJustification, setBlockingJustification] = useState('');

  const { toast } = useToast();
  const { profile } = useAuth();

  const {
    data: families = [],
    isLoading: familiesLoading,
    refetch: refetchFamilies,
    isRefetching: familiesRefetching,
  } = useInstitutionFamilies(profile?.institution_id);

  const { data: inventory = [] } = useInventory(profile?.institution_id);

  const {
    data: recentDeliveries = [],
    refetch: refetchDeliveries,
    isRefetching: deliveriesRefetching,
  } = useInstitutionDeliveries();

  const createDeliveryMutation = useCreateDelivery();
  const createStockMovement = useCreateStockMovement();
  const generateDeliveryReceipt = useGenerateDeliveryReceipt();

  const inventoryRows = inventory as InventoryRow[];
  const availableInventory = inventoryRows.filter((item) => item.quantity > 0);

  const filteredFamilies = (families as FamilyRow[]).filter(
    (family) =>
      family.name.toLowerCase().includes(listSearchTerm.toLowerCase()) ||
      family.contact_person.toLowerCase().includes(listSearchTerm.toLowerCase())
  );

  const filteredInventory = availableInventory.filter((item) =>
    item.product.name.toLowerCase().includes(inventorySearchTerm.toLowerCase())
  );

  const selectedFamilyBlock = selectedFamily ? getFamilyBlockStatus(selectedFamily) : null;

  const updateItemQuantity = (productId: string, delta: number) => {
    const maxQty = getMaxQuantityForProduct(productId, inventoryRows);
    setDeliveryItems((prev) =>
      prev.map((item) => {
        if (item.product_id !== productId) return item;
        const nextQty = Math.max(1, Math.min(maxQty, item.quantity + delta));
        return { ...item, quantity: nextQty };
      })
    );
  };

  const addInventoryItem = (product: { id: string; name: string; unit: string }) => {
    const maxQty = getMaxQuantityForProduct(product.id, inventoryRows);
    if (maxQty <= 0) {
      toast({
        title: 'Sem estoque',
        description: `Não há unidades disponíveis de ${product.name}.`,
        variant: 'destructive',
      });
      return;
    }

    setDeliveryItems((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === product.id
            ? { ...i, quantity: Math.min(maxQty, i.quantity + 1) }
            : i
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          item_name: product.name,
          quantity: 1,
          unit: product.unit,
        },
      ];
    });
  };

  const removeInventoryItem = (productId: string) => {
    setDeliveryItems((prev) => prev.filter((i) => i.product_id !== productId));
  };

  const handleRefresh = () => {
    refetchFamilies();
    refetchDeliveries();
  };

  const processDelivery = async (justification?: string) => {
    if (!selectedFamily || !profile?.institution_id) return;

    const stockError = validateDeliveryStock(deliveryItems, inventoryRows);
    if (stockError) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      toast({
        title: 'Erro',
        description: stockError,
        variant: 'destructive',
      });
      return;
    }

    const stockItems = deliveryItems.filter((item) => item.product_id);

    try {
      const delivery = await createDeliveryMutation.mutateAsync({
        family_id: selectedFamily.id,
        blocking_period_days: parseInt(blockingPeriod, 10),
        notes: notes.trim() || undefined,
        blocking_justification: justification || undefined,
      });

      for (const item of stockItems) {
        if (item.product_id) {
          await createStockMovement.mutateAsync({
            institution_id: profile.institution_id,
            product_id: item.product_id,
            movement_type: 'SAIDA',
            quantity: item.quantity,
            delivery_id: delivery.id,
            movement_date: getCurrentDateBrasilia(),
            notes: `Saída automática para entrega à família ${selectedFamily.name}`,
          });
        }
      }

      try {
        await generateDeliveryReceipt.mutateAsync(delivery.id);
      } catch {
        toast({
          title: 'Aviso',
          description:
            'Entrega registrada, mas houve erro ao gerar recibo. Você pode gerar manualmente depois.',
        });
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      toast({
        title: 'Entrega Registrada',
        description: `Entrega registrada para ${selectedFamily.name}. Família bloqueada por ${blockingPeriod} dias.`,
      });

      setSelectedFamily(null);
      setDeliveryItems([]);
      setNotes('');
      setListSearchTerm('');
      setBlockingJustification('');
      setShowFraudAlert(false);
      refetchDeliveries();
      refetchFamilies();
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast({
        title: 'Erro',
        description: 'Erro ao registrar entrega. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleDeliverySubmit = () => {
    if (!selectedFamily) {
      toast({
        title: 'Erro',
        description: 'Selecione uma família para registrar a entrega.',
        variant: 'destructive',
      });
      return;
    }

    const stockError = validateDeliveryStock(deliveryItems, inventoryRows);
    if (stockError) {
      toast({
        title: 'Erro',
        description: stockError,
        variant: 'destructive',
      });
      return;
    }

    if (selectedFamilyBlock?.isBlocked) {
      setShowFraudAlert(true);
      return;
    }

    processDelivery();
  };

  const handleFraudConfirm = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    processDelivery(blockingJustification);
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      refreshControl={
        <RefreshControl
          refreshing={familiesRefetching || deliveriesRefetching}
          onRefresh={handleRefresh}
        />
      }
    >
      <View className="gap-4 p-4">
        <View>
          <Text className="text-xl font-bold text-foreground">Registro de Entregas</Text>
          <Text className="text-sm text-muted-foreground">
            Registre entregas de cestas básicas para famílias
          </Text>
        </View>

        <Card>
          <CardHeader>
            <CardTitle>1. Buscar Família por CPF</CardTitle>
          </CardHeader>
          <CardContent>
            <SearchFamilyByCpf
              variant="delivery"
              onFamilySelected={(family) => {
                setSelectedFamily(family);
                setDeliveryItems([]);
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Selecionar da Lista</CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            <Input
              placeholder="Buscar família por nome..."
              value={listSearchTerm}
              onChangeText={setListSearchTerm}
            />
            {familiesLoading ? (
              <ActivityIndicator color="#004E64" />
            ) : (
              <FlatList
                data={filteredFamilies.slice(0, 20)}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item: family }) => {
                  const block = getFamilyBlockStatus(family);
                  return (
                    <Pressable
                      className={`mb-2 rounded-lg border p-3 ${
                        selectedFamily?.id === family.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                      }`}
                      onPress={() => {
                        setSelectedFamily(family);
                        setDeliveryItems([]);
                      }}
                    >
                      <View className="flex-row items-start justify-between gap-2">
                        <View className="flex-1">
                          <Text className="font-medium">{family.name}</Text>
                          <Text className="text-sm text-muted-foreground">
                            {family.contact_person}
                          </Text>
                          {block.isBlocked && block.blockReason ? (
                            <Text className="mt-1 text-xs text-danger" numberOfLines={1}>
                              {block.blockReason}
                            </Text>
                          ) : null}
                        </View>
                        <Badge variant={block.isBlocked ? 'destructive' : 'success'}>
                          {block.isBlocked
                            ? `Bloqueada (${block.daysRemaining}d)`
                            : 'Liberada'}
                        </Badge>
                      </View>
                    </Pressable>
                  );
                }}
                ListEmptyComponent={
                  <Text className="text-center text-muted-foreground">
                    Nenhuma família encontrada
                  </Text>
                }
              />
            )}
          </CardContent>
        </Card>

        {selectedFamily ? (
          <Card className={selectedFamilyBlock?.isBlocked ? 'border-danger' : ''}>
            <CardHeader>
              <CardTitle>Família Selecionada</CardTitle>
            </CardHeader>
            <CardContent className="gap-2">
              <Text className="font-semibold text-lg">{selectedFamily.name}</Text>
              <Text className="text-sm text-muted-foreground">
                {selectedFamily.contact_person}
                {selectedFamily.members_count
                  ? ` · ${selectedFamily.members_count} membro(s)`
                  : ''}
              </Text>
              {selectedFamilyBlock?.isBlocked ? (
                <View className="mt-2 gap-1 rounded-lg border border-danger bg-danger/10 p-3">
                  <View className="flex-row items-center gap-2">
                    <AlertTriangle size={18} color="#EF476F" />
                    <Text className="font-medium text-danger">Família bloqueada</Text>
                  </View>
                  <Text className="text-sm text-danger">
                    {selectedFamilyBlock.blockedByInstitutionName
                      ? `Bloqueada por ${selectedFamilyBlock.blockedByInstitutionName}`
                      : 'Bloqueada por período de carência'}
                    {selectedFamilyBlock.blockedUntilFormatted
                      ? ` até ${selectedFamilyBlock.blockedUntilFormatted}`
                      : ''}
                    {' '}
                    ({selectedFamilyBlock.daysRemaining} dia(s) restante(s))
                  </Text>
                  {selectedFamilyBlock.blockReason ? (
                    <Text className="text-sm text-danger">
                      Motivo: {selectedFamilyBlock.blockReason}
                    </Text>
                  ) : null}
                </View>
              ) : (
                <Badge variant="success">Liberada para entrega</Badge>
              )}
              <Button variant="outline" onPress={() => setSelectedFamily(null)}>
                Trocar família
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>3. Itens do Estoque</CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            <Input
              placeholder="Buscar item no estoque..."
              value={inventorySearchTerm}
              onChangeText={setInventorySearchTerm}
            />

            {availableInventory.length === 0 ? (
              <Text className="text-center text-muted-foreground">
                Nenhum item com estoque disponível
              </Text>
            ) : (
              filteredInventory.map((inv) => {
                const existing = deliveryItems.find((i) => i.product_id === inv.product.id);
                const maxQty = inv.quantity;

                return (
                  <View
                    key={inv.id}
                    className="rounded-lg border border-border p-3"
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="font-medium">{inv.product.name}</Text>
                        <Text className="text-xs text-muted-foreground">
                          Disponível: {inv.quantity} {inv.product.unit}
                        </Text>
                      </View>
                      {existing ? (
                        <View className="flex-row items-center gap-2">
                          <Pressable
                            onPress={() => updateItemQuantity(inv.product.id, -1)}
                            className="rounded-full bg-muted p-1"
                          >
                            <Minus size={18} color="#004E64" />
                          </Pressable>
                          <Text className="min-w-[24px] text-center font-medium">
                            {existing.quantity}
                          </Text>
                          <Pressable
                            onPress={() => updateItemQuantity(inv.product.id, 1)}
                            disabled={existing.quantity >= maxQty}
                            className="rounded-full bg-muted p-1"
                          >
                            <Plus
                              size={18}
                              color={existing.quantity >= maxQty ? '#ccc' : '#004E64'}
                            />
                          </Pressable>
                        </View>
                      ) : (
                        <Pressable onPress={() => addInventoryItem(inv.product)}>
                          <Plus size={20} color="#004E64" />
                        </Pressable>
                      )}
                    </View>
                    {existing && existing.quantity >= maxQty ? (
                      <Text className="mt-1 text-xs text-muted-foreground">
                        Quantidade máxima do estoque atingida
                      </Text>
                    ) : null}
                  </View>
                );
              })
            )}

            {deliveryItems.length > 0 ? (
              <View className="mt-2 gap-2 border-t border-border pt-3">
                <Label>Resumo dos itens ({deliveryItems.length})</Label>
                {deliveryItems.map((item) => (
                  <View
                    key={item.product_id}
                    className="flex-row items-center justify-between rounded-lg bg-muted p-2"
                  >
                    <Text className="flex-1 text-sm">
                      {item.item_name} — {item.quantity} {item.unit}
                    </Text>
                    <Pressable onPress={() => removeInventoryItem(item.product_id!)}>
                      <Minus size={18} color="#EF476F" />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Detalhes da Entrega</CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            <View className="gap-2">
              <Label>Período de bloqueio (dias)</Label>
              <Input
                value={blockingPeriod}
                onChangeText={setBlockingPeriod}
                keyboardType="numeric"
              />
            </View>
            <View className="gap-2">
              <Label>Observações</Label>
              <Textarea
                value={notes}
                onChangeText={setNotes}
                placeholder="Observações opcionais"
              />
            </View>
            <Button
              onPress={handleDeliverySubmit}
              loading={createDeliveryMutation.isPending}
              disabled={!selectedFamily || deliveryItems.length === 0}
            >
              Confirmar Entrega
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <View className="flex-row items-center gap-2">
              <History size={20} color="#004E64" />
              <CardTitle>Entregas Recentes</CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            {(recentDeliveries as Array<{
              id: string;
              delivery_date: string;
              family?: { name: string };
              stock_movements?: Array<{ quantity: number; product?: { name: string } }>;
            }>).length === 0 ? (
              <Text className="text-center text-muted-foreground">
                Nenhuma entrega registrada ainda
              </Text>
            ) : (
              (recentDeliveries as Array<{
                id: string;
                delivery_date: string;
                family?: { name: string };
                stock_movements?: Array<{ quantity: number; product?: { name: string } }>;
              }>)
                .slice(0, 15)
                .map((delivery) => {
                  const itemCount = delivery.stock_movements?.length ?? 0;
                  const itemSummary = delivery.stock_movements
                    ?.slice(0, 2)
                    .map((m) => m.product?.name)
                    .filter(Boolean)
                    .join(', ');

                  return (
                    <View
                      key={delivery.id}
                      className="mb-2 border-b border-border pb-2 last:mb-0 last:border-b-0"
                    >
                      <Text className="font-medium">
                        {delivery.family?.name ?? 'Família'}
                      </Text>
                      <Text className="text-xs text-muted-foreground">
                        {formatDateBrasilia(delivery.delivery_date)}
                        {itemCount > 0 ? ` · ${itemCount} item(ns)` : ''}
                      </Text>
                      {itemSummary ? (
                        <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                          {itemSummary}
                          {(delivery.stock_movements?.length ?? 0) > 2 ? '…' : ''}
                        </Text>
                      ) : null}
                    </View>
                  );
                })
            )}
          </CardContent>
        </Card>
      </View>

      <FraudAlertDialog
        open={showFraudAlert}
        onOpenChange={setShowFraudAlert}
        familyName={selectedFamily?.name ?? ''}
        blockingReason={selectedFamilyBlock?.blockReason}
        blockedByInstitutionName={selectedFamilyBlock?.blockedByInstitutionName}
        blockedUntil={selectedFamily?.blocked_until}
        daysRemaining={selectedFamilyBlock?.daysRemaining}
        justification={blockingJustification}
        onJustificationChange={setBlockingJustification}
        onConfirm={handleFraudConfirm}
        loading={createDeliveryMutation.isPending}
      />
    </ScrollView>
  );
}
