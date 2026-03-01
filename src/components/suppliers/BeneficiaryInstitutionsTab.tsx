import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import {
  useBeneficiaryInstitutions,
  useCreateBeneficiaryInstitution,
  useUpdateBeneficiaryInstitution,
  useDeleteBeneficiaryInstitution,
} from '@/hooks/useBeneficiaryInstitutions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCnpj, validateCnpj } from '@/utils/documentFormat';
import { useAuth } from '@/hooks/useAuth';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type BeneficiaryInsert = TablesInsert<'beneficiary_institutions'>;
type BeneficiaryUpdate = TablesUpdate<'beneficiary_institutions'>;

interface BeneficiaryInstitutionsTabProps {
  institutionId?: string;
}

const BeneficiaryInstitutionsTab = ({ institutionId }: BeneficiaryInstitutionsTabProps) => {
  const { profile } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: list = [], isLoading } = useBeneficiaryInstitutions(institutionId);
  const createMutation = useCreateBeneficiaryInstitution();
  const updateMutation = useUpdateBeneficiaryInstitution();
  const deleteMutation = useDeleteBeneficiaryInstitution();

  const form = useForm<BeneficiaryInsert>({
    defaultValues: {
      full_name: '',
      trade_name: '',
      cnpj: '',
      responsible_name: '',
      address: '',
    },
  });

  const editForm = useForm<BeneficiaryUpdate & { id: string }>({
    defaultValues: {
      id: '',
      full_name: '',
      trade_name: '',
      cnpj: '',
      responsible_name: '',
      address: '',
    },
  });

  const handleCreate = async (data: BeneficiaryInsert) => {
    const cnpjClean = data.cnpj?.replace(/\D/g, '') || null;
    if (cnpjClean && cnpjClean.length > 0 && !validateCnpj(data.cnpj ?? '')) {
      form.setError('cnpj', { type: 'manual', message: 'CNPJ inválido' });
      return;
    }
    const instId = institutionId || profile?.institution_id;
    if (!instId) return;
    try {
      await createMutation.mutateAsync({
        ...data,
        institution_id: instId,
        cnpj: cnpjClean || null,
        trade_name: data.trade_name || null,
        responsible_name: data.responsible_name || null,
        address: data.address || null,
      });
      setIsCreateDialogOpen(false);
      form.reset();
    } catch {
      // Error handled by hook
    }
  };

  const handleEdit = (row: (typeof list)[0]) => {
    setSelectedId(row.id);
    editForm.reset({
      id: row.id,
      full_name: row.full_name,
      trade_name: row.trade_name ?? '',
      cnpj: row.cnpj ?? '',
      responsible_name: row.responsible_name ?? '',
      address: row.address ?? '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (data: BeneficiaryUpdate & { id: string }) => {
    const cnpjClean = data.cnpj?.replace(/\D/g, '') || null;
    if (data.cnpj && data.cnpj.trim() && !validateCnpj(data.cnpj)) {
      editForm.setError('cnpj', { type: 'manual', message: 'CNPJ inválido' });
      return;
    }
    try {
      const { id, ...updates } = data;
      await updateMutation.mutateAsync({
        id,
        ...updates,
        cnpj: cnpjClean || null,
        trade_name: updates.trade_name || null,
        responsible_name: updates.responsible_name || null,
        address: updates.address || null,
      });
      setIsEditDialogOpen(false);
      setSelectedId(null);
      editForm.reset();
    } catch {
      // Error handled by hook
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta instituição beneficiada?')) return;
    deleteMutation.mutate(id);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Instituições Beneficiadas</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Instituição
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome completo / Razão social</TableHead>
                <TableHead>Nome fantasia</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Nenhuma instituição beneficiada cadastrada
                  </TableCell>
                </TableRow>
              ) : (
                list.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.full_name}</TableCell>
                    <TableCell>{row.trade_name ?? '-'}</TableCell>
                    <TableCell>{row.cnpj ? formatCnpj(row.cnpj) : '-'}</TableCell>
                    <TableCell>{row.responsible_name ?? '-'}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={row.address ?? ''}>
                      {row.address ?? '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(row)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(row.id)}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Instituição Beneficiada</DialogTitle>
            <DialogDescription>
              Cadastre uma instituição que receberá entregas. Campos marcados com * são obrigatórios.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
              <FormField
                control={form.control}
                name="full_name"
                rules={{ required: 'Nome completo / Razão social é obrigatório' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome completo da associação (razão social) *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Razão social ou nome completo" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="trade_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome fantasia</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome fantasia" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="00.000.000/0000-00"
                        maxLength={18}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, '');
                          const formatted =
                            v.length <= 2
                              ? v
                              : v.length <= 5
                                ? `${v.slice(0, 2)}.${v.slice(2)}`
                                : v.length <= 8
                                  ? `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5)}`
                                  : v.length <= 12
                                    ? `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}/${v.slice(8)}`
                                    : `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}/${v.slice(8, 12)}-${v.slice(12, 14)}`;
                          field.onChange(formatted);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="responsible_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do responsável</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome do responsável" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço da associação</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Endereço completo" rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Instituição Beneficiada</DialogTitle>
            <DialogDescription>Atualize os dados da instituição beneficiada.</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="full_name"
                rules={{ required: 'Nome completo / Razão social é obrigatório' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome completo da associação (razão social) *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="trade_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome fantasia</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="00.000.000/0000-00"
                        maxLength={18}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, '');
                          const formatted =
                            v.length <= 2
                              ? v
                              : v.length <= 5
                                ? `${v.slice(0, 2)}.${v.slice(2)}`
                                : v.length <= 8
                                  ? `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5)}`
                                  : v.length <= 12
                                    ? `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}/${v.slice(8)}`
                                    : `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}/${v.slice(8, 12)}-${v.slice(12, 14)}`;
                          field.onChange(formatted);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="responsible_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do responsável</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço da associação</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BeneficiaryInstitutionsTab;
