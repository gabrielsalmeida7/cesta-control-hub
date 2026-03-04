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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCnpj, validateCnpj, validateCpf } from '@/utils/documentFormat';
import { useAuth } from '@/hooks/useAuth';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import {
  LEGAL_NATURE_OPTIONS,
  MAIN_ACTIVITY_OPTIONS,
  UF_OPTIONS,
  RESPONSIBLE_ROLE_OPTIONS,
  AUDIENCE_PROFILE_OPTIONS,
  SERVICE_FREQUENCY_OPTIONS,
  REGISTRATION_STATUS_OPTIONS,
} from './beneficiaryInstitutionFormOptions';

type BeneficiaryInsert = TablesInsert<'beneficiary_institutions'>;
type BeneficiaryUpdate = TablesUpdate<'beneficiary_institutions'>;

const getDefaultValues = (): Partial<BeneficiaryInsert> => ({
  full_name: '',
  trade_name: '',
  cnpj: '',
  responsible_name: '',
  address: '',
  foundation_date: null,
  legal_nature: null,
  legal_nature_other: '',
  main_activity_areas: null,
  street: '',
  address_number: '',
  address_complement: '',
  neighborhood: '',
  city: '',
  state: '',
  zip_code: '',
  reference_point: '',
  phone_fixed: '',
  phone_mobile: '',
  email: '',
  social_media: '',
  responsible_role: null,
  responsible_cpf: '',
  responsible_rg: '',
  responsible_phone: '',
  responsible_email: '',
  vice_president_name: '',
  treasurer_name: '',
  families_served_count: null,
  people_served_count: null,
  audience_profile: null,
  service_frequency: null,
  registration_status: 'Ativo',
  technical_notes: '',
  terms_accepted: null,
  norms_accepted: null,
  technical_visit_done: null,
  legal_acceptance: null,
});

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

  const form = useForm<BeneficiaryInsert & { id?: string }>({
    defaultValues: { ...getDefaultValues() } as BeneficiaryInsert,
  });

  const editForm = useForm<BeneficiaryUpdate & { id: string }>({
    defaultValues: { id: '', ...getDefaultValues() } as BeneficiaryUpdate & { id: string },
  });

  const preparePayload = (data: Record<string, unknown>) => {
    const cnpjClean = (data.cnpj as string)?.replace(/\D/g, '') || null;
    const cpfClean = (data.responsible_cpf as string)?.replace(/\D/g, '') || null;
    const foundationDate = data.foundation_date as string | null;
    const documentReviewDate = data.document_review_date as string | null;
    return {
      ...data,
      cnpj: cnpjClean || null,
      responsible_cpf: cpfClean || null,
      foundation_date: foundationDate && foundationDate.length >= 10 ? foundationDate.slice(0, 10) : null,
      document_review_date: documentReviewDate && documentReviewDate.length >= 10 ? documentReviewDate.slice(0, 10) : null,
      main_activity_areas: Array.isArray(data.main_activity_areas) ? data.main_activity_areas : null,
      audience_profile: Array.isArray(data.audience_profile) ? data.audience_profile : null,
    };
  };

  const handleCreate = async (data: BeneficiaryInsert & { id?: string }) => {
    const cnpjClean = data.cnpj?.replace(/\D/g, '') || null;
    if (cnpjClean && cnpjClean.length > 0 && !validateCnpj(data.cnpj ?? '')) {
      form.setError('cnpj', { type: 'manual', message: 'CNPJ inválido' });
      return;
    }
    const cpfVal = data.responsible_cpf?.replace(/\D/g, '') ?? '';
    if (cpfVal.length > 0 && !validateCpf(data.responsible_cpf ?? '')) {
      form.setError('responsible_cpf', { type: 'manual', message: 'CPF inválido' });
      return;
    }
    const instId = institutionId || profile?.institution_id;
    if (!instId) return;
    try {
      const payload = preparePayload(data as Record<string, unknown>) as BeneficiaryInsert;
      await createMutation.mutateAsync({
        ...payload,
        institution_id: instId,
        created_by_user_id: profile?.id ?? null,
        document_review_by_user_id: profile?.id ?? null,
        legal_acceptance_at: payload.legal_acceptance ? new Date().toISOString() : null,
        legal_acceptance_ip: payload.legal_acceptance ? null : null,
      });
      setIsCreateDialogOpen(false);
      form.reset(getDefaultValues() as Record<string, unknown>);
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
      foundation_date: row.foundation_date ?? null,
      legal_nature: row.legal_nature ?? null,
      legal_nature_other: row.legal_nature_other ?? '',
      main_activity_areas: row.main_activity_areas ?? null,
      street: row.street ?? '',
      address_number: row.address_number ?? '',
      address_complement: row.address_complement ?? '',
      neighborhood: row.neighborhood ?? '',
      city: row.city ?? '',
      state: row.state ?? '',
      zip_code: row.zip_code ?? '',
      reference_point: row.reference_point ?? '',
      phone_fixed: row.phone_fixed ?? '',
      phone_mobile: row.phone_mobile ?? '',
      email: row.email ?? '',
      social_media: row.social_media ?? '',
      responsible_role: row.responsible_role ?? null,
      responsible_cpf: row.responsible_cpf ?? '',
      responsible_rg: row.responsible_rg ?? '',
      responsible_phone: row.responsible_phone ?? '',
      responsible_email: row.responsible_email ?? '',
      vice_president_name: row.vice_president_name ?? '',
      treasurer_name: row.treasurer_name ?? '',
      families_served_count: row.families_served_count ?? null,
      people_served_count: row.people_served_count ?? null,
      audience_profile: row.audience_profile ?? null,
      service_frequency: row.service_frequency ?? null,
      registration_status: row.registration_status ?? 'Ativo',
      technical_notes: row.technical_notes ?? '',
      terms_accepted: row.terms_accepted ?? null,
      norms_accepted: row.norms_accepted ?? null,
      technical_visit_done: row.technical_visit_done ?? null,
      legal_acceptance: row.legal_acceptance ?? null,
      statute_file_path: row.statute_file_path ?? null,
      election_minutes_file_path: row.election_minutes_file_path ?? null,
      cnpj_card_file_path: row.cnpj_card_file_path ?? null,
      address_proof_file_path: row.address_proof_file_path ?? null,
      legal_rep_document_file_path: row.legal_rep_document_file_path ?? null,
      negative_certificates_file_path: row.negative_certificates_file_path ?? null,
      document_review_date: row.document_review_date ?? null,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (data: BeneficiaryUpdate & { id: string }) => {
    const cnpjClean = data.cnpj?.replace(/\D/g, '') || null;
    if (data.cnpj && data.cnpj.trim() && !validateCnpj(data.cnpj)) {
      editForm.setError('cnpj', { type: 'manual', message: 'CNPJ inválido' });
      return;
    }
    const cpfVal = data.responsible_cpf?.replace(/\D/g, '') ?? '';
    if (data.responsible_cpf && data.responsible_cpf.trim() && !validateCpf(data.responsible_cpf)) {
      editForm.setError('responsible_cpf', { type: 'manual', message: 'CPF inválido' });
      return;
    }
    try {
      const { id, ...rest } = data;
      const payload = preparePayload(rest as Record<string, unknown>);
      await updateMutation.mutateAsync({ id, ...payload } as BeneficiaryUpdate & { id: string });
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
                <TableHead>Cidade</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
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
                    <TableCell>{row.city ?? '-'}</TableCell>
                    <TableCell>{row.registration_status ?? 'Ativo'}</TableCell>
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
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Nova Instituição Beneficiada</DialogTitle>
            <DialogDescription>
              Ficha cadastral. Campos marcados com * são obrigatórios.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreate)} className="flex flex-col flex-1 min-h-0">
              <Tabs defaultValue="identificacao" className="flex-1 overflow-hidden flex flex-col min-h-0">
                <TabsList className="grid grid-cols-4 lg:grid-cols-7 w-full shrink-0">
                  <TabsTrigger value="identificacao" className="text-xs">Identificação</TabsTrigger>
                  <TabsTrigger value="endereco" className="text-xs">Endereço</TabsTrigger>
                  <TabsTrigger value="contatos" className="text-xs">Contatos</TabsTrigger>
                  <TabsTrigger value="responsavel" className="text-xs">Responsável</TabsTrigger>
                  <TabsTrigger value="documentacao" className="text-xs">Documentação</TabsTrigger>
                  <TabsTrigger value="publico" className="text-xs">Público</TabsTrigger>
                  <TabsTrigger value="controle" className="text-xs">Controle</TabsTrigger>
                </TabsList>
                <div className="overflow-y-auto py-4 min-h-0 flex-1">
                  <TabsContent value="identificacao" className="mt-0 space-y-4">
                    <FormField control={form.control} name="full_name" rules={{ required: 'Obrigatório' }} render={({ field }) => (<FormItem><FormLabel>Nome completo da associação (razão social) *</FormLabel><FormControl><Input {...field} placeholder="Razão social" /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="trade_name" render={({ field }) => (<FormItem><FormLabel>Nome fantasia</FormLabel><FormControl><Input {...field} placeholder="Nome fantasia" /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="cnpj" rules={{ required: 'CNPJ obrigatório' }} render={({ field }) => (<FormItem><FormLabel>CNPJ *</FormLabel><FormControl><Input {...field} placeholder="00.000.000/0000-00" maxLength={18} onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); const fmt = v.length <= 12 ? v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})?/, (_, a, b, c, d) => d ? `${a}.${b}.${c}/${d}` : `${a}.${b}.${c}`) : v.slice(0, 14).replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5'); field.onChange(fmt); }} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="foundation_date" render={({ field }) => (<FormItem><FormLabel>Data de fundação *</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value || null)} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="legal_nature" rules={{ required: 'Obrigatório' }} render={({ field }) => (<FormItem><FormLabel>Natureza jurídica *</FormLabel><FormControl><Select value={field.value ?? ''} onValueChange={(v) => { field.onChange(v || null); if (v !== 'Outro') form.setValue('legal_nature_other', ''); }}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{LEGAL_NATURE_OPTIONS.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent></Select></FormControl><FormMessage /></FormItem>)} />
                    {form.watch('legal_nature') === 'Outro' && <FormField control={form.control} name="legal_nature_other" render={({ field }) => (<FormItem><FormLabel>Outra natureza</FormLabel><FormControl><Input {...field} placeholder="Especifique" /></FormControl><FormMessage /></FormItem>)} />}
                    <FormField control={form.control} name="main_activity_areas" render={({ field }) => (<FormItem><FormLabel>Área de atuação principal *</FormLabel><div className="flex flex-wrap gap-2 border rounded-md p-3"><span className="sr-only">Multisseleção</span>{MAIN_ACTIVITY_OPTIONS.map((opt) => (<label key={opt} className="flex items-center gap-2 cursor-pointer"><Checkbox checked={(field.value ?? []).includes(opt)} onCheckedChange={(checked) => { const arr = field.value ?? []; field.onChange(checked ? [...arr, opt] : arr.filter((x) => x !== opt)); }} /><span className="text-sm">{opt}</span></label>))}</div><FormMessage /></FormItem>)} />
                  </TabsContent>
                  <TabsContent value="endereco" className="mt-0 space-y-4">
                    <FormField control={form.control} name="street" rules={{ required: 'Obrigatório' }} render={({ field }) => (<FormItem><FormLabel>Logradouro *</FormLabel><FormControl><Input {...field} placeholder="Rua, Av..." /></FormControl><FormMessage /></FormItem>)} />
                    <div className="grid grid-cols-2 gap-4"><FormField control={form.control} name="address_number" rules={{ required: 'Obrigatório' }} render={({ field }) => (<FormItem><FormLabel>Número *</FormLabel><FormControl><Input {...field} placeholder="Nº" /></FormControl><FormMessage /></FormItem>)} /><FormField control={form.control} name="address_complement" render={({ field }) => (<FormItem><FormLabel>Complemento</FormLabel><FormControl><Input {...field} placeholder="Apto, sala" /></FormControl><FormMessage /></FormItem>)} /></div>
                    <FormField control={form.control} name="neighborhood" rules={{ required: 'Obrigatório' }} render={({ field }) => (<FormItem><FormLabel>Bairro *</FormLabel><FormControl><Input {...field} placeholder="Bairro" /></FormControl><FormMessage /></FormItem>)} />
                    <div className="grid grid-cols-3 gap-4"><FormField control={form.control} name="city" rules={{ required: 'Obrigatório' }} render={({ field }) => (<FormItem><FormLabel>Cidade *</FormLabel><FormControl><Input {...field} placeholder="Cidade" /></FormControl><FormMessage /></FormItem>)} /><FormField control={form.control} name="state" rules={{ required: 'Obrigatório' }} render={({ field }) => (<FormItem><FormLabel>Estado (UF) *</FormLabel><FormControl><Select value={field.value ?? ''} onValueChange={field.onChange}><SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger><SelectContent>{UF_OPTIONS.map((uf) => (<SelectItem key={uf} value={uf}>{uf}</SelectItem>))}</SelectContent></Select></FormControl><FormMessage /></FormItem>)} /><FormField control={form.control} name="zip_code" rules={{ required: 'CEP obrigatório' }} render={({ field }) => (<FormItem><FormLabel>CEP *</FormLabel><FormControl><Input {...field} placeholder="00000-000" maxLength={9} onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 8); field.onChange(v.length > 5 ? `${v.slice(0, 5)}-${v.slice(5)}` : v); }} /></FormControl><FormMessage /></FormItem>)} /></div>
                    <FormField control={form.control} name="reference_point" render={({ field }) => (<FormItem><FormLabel>Ponto de referência</FormLabel><FormControl><Input {...field} placeholder="Referência" /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Endereço completo (texto livre, opcional)</FormLabel><FormControl><Textarea {...field} rows={2} placeholder="Para compatibilidade" /></FormControl><FormMessage /></FormItem>)} />
                  </TabsContent>
                  <TabsContent value="contatos" className="mt-0 space-y-4">
                    <FormField control={form.control} name="phone_fixed" render={({ field }) => (<FormItem><FormLabel>Telefone fixo</FormLabel><FormControl><Input {...field} placeholder="(00) 0000-0000" /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="phone_mobile" rules={{ required: 'Celular/WhatsApp obrigatório' }} render={({ field }) => (<FormItem><FormLabel>Celular / WhatsApp *</FormLabel><FormControl><Input {...field} placeholder="(00) 00000-0000" /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="email" rules={{ required: 'E-mail institucional obrigatório' }} render={({ field }) => (<FormItem><FormLabel>E-mail institucional *</FormLabel><FormControl><Input {...field} type="email" placeholder="email@instituicao.org" /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="social_media" render={({ field }) => (<FormItem><FormLabel>Redes sociais</FormLabel><FormControl><Input {...field} placeholder="Links ou @usuario" /></FormControl><FormMessage /></FormItem>)} />
                  </TabsContent>
                  <TabsContent value="responsavel" className="mt-0 space-y-4">
                    <FormField control={form.control} name="responsible_name" rules={{ required: 'Obrigatório' }} render={({ field }) => (<FormItem><FormLabel>Nome completo do responsável legal *</FormLabel><FormControl><Input {...field} placeholder="Nome completo" /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="responsible_role" rules={{ required: 'Obrigatório' }} render={({ field }) => (<FormItem><FormLabel>Cargo *</FormLabel><FormControl><Select value={field.value ?? ''} onValueChange={field.onChange}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{RESPONSIBLE_ROLE_OPTIONS.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent></Select></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="responsible_cpf" rules={{ required: 'CPF obrigatório' }} render={({ field }) => (<FormItem><FormLabel>CPF *</FormLabel><FormControl><Input {...field} placeholder="000.000.000-00" maxLength={14} onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 11); const fmt = v.length <= 9 ? v.replace(/(\d{3})(\d{3})(\d{3})?/, (_, a, b, c) => c ? `${a}.${b}.${c}` : `${a}.${b}`) : v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'); field.onChange(fmt); }} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="responsible_rg" render={({ field }) => (<FormItem><FormLabel>RG</FormLabel><FormControl><Input {...field} placeholder="RG" /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="responsible_phone" rules={{ required: 'Telefone obrigatório' }} render={({ field }) => (<FormItem><FormLabel>Telefone *</FormLabel><FormControl><Input {...field} placeholder="(00) 00000-0000" /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="responsible_email" rules={{ required: 'E-mail obrigatório' }} render={({ field }) => (<FormItem><FormLabel>E-mail *</FormLabel><FormControl><Input {...field} type="email" placeholder="email@email.com" /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="vice_president_name" render={({ field }) => (<FormItem><FormLabel>Vice-presidente (opcional)</FormLabel><FormControl><Input {...field} placeholder="Nome" /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="treasurer_name" render={({ field }) => (<FormItem><FormLabel>Tesoureiro (opcional)</FormLabel><FormControl><Input {...field} placeholder="Nome" /></FormControl><FormMessage /></FormItem>)} />
                  </TabsContent>
                  <TabsContent value="documentacao" className="mt-0 space-y-4">
                    <p className="text-sm text-muted-foreground">Registro da conferência documental. O upload de arquivos não é utilizado nesta configuração.</p>
                    <FormField control={form.control} name="document_review_date" render={({ field }) => (<FormItem><FormLabel>Data da conferência documental</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value || null)} /></FormControl><FormMessage /></FormItem>)} />
                  </TabsContent>
                  <TabsContent value="publico" className="mt-0 space-y-4">
                    <FormField control={form.control} name="families_served_count" rules={{ required: 'Obrigatório' }} render={({ field }) => (<FormItem><FormLabel>Quantidade de famílias atendidas *</FormLabel><FormControl><Input type="number" min={0} {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="people_served_count" rules={{ required: 'Obrigatório' }} render={({ field }) => (<FormItem><FormLabel>Quantidade de pessoas atendidas *</FormLabel><FormControl><Input type="number" min={0} {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="audience_profile" render={({ field }) => (<FormItem><FormLabel>Perfil do público</FormLabel><div className="flex flex-wrap gap-2 border rounded-md p-3">{AUDIENCE_PROFILE_OPTIONS.map((opt) => (<label key={opt} className="flex items-center gap-2 cursor-pointer"><Checkbox checked={(field.value ?? []).includes(opt)} onCheckedChange={(checked) => { const arr = field.value ?? []; field.onChange(checked ? [...arr, opt] : arr.filter((x) => x !== opt)); }} /><span className="text-sm">{opt}</span></label>))}</div><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="service_frequency" rules={{ required: 'Obrigatório' }} render={({ field }) => (<FormItem><FormLabel>Periodicidade do atendimento *</FormLabel><FormControl><Select value={field.value ?? ''} onValueChange={field.onChange}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{SERVICE_FREQUENCY_OPTIONS.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent></Select></FormControl><FormMessage /></FormItem>)} />
                  </TabsContent>
                  <TabsContent value="controle" className="mt-0 space-y-4">
                    <FormField control={form.control} name="registration_status" render={({ field }) => (<FormItem><FormLabel>Situação do cadastro *</FormLabel><FormControl><Select value={field.value ?? 'Ativo'} onValueChange={field.onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{REGISTRATION_STATUS_OPTIONS.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent></Select></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="technical_notes" render={({ field }) => (<FormItem><FormLabel>Observações técnicas</FormLabel><FormControl><Textarea {...field} rows={3} placeholder="Notas internas" /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="terms_accepted" render={({ field }) => (<FormItem className="flex flex-row items-start gap-2"><FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Termo de compromisso aceito *</FormLabel><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="norms_accepted" render={({ field }) => (<FormItem className="flex flex-row items-start gap-2"><FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Normas do Banco de Alimentos aceitas *</FormLabel><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="technical_visit_done" render={({ field }) => (<FormItem className="flex flex-row items-start gap-2"><FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Visita técnica realizada</FormLabel><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="legal_acceptance" render={({ field }) => (<FormItem className="flex flex-row items-start gap-2"><FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Aceite eletrônico do responsável legal *</FormLabel><FormMessage /></FormItem>)} />
                  </TabsContent>
                </div>
              </Tabs>
              <DialogFooter className="shrink-0 border-t pt-4 mt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? 'Salvando...' : 'Salvar'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Editar Instituição Beneficiada</DialogTitle>
            <DialogDescription>Atualize os dados da ficha cadastral.</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdate)} className="flex flex-col flex-1 min-h-0">
              <Tabs defaultValue="identificacao" className="flex-1 overflow-hidden flex flex-col min-h-0">
                <TabsList className="grid grid-cols-4 lg:grid-cols-7 w-full shrink-0">
                  <TabsTrigger value="identificacao" className="text-xs">Identificação</TabsTrigger>
                  <TabsTrigger value="endereco" className="text-xs">Endereço</TabsTrigger>
                  <TabsTrigger value="contatos" className="text-xs">Contatos</TabsTrigger>
                  <TabsTrigger value="responsavel" className="text-xs">Responsável</TabsTrigger>
                  <TabsTrigger value="documentacao" className="text-xs">Documentação</TabsTrigger>
                  <TabsTrigger value="publico" className="text-xs">Público</TabsTrigger>
                  <TabsTrigger value="controle" className="text-xs">Controle</TabsTrigger>
                </TabsList>
                <div className="overflow-y-auto py-4 min-h-0 flex-1">
                  <TabsContent value="identificacao" className="mt-0 space-y-4">
                    <FormField control={editForm.control} name="full_name" rules={{ required: 'Obrigatório' }} render={({ field }) => (<FormItem><FormLabel>Nome completo da associação (razão social) *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={editForm.control} name="trade_name" render={({ field }) => (<FormItem><FormLabel>Nome fantasia</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={editForm.control} name="cnpj" rules={{ required: 'CNPJ obrigatório' }} render={({ field }) => (<FormItem><FormLabel>CNPJ *</FormLabel><FormControl><Input {...field} placeholder="00.000.000/0000-00" maxLength={18} onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); const fmt = v.length <= 12 ? v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})?/, (_, a, b, c, d) => d ? `${a}.${b}.${c}/${d}` : `${a}.${b}.${c}`) : v.slice(0, 14).replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5'); field.onChange(fmt); }} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={editForm.control} name="foundation_date" render={({ field }) => (<FormItem><FormLabel>Data de fundação *</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value || null)} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={editForm.control} name="legal_nature" rules={{ required: 'Obrigatório' }} render={({ field }) => (<FormItem><FormLabel>Natureza jurídica *</FormLabel><FormControl><Select value={field.value ?? ''} onValueChange={(v) => { field.onChange(v || null); if (v !== 'Outro') editForm.setValue('legal_nature_other', ''); }}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{LEGAL_NATURE_OPTIONS.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent></Select></FormControl><FormMessage /></FormItem>)} />
                    {editForm.watch('legal_nature') === 'Outro' && <FormField control={editForm.control} name="legal_nature_other" render={({ field }) => (<FormItem><FormLabel>Outra natureza</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />}
                    <FormField control={editForm.control} name="main_activity_areas" render={({ field }) => (<FormItem><FormLabel>Área de atuação principal *</FormLabel><div className="flex flex-wrap gap-2 border rounded-md p-3">{MAIN_ACTIVITY_OPTIONS.map((opt) => (<label key={opt} className="flex items-center gap-2 cursor-pointer"><Checkbox checked={(field.value ?? []).includes(opt)} onCheckedChange={(checked) => { const arr = field.value ?? []; field.onChange(checked ? [...arr, opt] : arr.filter((x) => x !== opt)); }} /><span className="text-sm">{opt}</span></label>))}</div><FormMessage /></FormItem>)} />
                  </TabsContent>
                  <TabsContent value="endereco" className="mt-0 space-y-4">
                    <FormField control={editForm.control} name="street" rules={{ required: 'Obrigatório' }} render={({ field }) => (<FormItem><FormLabel>Logradouro *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <div className="grid grid-cols-2 gap-4"><FormField control={editForm.control} name="address_number" rules={{ required: 'Obrigatório' }} render={({ field }) => (<FormItem><FormLabel>Número *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} /><FormField control={editForm.control} name="address_complement" render={({ field }) => (<FormItem><FormLabel>Complemento</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} /></div>
                    <FormField control={editForm.control} name="neighborhood" rules={{ required: 'Obrigatório' }} render={({ field }) => (<FormItem><FormLabel>Bairro *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <div className="grid grid-cols-3 gap-4"><FormField control={editForm.control} name="city" rules={{ required: 'Obrigatório' }} render={({ field }) => (<FormItem><FormLabel>Cidade *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} /><FormField control={editForm.control} name="state" rules={{ required: 'Obrigatório' }} render={({ field }) => (<FormItem><FormLabel>Estado (UF) *</FormLabel><FormControl><Select value={field.value ?? ''} onValueChange={field.onChange}><SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger><SelectContent>{UF_OPTIONS.map((uf) => (<SelectItem key={uf} value={uf}>{uf}</SelectItem>))}</SelectContent></Select></FormControl><FormMessage /></FormItem>)} /><FormField control={editForm.control} name="zip_code" rules={{ required: 'CEP obrigatório' }} render={({ field }) => (<FormItem><FormLabel>CEP *</FormLabel><FormControl><Input {...field} placeholder="00000-000" maxLength={9} onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 8); field.onChange(v.length > 5 ? `${v.slice(0, 5)}-${v.slice(5)}` : v); }} /></FormControl><FormMessage /></FormItem>)} /></div>
                    <FormField control={editForm.control} name="reference_point" render={({ field }) => (<FormItem><FormLabel>Ponto de referência</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={editForm.control} name="address" render={({ field }) => (<FormItem><FormLabel>Endereço completo (texto livre)</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>)} />
                  </TabsContent>
                  <TabsContent value="contatos" className="mt-0 space-y-4">
                    <FormField control={editForm.control} name="phone_fixed" render={({ field }) => (<FormItem><FormLabel>Telefone fixo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={editForm.control} name="phone_mobile" rules={{ required: 'Celular/WhatsApp obrigatório' }} render={({ field }) => (<FormItem><FormLabel>Celular / WhatsApp *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={editForm.control} name="email" rules={{ required: 'E-mail institucional obrigatório' }} render={({ field }) => (<FormItem><FormLabel>E-mail institucional *</FormLabel><FormControl><Input {...field} type="email" /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={editForm.control} name="social_media" render={({ field }) => (<FormItem><FormLabel>Redes sociais</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </TabsContent>
                  <TabsContent value="responsavel" className="mt-0 space-y-4">
                    <FormField control={editForm.control} name="responsible_name" rules={{ required: 'Obrigatório' }} render={({ field }) => (<FormItem><FormLabel>Nome completo do responsável legal *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={editForm.control} name="responsible_role" rules={{ required: 'Obrigatório' }} render={({ field }) => (<FormItem><FormLabel>Cargo *</FormLabel><FormControl><Select value={field.value ?? ''} onValueChange={field.onChange}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{RESPONSIBLE_ROLE_OPTIONS.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent></Select></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={editForm.control} name="responsible_cpf" rules={{ required: 'CPF obrigatório' }} render={({ field }) => (<FormItem><FormLabel>CPF *</FormLabel><FormControl><Input {...field} placeholder="000.000.000-00" maxLength={14} onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 11); const fmt = v.length <= 9 ? v.replace(/(\d{3})(\d{3})(\d{3})?/, (_, a, b, c) => c ? `${a}.${b}.${c}` : `${a}.${b}`) : v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'); field.onChange(fmt); }} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={editForm.control} name="responsible_rg" render={({ field }) => (<FormItem><FormLabel>RG</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={editForm.control} name="responsible_phone" rules={{ required: 'Telefone obrigatório' }} render={({ field }) => (<FormItem><FormLabel>Telefone *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={editForm.control} name="responsible_email" rules={{ required: 'E-mail obrigatório' }} render={({ field }) => (<FormItem><FormLabel>E-mail *</FormLabel><FormControl><Input {...field} type="email" /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={editForm.control} name="vice_president_name" render={({ field }) => (<FormItem><FormLabel>Vice-presidente (opcional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={editForm.control} name="treasurer_name" render={({ field }) => (<FormItem><FormLabel>Tesoureiro (opcional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </TabsContent>
                  <TabsContent value="documentacao" className="mt-0 space-y-4">
                    <p className="text-sm text-muted-foreground">Registro da conferência documental. O upload de arquivos não é utilizado nesta configuração.</p>
                    <FormField control={editForm.control} name="document_review_date" render={({ field }) => (<FormItem><FormLabel>Data da conferência documental</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value || null)} /></FormControl><FormMessage /></FormItem>)} />
                  </TabsContent>
                  <TabsContent value="publico" className="mt-0 space-y-4">
                    <FormField control={editForm.control} name="families_served_count" rules={{ required: 'Obrigatório' }} render={({ field }) => (<FormItem><FormLabel>Quantidade de famílias atendidas *</FormLabel><FormControl><Input type="number" min={0} {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={editForm.control} name="people_served_count" rules={{ required: 'Obrigatório' }} render={({ field }) => (<FormItem><FormLabel>Quantidade de pessoas atendidas *</FormLabel><FormControl><Input type="number" min={0} {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={editForm.control} name="audience_profile" render={({ field }) => (<FormItem><FormLabel>Perfil do público</FormLabel><div className="flex flex-wrap gap-2 border rounded-md p-3">{AUDIENCE_PROFILE_OPTIONS.map((opt) => (<label key={opt} className="flex items-center gap-2 cursor-pointer"><Checkbox checked={(field.value ?? []).includes(opt)} onCheckedChange={(checked) => { const arr = field.value ?? []; field.onChange(checked ? [...arr, opt] : arr.filter((x) => x !== opt)); }} /><span className="text-sm">{opt}</span></label>))}</div><FormMessage /></FormItem>)} />
                    <FormField control={editForm.control} name="service_frequency" rules={{ required: 'Obrigatório' }} render={({ field }) => (<FormItem><FormLabel>Periodicidade do atendimento *</FormLabel><FormControl><Select value={field.value ?? ''} onValueChange={field.onChange}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{SERVICE_FREQUENCY_OPTIONS.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent></Select></FormControl><FormMessage /></FormItem>)} />
                  </TabsContent>
                  <TabsContent value="controle" className="mt-0 space-y-4">
                    <FormField control={editForm.control} name="registration_status" render={({ field }) => (<FormItem><FormLabel>Situação do cadastro *</FormLabel><FormControl><Select value={field.value ?? 'Ativo'} onValueChange={field.onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{REGISTRATION_STATUS_OPTIONS.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent></Select></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={editForm.control} name="technical_notes" render={({ field }) => (<FormItem><FormLabel>Observações técnicas</FormLabel><FormControl><Textarea {...field} rows={3} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={editForm.control} name="terms_accepted" render={({ field }) => (<FormItem className="flex flex-row items-start gap-2"><FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Termo de compromisso aceito *</FormLabel><FormMessage /></FormItem>)} />
                    <FormField control={editForm.control} name="norms_accepted" render={({ field }) => (<FormItem className="flex flex-row items-start gap-2"><FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Normas do Banco aceitas *</FormLabel><FormMessage /></FormItem>)} />
                    <FormField control={editForm.control} name="technical_visit_done" render={({ field }) => (<FormItem className="flex flex-row items-start gap-2"><FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Visita técnica realizada</FormLabel><FormMessage /></FormItem>)} />
                    <FormField control={editForm.control} name="legal_acceptance" render={({ field }) => (<FormItem className="flex flex-row items-start gap-2"><FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Aceite eletrônico do responsável legal *</FormLabel><FormMessage /></FormItem>)} />
                  </TabsContent>
                </div>
              </Tabs>
              <DialogFooter className="shrink-0 border-t pt-4 mt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={updateMutation.isPending}>{updateMutation.isPending ? 'Salvando...' : 'Salvar'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BeneficiaryInstitutionsTab;
