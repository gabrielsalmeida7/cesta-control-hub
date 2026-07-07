import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, FlatList } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Textarea';
import { FraudAlertDialog } from '@/components/domain/FraudAlertDialog';
import { InstitutionPicker } from '@/components/domain/InstitutionPicker';
import { useInstitutions } from '@/hooks/useInstitutions';
import { useFamilies } from '@/hooks/useFamilies';
import { useCreateDelivery } from '@/hooks/useDeliveries';
import { useAdminRecentDeliveries } from '@/hooks/useAdminRecentDeliveries';
import { useToast } from '@/hooks/useToast';
import { formatDateTimeBrasilia } from '@/utils/dateFormat';
import { getFamilyBlockStatus } from '@/utils/familyBlockStatus';

interface FamilyOption {
  id: string;
  name: string;
  contact_person: string;
  cpf?: string | null;
  is_blocked?: boolean;
  blocked_until?: string | null;
}

export default function AdminDeliveryScreen() {
  const { toast } = useToast();
  const { data: institutions = [] } = useInstitutions();
  const { data: families = [] } = useFamilies();
  const { data: recentDeliveries = [] } = useAdminRecentDeliveries();
  const createDelivery = useCreateDelivery();

  const [institutionId, setInstitutionId] = useState('');
  const [familyId, setFamilyId] = useState('');
  const [familySearch, setFamilySearch] = useState('');
  const [blockingPeriod, setBlockingPeriod] = useState('30');
  const [notes, setNotes] = useState('');
  const [showFraudAlert, setShowFraudAlert] = useState(false);
  const [justification, setJustification] = useState('');

  const selectedFamily = (families as FamilyOption[]).find((f) => f.id === familyId);

  const filteredFamilies = useMemo(() => {
    const q = familySearch.trim().toLowerCase();
    const searchNumbers = familySearch.replace(/\D/g, '');

    return (families as FamilyOption[])
      .filter((family) => {
        if (!q && !searchNumbers) return true;
        const textMatch =
          family.name.toLowerCase().includes(q) ||
          family.contact_person.toLowerCase().includes(q);
        const cpfMatch =
          searchNumbers.length > 0 &&
          (family.cpf ?? '').replace(/\D/g, '').includes(searchNumbers);
        return textMatch || cpfMatch;
      })
      .slice(0, 20);
  }, [families, familySearch]);

  const handleSubmit = async () => {
    if (!institutionId || !familyId) {
      toast({
        title: 'Erro',
        description: 'Selecione instituição e família.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedFamily && getFamilyBlockStatus(selectedFamily).isBlocked) {
      setShowFraudAlert(true);
      return;
    }

    await processDelivery();
  };

  const processDelivery = async (blockingJustification?: string) => {
    try {
      await createDelivery.mutateAsync({
        family_id: familyId,
        institution_id: institutionId,
        blocking_period_days: parseInt(blockingPeriod, 10),
        notes: notes.trim() || undefined,
        blocking_justification: blockingJustification,
      } as never);
      toast({ title: 'Sucesso', description: 'Entrega registrada.' });
      setFamilyId('');
      setFamilySearch('');
      setNotes('');
      setJustification('');
      setShowFraudAlert(false);
    } catch {
      toast({ title: 'Erro', description: 'Erro ao registrar entrega.', variant: 'destructive' });
    }
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="gap-4 p-4">
        <Pressable className="flex-row items-center gap-2" onPress={() => router.back()}>
          <ArrowLeft size={20} color="#004E64" />
          <Text className="text-primary">Voltar</Text>
        </Pressable>

        <Text className="text-xl font-bold">Gestão de Entregas (Admin)</Text>

        <Card>
          <CardHeader>
            <CardTitle>Registrar Entrega Cross-Instituição</CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            <InstitutionPicker
              institutions={institutions as Array<{ id: string; name: string }>}
              selectedId={institutionId}
              onSelect={setInstitutionId}
            />

            <View className="gap-2">
              <Label>Buscar família</Label>
              <Input
                placeholder="Nome, responsável ou CPF..."
                value={familySearch}
                onChangeText={setFamilySearch}
              />
            </View>

            <FlatList
              data={filteredFamilies}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => {
                const blockStatus = getFamilyBlockStatus(item);
                return (
                  <Pressable
                    className={`mb-2 rounded-lg border p-3 ${
                      familyId === item.id ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                    onPress={() => setFamilyId(item.id)}
                  >
                    <Text className="font-medium">{item.name}</Text>
                    <Text className="text-sm text-muted-foreground">{item.contact_person}</Text>
                    {blockStatus.isBlocked && (
                      <Badge variant="destructive" className="mt-1">
                        Bloqueada
                      </Badge>
                    )}
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <Text className="text-muted-foreground">Nenhuma família encontrada.</Text>
              }
            />

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
              <Textarea value={notes} onChangeText={setNotes} />
            </View>
            <Button onPress={handleSubmit} loading={createDelivery.isPending}>
              Registrar Entrega
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Entregas Recentes</CardTitle>
          </CardHeader>
          <CardContent className="gap-2">
            {(
              recentDeliveries as Array<{
                id: string;
                delivery_date: string;
                family?: { name?: string } | null;
                institution?: { name?: string } | null;
              }>
            ).map((delivery) => (
              <View key={delivery.id} className="border-b border-border py-2">
                <Text className="font-medium">{delivery.family?.name ?? 'Família'}</Text>
                <Text className="text-xs text-muted-foreground">
                  {delivery.institution?.name} · {formatDateTimeBrasilia(delivery.delivery_date)}
                </Text>
              </View>
            ))}
          </CardContent>
        </Card>
      </View>

      <FraudAlertDialog
        open={showFraudAlert}
        onOpenChange={setShowFraudAlert}
        familyName={selectedFamily?.name ?? ''}
        justification={justification}
        onJustificationChange={setJustification}
        onConfirm={() => processDelivery(justification)}
        loading={createDelivery.isPending}
      />
    </ScrollView>
  );
}
