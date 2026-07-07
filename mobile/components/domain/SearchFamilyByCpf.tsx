import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Search, Link, AlertCircle, CheckCircle } from 'lucide-react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  searchFamilyByCpf,
  useAssociateFamilyWithInstitution,
  type FamilySearchResult,
} from '@/hooks/useFamilies';
import { useAuth } from '@/hooks/useAuth';
import { formatCpf } from '@/utils/documentFormat';
import { getFamilyBlockStatus } from '@/utils/familyBlockStatus';

export interface SelectedFamilyForDelivery {
  id: string;
  name: string;
  contact_person: string;
  phone?: string | null;
  members_count?: number | null;
  is_blocked?: boolean;
  blocked_until?: string | null;
  block_reason?: string | null;
  blocked_by_institution?: { name?: string } | null;
}

type SearchMode = 'cpf' | 'name' | 'mother_name';

interface SearchFamilyByCpfProps {
  variant?: 'delivery' | 'associate';
  onFamilySelected: (family: SelectedFamilyForDelivery) => void;
  onFamilyNotFound?: (cpf?: string) => void;
}

function mapFamilyToSelected(
  family: NonNullable<FamilySearchResult['family']>
): SelectedFamilyForDelivery {
  return {
    id: family.id,
    name: family.name,
    contact_person: family.contact_person,
    phone: family.phone,
    members_count: family.members_count,
    is_blocked: family.is_blocked ?? undefined,
    blocked_until: family.blocked_until,
    block_reason: family.block_reason,
    blocked_by_institution: family.blocked_by_institution ?? null,
  };
}

export function SearchFamilyByCpf({
  variant = 'delivery',
  onFamilySelected,
  onFamilyNotFound,
}: SearchFamilyByCpfProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchBy, setSearchBy] = useState<SearchMode>('cpf');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<FamilySearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { profile } = useAuth();
  const associateMutation = useAssociateFamilyWithInstitution();

  const resetSearch = () => {
    setSearchTerm('');
    setSearchResult(null);
    setError(null);
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Digite um CPF, nome da família ou nome da mãe para buscar.');
      return;
    }

    setIsSearching(true);
    setError(null);
    setSearchResult(null);

    try {
      const result = await searchFamilyByCpf(searchTerm, profile?.institution_id, searchBy);
      setSearchResult(result);

      if (result.scenario === 4 && result.family) {
        onFamilySelected(mapFamilyToSelected(result.family));
        resetSearch();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar família. Tente novamente.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAssociate = async (family: NonNullable<FamilySearchResult['family']>) => {
    if (!profile?.institution_id) return;

    try {
      await associateMutation.mutateAsync({
        familyId: family.id,
        institutionId: profile.institution_id,
      });

      onFamilySelected(mapFamilyToSelected(family));
      resetSearch();
    } catch {
      // toast handled by hook
    }
  };

  const searchModes: { id: SearchMode; label: string }[] = [
    { id: 'cpf', label: 'CPF' },
    { id: 'name', label: 'Nome' },
    { id: 'mother_name', label: 'Nome da Mãe' },
  ];

  return (
    <View className="gap-3">
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Input
            placeholder={
              searchBy === 'cpf'
                ? 'CPF (000.000.000-00)'
                : searchBy === 'name'
                  ? 'Nome da família'
                  : 'Nome da mãe'
            }
            value={searchTerm}
            onChangeText={(value) => {
              setSearchTerm(searchBy === 'cpf' ? formatCpf(value) : value);
            }}
            keyboardType={searchBy === 'cpf' ? 'numeric' : 'default'}
            maxLength={searchBy === 'cpf' ? 14 : undefined}
            onSubmitEditing={handleSearch}
          />
        </View>
        <Button onPress={handleSearch} loading={isSearching} disabled={!searchTerm.trim()}>
          <Search size={18} color="#fff" />
        </Button>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {searchModes.map((mode) => (
          <Pressable
            key={mode.id}
            onPress={() => {
              setSearchBy(mode.id);
              resetSearch();
            }}
            className={`rounded-lg px-3 py-1.5 ${searchBy === mode.id ? 'bg-primary' : 'bg-secondary'}`}
          >
            <Text
              className={`text-xs font-medium ${searchBy === mode.id ? 'text-white' : 'text-foreground'}`}
            >
              {mode.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {error ? (
        <View className="flex-row items-center gap-2 rounded-lg border border-danger bg-danger/10 p-3">
          <AlertCircle size={18} color="#EF476F" />
          <Text className="flex-1 text-sm text-danger">{error}</Text>
        </View>
      ) : null}

      {searchResult ? (
        <Card>
          <CardContent className="gap-3 pt-4">
            <Text className="text-sm text-muted-foreground">{searchResult.message}</Text>

            {searchResult.scenario === 1 && searchResult.family ? (
              <FamilyResultCard
                family={searchResult.family}
                actionLabel="Vincular e Selecionar"
                onAction={() => handleAssociate(searchResult.family!)}
                loading={associateMutation.isPending}
              />
            ) : null}

            {searchResult.scenario === 2 && searchResult.family ? (
              <FamilyResultCard
                family={searchResult.family}
                actionLabel="Vincular e Selecionar"
                onAction={() => handleAssociate(searchResult.family!)}
                loading={associateMutation.isPending}
              />
            ) : null}

            {searchResult.scenario === 3 ? (
              <View className="gap-2">
                <Text className="text-sm text-muted-foreground">
                  Nenhuma família encontrada com os dados informados.
                </Text>
                {variant === 'associate' && onFamilyNotFound ? (
                  <Button
                    onPress={() => {
                      const cpf =
                        searchBy === 'cpf' ? searchTerm.replace(/\D/g, '') : undefined;
                      onFamilyNotFound(cpf);
                      resetSearch();
                    }}
                  >
                    Cadastrar Nova Família
                  </Button>
                ) : variant === 'delivery' ? (
                  <Text className="text-sm text-muted-foreground">
                    Cadastre a família na aba Famílias antes de registrar a entrega.
                  </Text>
                ) : null}
              </View>
            ) : null}

            {searchResult.scenario === 4 ? (
              <View className="flex-row items-center gap-2 rounded-lg bg-primary/10 p-3">
                <CheckCircle size={18} color="#004E64" />
                <Text className="flex-1 text-sm text-primary">
                  Família já vinculada — selecionada para entrega.
                </Text>
              </View>
            ) : null}

            {searchResult.scenario === 5 && searchResult.families
              ? searchResult.families.map((family) => {
                  const linked = family.institution_families?.some(
                    (a) => a.institution_id === profile?.institution_id
                  );
                  return (
                    <View key={family.id} className="gap-2 border-t border-border pt-3">
                      <FamilyResultCard family={family} showDetailsOnly />
                      {linked ? (
                        <Button
                          variant="outline"
                          onPress={() => {
                            onFamilySelected(mapFamilyToSelected(family));
                            resetSearch();
                          }}
                        >
                          Selecionar para Entrega
                        </Button>
                      ) : (
                        <Button
                          onPress={() => handleAssociate(family)}
                          loading={associateMutation.isPending}
                        >
                          Vincular e Selecionar
                        </Button>
                      )}
                    </View>
                  );
                })
              : null}
          </CardContent>
        </Card>
      ) : null}
    </View>
  );
}

function FamilyResultCard({
  family,
  actionLabel,
  onAction,
  loading,
  showDetailsOnly,
}: {
  family: NonNullable<FamilySearchResult['family']>;
  actionLabel?: string;
  onAction?: () => void;
  loading?: boolean;
  showDetailsOnly?: boolean;
}) {
  const block = getFamilyBlockStatus(family);

  return (
    <View className="gap-2 rounded-lg bg-muted p-3">
      <Text className="font-medium">{family.name}</Text>
      <Text className="text-sm text-muted-foreground">{family.contact_person}</Text>
      {family.phone ? (
        <Text className="text-sm text-muted-foreground">{family.phone}</Text>
      ) : null}
      {block.isBlocked ? (
        <Badge variant="destructive">Bloqueada ({block.daysRemaining} dias)</Badge>
      ) : (
        <Badge variant="success">Liberada</Badge>
      )}
      {!showDetailsOnly && actionLabel && onAction ? (
        <Button onPress={onAction} loading={loading} className="mt-2">
          <Link size={16} color="#fff" />
          <Text className="ml-2 font-semibold text-white">{actionLabel}</Text>
        </Button>
      ) : null}
    </View>
  );
}
