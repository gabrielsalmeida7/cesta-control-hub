import React, { useState } from 'react';
import { View, Text, ScrollView, FlatList, RefreshControl, Pressable } from 'react-native';
import { Pencil, Trash2 } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog';
import {
  useInstitutions,
  useCreateInstitution,
  useUpdateInstitution,
  useDeleteInstitution,
} from '@/hooks/useInstitutions';
import { useToast } from '@/hooks/useToast';
import { institutionSchema, institutionUpdateSchema } from '@/utils/validation';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';

type InstitutionRow = {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  responsible_name?: string | null;
};

type FormMode = 'create' | 'edit';

const emptyCreateForm = {
  name: '',
  address: '',
  phone: '',
  email: '',
  password: '',
  responsible_name: '',
};

export default function AdminInstitutionsScreen() {
  const { data: institutions = [], isLoading, isError, refetch, isRefetching } = useInstitutions();
  const createInstitution = useCreateInstitution();
  const updateInstitution = useUpdateInstitution();
  const deleteInstitution = useDeleteInstitution();
  const { toast } = useToast();

  const [formMode, setFormMode] = useState<FormMode>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyCreateForm);

  const resetForm = () => {
    setForm(emptyCreateForm);
    setEditingId(null);
    setFormMode('create');
    setShowForm(false);
  };

  const openCreate = () => {
    setForm(emptyCreateForm);
    setFormMode('create');
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (item: InstitutionRow) => {
    setForm({
      name: item.name ?? '',
      address: item.address ?? '',
      phone: item.phone ?? '',
      email: item.email ?? '',
      password: '',
      responsible_name: item.responsible_name ?? item.name ?? '',
    });
    setEditingId(item.id);
    setFormMode('edit');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (formMode === 'create') {
      const parsed = institutionSchema.safeParse({
        name: form.name.trim(),
        address: form.address.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim(),
        password: form.password,
        responsible_name: form.responsible_name.trim() || form.name.trim(),
      });

      if (!parsed.success) {
        toast({
          title: 'Dados inválidos',
          description: parsed.error.issues[0]?.message ?? 'Verifique os campos.',
          variant: 'destructive',
        });
        return;
      }

      try {
        await createInstitution.mutateAsync(parsed.data);
        resetForm();
        refetch();
        toast({ title: 'Sucesso', description: 'Instituição criada com sucesso.' });
      } catch (error) {
        toast({
          title: 'Erro',
          description: error instanceof Error ? error.message : 'Erro ao criar instituição.',
          variant: 'destructive',
        });
      }
      return;
    }

    if (!editingId) return;

    const parsed = institutionUpdateSchema.safeParse({
      name: form.name.trim(),
      address: form.address.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || undefined,
      responsible_name: form.responsible_name.trim() || undefined,
    });

    if (!parsed.success) {
      toast({
        title: 'Dados inválidos',
        description: parsed.error.issues[0]?.message ?? 'Verifique os campos.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateInstitution.mutateAsync({ id: editingId, updates: parsed.data });
      resetForm();
      refetch();
      toast({ title: 'Sucesso', description: 'Instituição atualizada com sucesso.' });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao atualizar instituição.',
        variant: 'destructive',
      });
    }
  };

  const isSaving = createInstitution.isPending || updateInstitution.isPending;

  if (isLoading && institutions.length === 0) {
    return <LoadingState variant="skeleton" rows={4} />;
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
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-bold">Instituições</Text>
          <Button size="sm" onPress={openCreate}>
            Nova
          </Button>
        </View>

        <Card>
          <CardHeader>
            <CardTitle>Instituições Cadastradas</CardTitle>
          </CardHeader>
          <CardContent>
            <FlatList
              data={institutions as InstitutionRow[]}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              refreshing={isLoading}
              renderItem={({ item }) => (
                <View className="mb-3 border-b border-border pb-3">
                  <Text className="font-medium">{item.name}</Text>
                  <Text className="text-sm text-muted-foreground">
                    {item.email ?? 'Sem email'}
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    {item.address || 'Sem endereço'}
                  </Text>
                  <View className="mt-2 flex-row gap-2">
                    <Pressable
                      className="flex-row items-center gap-1 rounded-lg border border-border px-3 py-2"
                      onPress={() => openEdit(item)}
                    >
                      <Pencil size={14} color="#004E64" />
                      <Text className="text-sm text-primary">Editar</Text>
                    </Pressable>
                    <Button
                      variant="destructive"
                      size="sm"
                      onPress={() => deleteInstitution.mutate(item.id)}
                    >
                      <Trash2 size={14} color="#fff" />
                      <Text className="ml-1 text-white">Excluir</Text>
                    </Button>
                  </View>
                </View>
              )}
              ListEmptyComponent={<EmptyState title="Nenhuma instituição" description="Cadastre a primeira instituição pelo botão Nova." />}
            />
          </CardContent>
        </Card>
      </View>

      <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {formMode === 'create' ? 'Nova Instituição' : 'Editar Instituição'}
            </DialogTitle>
            <DialogDescription>
              {formMode === 'create'
                ? 'Cria a instituição e o usuário de acesso via Edge Function.'
                : 'Atualiza os dados da instituição. O email de login no Auth pode exigir ajuste no backend.'}
            </DialogDescription>
          </DialogHeader>

          <View className="gap-3">
            <View className="gap-2">
              <Label>Nome *</Label>
              <Input
                value={form.name}
                onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
                placeholder="Nome da instituição"
              />
            </View>
            <View className="gap-2">
              <Label>Responsável</Label>
              <Input
                value={form.responsible_name}
                onChangeText={(value) =>
                  setForm((prev) => ({ ...prev, responsible_name: value }))
                }
                placeholder="Nome do responsável"
              />
            </View>
            <View className="gap-2">
              <Label>Endereço</Label>
              <Input
                value={form.address}
                onChangeText={(value) => setForm((prev) => ({ ...prev, address: value }))}
                placeholder="Endereço"
              />
            </View>
            <View className="gap-2">
              <Label>Telefone</Label>
              <Input
                value={form.phone}
                onChangeText={(value) => setForm((prev) => ({ ...prev, phone: value }))}
                placeholder="Telefone"
                keyboardType="phone-pad"
              />
            </View>
            <View className="gap-2">
              <Label>Email do usuário *</Label>
              <Input
                value={form.email}
                onChangeText={(value) => setForm((prev) => ({ ...prev, email: value }))}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {formMode === 'create' && (
              <View className="gap-2">
                <Label>Senha do usuário *</Label>
                <Input
                  value={form.password}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, password: value }))}
                  secureTextEntry
                />
              </View>
            )}
            <View className="flex-row gap-2">
              <Button variant="outline" className="flex-1" onPress={resetForm}>
                Cancelar
              </Button>
              <Button className="flex-1" onPress={handleSave} loading={isSaving}>
                {formMode === 'create' ? 'Criar' : 'Salvar'}
              </Button>
            </View>
          </View>
        </DialogContent>
      </Dialog>
    </ScrollView>
  );
}
