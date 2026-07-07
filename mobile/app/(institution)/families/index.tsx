import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { UserPlus, Search, Unlock } from 'lucide-react-native';
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
import { SearchFamilyByCpf } from '@/components/domain/SearchFamilyByCpf';
import { FamilyWizard } from '@/components/domain/FamilyWizard';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useInstitutionFamilies, useUpdateFamily } from '@/hooks/useFamilies';
import { supabase } from '@/integrations/supabase/client';
import { getFamilyBlockStatus } from '@/utils/familyBlockStatus';

type FamilyStatusFilter = 'all' | 'blocked' | 'unblocked';

interface InstitutionFamily {
  id: string;
  name: string;
  contact_person: string;
  phone?: string | null;
  cpf?: string | null;
  address?: string | null;
  members_count?: number | null;
  is_blocked?: boolean;
  blocked_until?: string | null;
  block_reason?: string | null;
  blocked_by_institution?: { name?: string } | null;
  mother_name?: string | null;
}

type ScreenMode = 'list' | 'create' | 'search';

export default function InstitutionFamiliesScreen() {
  const { profile, user } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState<ScreenMode>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FamilyStatusFilter>('all');
  const [institutionName, setInstitutionName] = useState('Instituição');
  const [prefilledCpf, setPrefilledCpf] = useState<string | undefined>();
  const [selectedFamily, setSelectedFamily] = useState<InstitutionFamily | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showUnblock, setShowUnblock] = useState(false);
  const [unblockReason, setUnblockReason] = useState('');

  const {
    data: families = [],
    isLoading,
    refetch,
    isRefetching,
  } = useInstitutionFamilies(profile?.institution_id);

  const updateFamily = useUpdateFamily();

  useEffect(() => {
    const loadInstitutionName = async () => {
      if (!profile?.institution_id) return;
      const { data } = await supabase
        .from('institutions')
        .select('name')
        .eq('id', profile.institution_id)
        .single();
      if (data?.name) setInstitutionName(data.name);
    };
    loadInstitutionName();
  }, [profile?.institution_id]);

  const filteredFamilies = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const searchNumbers = searchTerm.replace(/\D/g, '');

    let list = (families as InstitutionFamily[]).filter((family) => {
      if (!q && !searchNumbers) return true;
      const textMatch =
        family.name.toLowerCase().includes(q) ||
        family.contact_person.toLowerCase().includes(q) ||
        (family.mother_name ?? '').toLowerCase().includes(q);
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

  if (mode === 'create' && profile?.institution_id) {
    return (
      <FamilyWizard
        institutionId={profile.institution_id}
        institutionName={institutionName}
        initialCpf={prefilledCpf}
        onComplete={() => {
          setMode('list');
          setPrefilledCpf(undefined);
          refetch();
        }}
        onCancel={() => {
          setMode('list');
          setPrefilledCpf(undefined);
        }}
      />
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="border-b border-border bg-white p-4">
        <Text className="text-xl font-bold">Famílias</Text>
        <Text className="text-sm text-muted-foreground">
          Gerencie famílias vinculadas à sua instituição
        </Text>
        <View className="mt-3 flex-row gap-2">
          <Button className="flex-1" onPress={() => setMode('create')}>
            <UserPlus size={16} color="#fff" />
            <Text className="ml-2 font-semibold text-white">Nova Família</Text>
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onPress={() => setMode(mode === 'search' ? 'list' : 'search')}
          >
            <Search size={16} color="#004E64" />
            <Text className="ml-2 font-semibold text-foreground">Buscar CPF</Text>
          </Button>
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <View className="gap-4 p-4">
          {mode === 'search' ? (
            <Card>
              <CardHeader>
                <CardTitle>Buscar e Vincular Família</CardTitle>
              </CardHeader>
              <CardContent>
                <SearchFamilyByCpf
                  variant="associate"
                  onFamilySelected={() => {
                    setMode('list');
                    refetch();
                    toast({
                      title: 'Família vinculada',
                      description: 'Família associada à sua instituição.',
                    });
                  }}
                  onFamilyNotFound={(cpf) => {
                    setPrefilledCpf(cpf);
                    setMode('create');
                  }}
                />
              </CardContent>
            </Card>
          ) : null}

          <Input
            placeholder="Buscar por nome ou CPF..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />

          <View className="flex-row flex-wrap gap-2">
            {(
              [
                { id: 'all', label: 'Todas' },
                { id: 'unblocked', label: 'Liberadas' },
                { id: 'blocked', label: 'Bloqueadas' },
              ] as const
            ).map((filter) => (
              <Pressable
                key={filter.id}
                onPress={() => setStatusFilter(filter.id)}
                className={`rounded-lg px-3 py-1.5 ${
                  statusFilter === filter.id ? 'bg-primary' : 'bg-secondary'
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    statusFilter === filter.id ? 'text-white' : 'text-foreground'
                  }`}
                >
                  {filter.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <FlatList
            data={filteredFamilies}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            refreshing={isLoading}
            renderItem={({ item }) => {
              const block = getFamilyBlockStatus(item);
              return (
                <Pressable
                  onPress={() => {
                    setSelectedFamily(item);
                    setShowDetail(true);
                  }}
                >
                  <Card className="mb-2">
                    <CardContent className="py-3">
                      <View className="flex-row items-start justify-between gap-2">
                        <View className="flex-1">
                          <Text className="font-medium">{item.name}</Text>
                          <Text className="text-sm text-muted-foreground">
                            {item.contact_person}
                          </Text>
                          {item.members_count ? (
                            <Text className="text-xs text-muted-foreground">
                              {item.members_count} membro(s)
                            </Text>
                          ) : null}
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
                    </CardContent>
                  </Card>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              !isLoading ? (
                <Text className="text-center text-muted-foreground">
                  Nenhuma família encontrada
                </Text>
              ) : null
            }
          />
        </View>
      </ScrollView>

      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedFamily?.name}</DialogTitle>
            <DialogDescription>Detalhes da família</DialogDescription>
          </DialogHeader>

          {selectedFamily ? (
            <View className="gap-2">
              <Text className="text-sm">
                <Text className="font-semibold">Responsável: </Text>
                {selectedFamily.contact_person}
              </Text>
              {selectedFamily.phone ? (
                <Text className="text-sm">
                  <Text className="font-semibold">Telefone: </Text>
                  {selectedFamily.phone}
                </Text>
              ) : null}
              {selectedFamily.address ? (
                <Text className="text-sm">
                  <Text className="font-semibold">Endereço: </Text>
                  {selectedFamily.address}
                </Text>
              ) : null}

              {(() => {
                const block = getFamilyBlockStatus(selectedFamily);
                if (!block.isBlocked) {
                  return <Badge variant="success">Liberada para entrega</Badge>;
                }
                return (
                  <View className="gap-1 rounded-lg border border-danger bg-danger/10 p-3">
                    <Text className="font-medium text-danger">Família bloqueada</Text>
                    <Text className="text-sm text-danger">
                      {block.blockedByInstitutionName
                        ? `Por ${block.blockedByInstitutionName}`
                        : 'Período de carência'}
                      {block.blockedUntilFormatted
                        ? ` até ${block.blockedUntilFormatted}`
                        : ''}{' '}
                      ({block.daysRemaining} dia(s))
                    </Text>
                    {block.blockReason ? (
                      <Text className="text-sm text-danger">Motivo: {block.blockReason}</Text>
                    ) : null}
                    <Button
                      variant="outline"
                      className="mt-2"
                      onPress={() => setShowUnblock(true)}
                    >
                      <Unlock size={16} color="#004E64" />
                      <Text className="ml-2 font-semibold text-foreground">
                        Desbloquear manualmente
                      </Text>
                    </Button>
                  </View>
                );
              })()}
            </View>
          ) : null}

          <Button variant="outline" onPress={() => setShowDetail(false)}>
            Fechar
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={showUnblock} onOpenChange={setShowUnblock}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desbloquear Família</DialogTitle>
            <DialogDescription>
              Informe a justificativa para desbloqueio manual de {selectedFamily?.name}.
            </DialogDescription>
          </DialogHeader>
          <View className="gap-2">
            <Label>Justificativa *</Label>
            <Textarea
              value={unblockReason}
              onChangeText={setUnblockReason}
              placeholder="Motivo do desbloqueio para auditoria..."
            />
          </View>
          <View className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onPress={() => setShowUnblock(false)}>
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onPress={handleUnblock}
              loading={updateFamily.isPending}
              disabled={!unblockReason.trim()}
            >
              Confirmar
            </Button>
          </View>
        </DialogContent>
      </Dialog>
    </View>
  );
}
