import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { UserPlus, Unlock } from 'lucide-react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog';
import { FamilyWizard } from '@/components/domain/FamilyWizard';
import { InstitutionPicker } from '@/components/domain/InstitutionPicker';
import {
  useFamilies,
  useUpdateFamily,
  useAssociateFamilyWithInstitution,
  useDisassociateFamilyFromInstitution,
} from '@/hooks/useFamilies';
import { useInstitutions } from '@/hooks/useInstitutions';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { getFamilyBlockStatus } from '@/utils/familyBlockStatus';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';

type FamilyStatusFilter = 'all' | 'blocked' | 'unblocked';

interface AdminFamily {
  id: string;
  name: string;
  contact_person: string;
  cpf?: string | null;
  phone?: string | null;
  is_blocked?: boolean;
  blocked_until?: string | null;
  block_reason?: string | null;
  institution_families?: Array<{
    institution_id: string;
    institution?: { id: string; name: string } | null;
  }>;
}

type ScreenMode = 'list' | 'create';

export default function AdminFamiliesScreen() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: families = [], isLoading, isError, refetch, isRefetching } = useFamilies();
  const { data: institutions = [] } = useInstitutions();
  const updateFamily = useUpdateFamily();
  const associateFamily = useAssociateFamilyWithInstitution();
  const disassociateFamily = useDisassociateFamilyFromInstitution();

  const [mode, setMode] = useState<ScreenMode>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FamilyStatusFilter>('all');
  const [selectedFamily, setSelectedFamily] = useState<AdminFamily | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showUnblock, setShowUnblock] = useState(false);
  const [unblockReason, setUnblockReason] = useState('');
  const [linkInstitutionId, setLinkInstitutionId] = useState('');

  const filteredFamilies = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const searchNumbers = searchTerm.replace(/\D/g, '');

    let list = (families as AdminFamily[]).filter((family) => {
      if (!q && !searchNumbers) return true;
      const textMatch =
        family.name.toLowerCase().includes(q) ||
        family.contact_person.toLowerCase().includes(q);
      const cpfMatch =
        searchNumbers.length > 0 &&
        (family.cpf ?? '').replace(/\D/g, '').includes(searchNumbers);
      return textMatch || cpfMatch;
    });

    if (statusFilter === 'blocked') {
      list = list.filter((f) => getFamilyBlockStatus(f).isBlocked);
    } else if (statusFilter === 'unblocked') {
      list = list.filter((f) => !getFamilyBlockStatus(f).isBlocked);
    }

    return list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [families, searchTerm, statusFilter]);

  const handleUnblock = async () => {
    if (!selectedFamily || !unblockReason.trim()) {
      toast({
        title: 'Justificativa obrigatória',
        description: 'Informe o motivo do desbloqueio manual.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateFamily.mutateAsync({
        id: selectedFamily.id,
        updates: {
          is_blocked: false,
          blocked_until: null,
          blocked_by_institution_id: null,
          block_reason: null,
          unblock_reason: unblockReason.trim(),
          unblocked_by_user_id: user?.id ?? null,
          unblocked_at: new Date().toISOString(),
        },
      });

      toast({
        title: 'Família desbloqueada',
        description: `${selectedFamily.name} foi desbloqueada com sucesso.`,
      });

      setShowUnblock(false);
      setShowDetail(false);
      setUnblockReason('');
      setSelectedFamily(null);
      refetch();
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível desbloquear a família.',
        variant: 'destructive',
      });
    }
  };

  const handleAssociate = async () => {
    if (!selectedFamily || !linkInstitutionId) {
      toast({
        title: 'Selecione uma instituição',
        variant: 'destructive',
      });
      return;
    }

    try {
      await associateFamily.mutateAsync({
        familyId: selectedFamily.id,
        institutionId: linkInstitutionId,
      });
      setLinkInstitutionId('');
      refetch();
    } catch {
      // toast handled by hook
    }
  };

  const handleDisassociate = async (institutionId: string) => {
    if (!selectedFamily) return;

    try {
      await disassociateFamily.mutateAsync({
        familyId: selectedFamily.id,
        institutionId,
      });
      refetch();
    } catch {
      // toast handled by hook
    }
  };

  if (mode === 'create') {
    return (
      <FamilyWizard
        mode="admin"
        onComplete={() => {
          setMode('list');
          refetch();
        }}
        onCancel={() => setMode('list')}
      />
    );
  }

  if (isLoading && families.length === 0) {
    return <LoadingState variant="skeleton" rows={5} />;
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <View className="gap-4 p-4">
        <View>
          <Text className="text-xl font-bold">Famílias</Text>
          <Text className="text-sm text-muted-foreground">
            Gestão central de famílias e vínculos com instituições
          </Text>
        </View>

        <Button onPress={() => setMode('create')}>
          <UserPlus size={16} color="#fff" />
          <Text className="ml-2 font-semibold text-white">Nova Família</Text>
        </Button>

        <Input
          placeholder="Buscar por nome, responsável ou CPF..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />

        <View className="flex-row gap-2">
          {(['all', 'blocked', 'unblocked'] as FamilyStatusFilter[]).map((filter) => (
            <Button
              key={filter}
              size="sm"
              variant={statusFilter === filter ? 'default' : 'outline'}
              onPress={() => setStatusFilter(filter)}
            >
              {filter === 'all' ? 'Todas' : filter === 'blocked' ? 'Bloqueadas' : 'Ativas'}
            </Button>
          ))}
        </View>

        <FlatList
          data={filteredFamilies}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          refreshing={isLoading}
          renderItem={({ item }) => {
            const blockStatus = getFamilyBlockStatus(item);
            const institutionsCount = item.institution_families?.length ?? 0;

            return (
              <Pressable
                onPress={() => {
                  setSelectedFamily(item);
                  setShowDetail(true);
                }}
              >
                <Card className="mb-2">
                  <CardContent className="py-3">
                    <Text className="font-medium">{item.name}</Text>
                    <Text className="text-sm text-muted-foreground">{item.contact_person}</Text>
                    <View className="mt-2 flex-row flex-wrap gap-2">
                      <Badge variant={blockStatus.isBlocked ? 'destructive' : 'success'}>
                        {blockStatus.isBlocked ? 'Bloqueada' : 'Ativa'}
                      </Badge>
                      <Badge variant="outline">
                        {institutionsCount} instituiç{institutionsCount === 1 ? 'ão' : 'ões'}
                      </Badge>
                    </View>
                  </CardContent>
                </Card>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              title="Nenhuma família encontrada"
              description="Ajuste os filtros ou cadastre uma nova família."
            />
          }
        />
      </View>

      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedFamily?.name}</DialogTitle>
            <DialogDescription>Detalhes e vínculos institucionais</DialogDescription>
          </DialogHeader>

          {selectedFamily && (
            <View className="gap-3">
              <Text className="text-sm text-muted-foreground">
                Responsável: {selectedFamily.contact_person}
              </Text>
              {selectedFamily.cpf ? (
                <Text className="text-sm text-muted-foreground">CPF: {selectedFamily.cpf}</Text>
              ) : null}

              <View>
                <Label>Instituições vinculadas</Label>
                {(selectedFamily.institution_families ?? []).length === 0 ? (
                  <Text className="text-sm text-muted-foreground">Nenhum vínculo</Text>
                ) : (
                  (selectedFamily.institution_families ?? []).map((link) => (
                    <View
                      key={link.institution_id}
                      className="mt-1 flex-row items-center justify-between rounded-lg border border-border px-3 py-2"
                    >
                      <Text>{link.institution?.name ?? 'Instituição'}</Text>
                      <Button
                        size="sm"
                        variant="outline"
                        onPress={() => handleDisassociate(link.institution_id)}
                        loading={disassociateFamily.isPending}
                      >
                        Remover
                      </Button>
                    </View>
                  ))
                )}
              </View>

              <InstitutionPicker
                institutions={institutions as Array<{ id: string; name: string }>}
                selectedId={linkInstitutionId}
                onSelect={setLinkInstitutionId}
                label="Vincular a instituição"
              />
              <Button onPress={handleAssociate} loading={associateFamily.isPending}>
                Vincular
              </Button>

              {getFamilyBlockStatus(selectedFamily).isBlocked && (
                <Button variant="outline" onPress={() => setShowUnblock(true)}>
                  <Unlock size={16} color="#004E64" />
                  <Text className="ml-2 text-primary">Desbloquear manualmente</Text>
                </Button>
              )}
            </View>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showUnblock} onOpenChange={setShowUnblock}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desbloqueio manual</DialogTitle>
            <DialogDescription>
              Informe a justificativa para desbloquear {selectedFamily?.name}.
            </DialogDescription>
          </DialogHeader>
          <View className="gap-3">
            <Label>Justificativa *</Label>
            <Textarea value={unblockReason} onChangeText={setUnblockReason} />
            <View className="flex-row gap-2">
              <Button variant="outline" className="flex-1" onPress={() => setShowUnblock(false)}>
                Cancelar
              </Button>
              <Button className="flex-1" onPress={handleUnblock} loading={updateFamily.isPending}>
                Confirmar
              </Button>
            </View>
          </View>
        </DialogContent>
      </Dialog>
    </ScrollView>
  );
}
