
import React, { useState, useMemo } from 'react';
import Header from '@/components/Header';
import InstitutionNavigationButtons from '@/components/InstitutionNavigationButtons';
import { Search, Eye, Clock, CheckCircle, XCircle, Loader2, UserPlus, Unlink, Link as LinkIcon, Building, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { useInstitutionFamilies, useCreateFamily, useDisassociateFamilyFromInstitution, useUpdateFamily } from '@/hooks/useFamilies';
import { useDeliveries } from '@/hooks/useDeliveries';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import SearchFamilyByCpf from '@/components/SearchFamilyByCpf';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';
import { formatDateTimeBrasilia, formatDateBrasilia } from '@/utils/dateFormat';

type Family = Tables<'families'> & {
  blocked_by_institution?: { name?: string } | null;
  institution_families?: Array<{ institution_id: string }>;
  lastDelivery?: {
    delivery_date: string;
    institution?: { id?: string; name?: string } | null;
  };
  family_name?: string;
  main_cpf?: string;
  address?: string;
  last_delivery_date?: string;
  last_delivery_institution?: string;
};

const InstitutionFamilies = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUnlinkDialogOpen, setIsUnlinkDialogOpen] = useState(false);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [familyToUnlink, setFamilyToUnlink] = useState<Family | null>(null);
  const [prefilledCpf, setPrefilledCpf] = useState<string | undefined>(undefined);
  
  const { profile } = useAuth();
  const { data: familiesData = [], isLoading: familiesLoading, error } = useInstitutionFamilies(profile?.institution_id);
  const { data: deliveriesFromHook = [] } = useDeliveries(profile?.institution_id);
  const createFamilyMutation = useCreateFamily();
  const updateFamilyMutation = useUpdateFamily();
  const disassociateMutation = useDisassociateFamilyFromInstitution();
  const { toast } = useToast();
  
  // Usar deliveries das famílias (que já vêm da query) como fonte primária
  // Essas deliveries já incluem TODAS as entregas (de qualquer instituição) para cada família
  const allDeliveries = useMemo(() => {
    const deliveriesFromFamilies: any[] = [];
    familiesData.forEach((family: any) => {
      if (family.deliveries && Array.isArray(family.deliveries)) {
        family.deliveries.forEach((delivery: any) => {
          // Adicionar family_id se não estiver presente
          if (!delivery.family_id) {
            delivery.family_id = family.id;
          }
          deliveriesFromFamilies.push(delivery);
        });
      }
    });
    
    // Usar apenas deliveries das famílias (que já incluem todas as entregas globais)
    // Não precisamos filtrar por institution_id aqui - queremos mostrar a última entrega GLOBAL
    // O hook useDeliveries filtra por institution_id, então não vamos usá-lo para a última entrega global
    
    if (import.meta.env.DEV) {
      console.log('[InstitutionFamilies] All deliveries from families (global):', {
        total: deliveriesFromFamilies.length,
        byInstitution: deliveriesFromFamilies.reduce((acc, d) => {
          const instId = d.institution_id || 'unknown';
          acc[instId] = (acc[instId] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      });
    }
    
    return deliveriesFromFamilies;
  }, [familiesData]);

  // Função para formatar CPF
  const formatCpf = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  // Form for creating new family
  const createForm = useForm<TablesInsert<'families'>>({
    defaultValues: {
      name: "",
      contact_person: "",
      phone: "",
      cpf: "",
      address: "",
      members_count: 1,
      is_blocked: false,
    }
  });

  // Form for editing family
  const editForm = useForm<TablesInsert<'families'>>({
    defaultValues: {
      name: "",
      contact_person: "",
      phone: "",
      cpf: "",
      address: "",
      members_count: 1,
      is_blocked: false,
    }
  });

  // Map families data and enrich with last delivery info
  const families = useMemo(() => {
    if (import.meta.env.DEV) {
      console.log('[InstitutionFamilies] Mapping families:', {
        familiesCount: familiesData.length,
        deliveriesCount: allDeliveries.length,
        institutionId: profile?.institution_id,
        deliveries: allDeliveries.map(d => ({ id: d.id, family_id: d.family_id, institution_id: d.institution_id }))
      });
    }
    
    if (!allDeliveries || allDeliveries.length === 0) {
      // Se não há entregas, retornar famílias sem última entrega
      return familiesData.map((family) => ({
        id: family.id,
        family_name: family.name || family.contact_person || 'N/A',
        main_cpf: family.cpf || '',
        address: family.address || 'Não informado',
        members_count: family.members_count || 0,
        is_blocked: family.is_blocked || false,
        blocked_until: family.blocked_until || undefined,
        block_reason: family.block_reason || undefined,
        blocked_by_institution: (family.blocked_by_institution as { name?: string } | null | undefined)?.name || undefined,
        last_delivery_date: undefined,
        last_delivery_institution: undefined,
        name: family.name,
        contact_person: family.contact_person,
        phone: family.phone,
        cpf: family.cpf,
        ...family
      }));
    }

    return familiesData.map((family) => {
      // Find last delivery for this family GLOBALLY (de qualquer instituição)
      // Similar ao comportamento do admin - mostrar última entrega global
      const familyDeliveries = allDeliveries
        .filter((d) => {
          // Verificar se a entrega é para esta família
          // Comparar IDs como strings para evitar problemas de tipo
          const deliveryFamilyId = String(d.family_id || '');
          const familyId = String(family.id || '');
          const matchesFamily = deliveryFamilyId === familyId;
          
          if (import.meta.env.DEV && matchesFamily) {
            // A estrutura dos dados pode variar - verificar diferentes possibilidades
            const deliveryId = d.id || (d as any).delivery_id;
            const deliveryInstitutionId = d.institution_id || (d as any).institution_id;
            const institutionName = d.institution?.name || (d as any).institution_name || 'N/A';
            
            console.log(`[InstitutionFamilies] Found delivery for family ${family.name} (${family.id}):`, {
              delivery_id: deliveryId,
              family_id: d.family_id || family.id,
              institution_id: deliveryInstitutionId,
              institution_name: institutionName,
              delivery_date: d.delivery_date,
              is_from_current_institution: String(deliveryInstitutionId || '') === String(profile?.institution_id || ''),
              raw_delivery: d
            });
          }
          
          // Não filtrar por institution_id - queremos mostrar a última entrega GLOBAL
          return matchesFamily;
        })
        .sort((a, b) => {
          const dateA = a.delivery_date ? new Date(a.delivery_date).getTime() : 0;
          const dateB = b.delivery_date ? new Date(b.delivery_date).getTime() : 0;
          return dateB - dateA; // Mais recente primeiro
        });
      
      const lastDelivery = familyDeliveries[0];
      
      const blockedByInstitution = family.blocked_by_institution as { name?: string } | null | undefined;
      
      // Get institution name from the delivery's institution relation
      // Se foi a própria instituição, mostrar "Esta instituição", senão mostrar o nome da instituição
      const lastDeliveryInstitutionName = lastDelivery?.institution 
        ? (lastDelivery.institution as { id?: string; name?: string } | null | undefined)?.name
        : undefined;
      
      // Verificar se a entrega foi feita pela própria instituição
      const isFromCurrentInstitution = lastDelivery && 
        String(lastDelivery.institution_id || '') === String(profile?.institution_id || '');
      
      const lastDeliveryInstitution = lastDeliveryInstitutionName 
        ? (isFromCurrentInstitution ? 'Esta instituição' : lastDeliveryInstitutionName)
        : (lastDelivery ? 'Instituição não identificada' : undefined);
      
      if (import.meta.env.DEV && lastDelivery && !lastDelivery.institution) {
        console.warn(`[InstitutionFamilies] Delivery ${lastDelivery.id} for family ${family.id} missing institution relation`);
      }
      
      return {
        id: family.id,
        family_name: family.name || family.contact_person || 'N/A',
        main_cpf: family.cpf || '',
        address: family.address || 'Não informado',
        members_count: family.members_count || 0,
        is_blocked: family.is_blocked || false,
        blocked_until: family.blocked_until || undefined,
        block_reason: family.block_reason || undefined,
        blocked_by_institution: blockedByInstitution?.name || undefined,
        last_delivery_date: lastDelivery?.delivery_date || undefined,
        last_delivery_institution: lastDeliveryInstitution || undefined,
        name: family.name,
        contact_person: family.contact_person,
        phone: family.phone,
        cpf: family.cpf,
        ...family
      };
    });
  }, [familiesData, allDeliveries, profile?.institution_id]);

  const filteredFamilies = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    const searchNumbers = searchTerm.replace(/\D/g, '');
    return families.filter(family =>
      family.family_name.toLowerCase().includes(searchLower) ||
      (family.main_cpf && family.main_cpf.replace(/\D/g, '').includes(searchNumbers)) ||
      (family.contact_person && family.contact_person.toLowerCase().includes(searchLower))
    );
  }, [families, searchTerm]);

  const getStatusBadge = (family: Family) => {
    if (family.is_blocked) {
      const daysRemaining = family.blocked_until ? 
        Math.ceil((new Date(family.blocked_until).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
      
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Bloqueada ({daysRemaining} dias)
        </Badge>
      );
    }
    
    return (
      <Badge variant="default" className="flex items-center gap-1 bg-green-500">
        <CheckCircle className="h-3 w-3" />
        Liberada
      </Badge>
    );
  };

  const handleViewDetails = (family: Family) => {
    setSelectedFamily(family);
    setIsDetailsOpen(true);
  };

  const handleEditFamily = (family: Family) => {
    setSelectedFamily(family);
    editForm.reset({
      name: family.name || "",
      contact_person: family.contact_person || "",
      phone: family.phone || "",
      cpf: family.cpf || "",
      address: family.address || "",
      members_count: family.members_count || 1,
      is_blocked: family.is_blocked || false,
    });
    setIsEditDialogOpen(true);
  };

  const onSubmitEdit = async (data: TablesInsert<'families'>) => {
    if (!selectedFamily) return;

    try {
      // Limpar CPF (remover máscara) antes de salvar
      const familyData = {
        ...data,
        cpf: data.cpf ? (typeof data.cpf === 'string' ? data.cpf.replace(/\D/g, '') : data.cpf) : null
      };
      
      await updateFamilyMutation.mutateAsync({
        id: selectedFamily.id,
        updates: familyData
      });
      setIsEditDialogOpen(false);
      setSelectedFamily(null);
      editForm.reset();
    } catch (error) {
      // Error toast is handled by the mutation
    }
  };

  const handleCreateFamily = (cpf?: string) => {
    createForm.reset();
    if (cpf && typeof cpf === 'string') {
      // CPF vem sem máscara (apenas números) do componente de busca
      createForm.setValue("cpf" as any, cpf.replace(/\D/g, ''));
      setPrefilledCpf(cpf);
    }
    setIsCreateDialogOpen(true);
    setIsSearchDialogOpen(false);
  };

  const handleFamilyFound = (familyId: string, cpf?: string) => {
    if (familyId) {
      // Família foi vinculada com sucesso, fechar dialog
      setIsSearchDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Família vinculada à sua instituição com sucesso!"
      });
    } else {
      // Família não encontrada, abrir formulário de cadastro com CPF preenchido
      handleCreateFamily(cpf);
    }
  };

  const onSubmitCreate = async (data: TablesInsert<'families'>) => {
    if (!profile?.institution_id) {
      toast({
        title: "Erro",
        description: "Instituição não identificada",
        variant: "destructive"
      });
      return;
    }

    try {
      // Limpar CPF (remover máscara) antes de salvar
      const familyData = {
        ...data,
        cpf: data.cpf ? (typeof data.cpf === 'string' ? data.cpf.replace(/\D/g, '') : data.cpf) : null
      };
      
      await createFamilyMutation.mutateAsync({
        family: familyData,
        institutionId: profile.institution_id
      });
      setIsCreateDialogOpen(false);
      createForm.reset();
    } catch (error) {
      // Error toast is handled by the mutation
    }
  };

  const handleUnlinkClick = (family: Family) => {
    setFamilyToUnlink(family);
    setIsUnlinkDialogOpen(true);
  };

  const handleConfirmUnlink = async () => {
    if (!familyToUnlink || !profile?.institution_id) return;

    try {
      await disassociateMutation.mutateAsync({
        familyId: familyToUnlink.id,
        institutionId: profile.institution_id
      });
      setIsUnlinkDialogOpen(false);
      setFamilyToUnlink(null);
    } catch (error) {
      // Error toast is handled by the mutation
    }
  };

  if (familiesLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <InstitutionNavigationButtons />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <InstitutionNavigationButtons />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-red-600">Erro ao carregar famílias: {error.message}</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <InstitutionNavigationButtons />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Famílias Cadastradas
              </h2>
              <p className="text-gray-600">
                Visualize o status das famílias e histórico de entregas
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => setIsSearchDialogOpen(true)}
              >
                <LinkIcon className="mr-2 h-4 w-4" /> Adicionar Família Existente
              </Button>
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={handleCreateFamily}
              >
                <UserPlus className="mr-2 h-4 w-4" /> Cadastrar Nova Família
              </Button>
            </div>
          </div>

          {/* Barra de pesquisa */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome da família ou CPF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total de Famílias</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{families.length}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Famílias Liberadas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">
                  {families.filter(f => !f.is_blocked).length}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Famílias Bloqueadas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-red-600">
                  {families.filter(f => f.is_blocked).length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de famílias */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Famílias</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome da Família</TableHead>
                    <TableHead>CPF Principal</TableHead>
                    <TableHead>Membros</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Última Entrega</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFamilies.map((family) => (
                    <TableRow key={family.id}>
                      <TableCell className="font-medium">{family.name}</TableCell>
                      <TableCell>{family.contact_person}</TableCell>
                      <TableCell>{family.members_count || 'N/A'}</TableCell>
                      <TableCell>{getStatusBadge(family)}</TableCell>
                      <TableCell>
                        {family.last_delivery_date ? (
                          <span className="text-sm">{formatDateBrasilia(family.last_delivery_date)}</span>
                        ) : (
                          <span className="text-gray-500">Nunca</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewDetails(family)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Detalhes
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditFamily(family)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleUnlinkClick(family)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            disabled={disassociateMutation.isPending}
                          >
                            {disassociateMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Unlink className="h-4 w-4 mr-1" />
                                Desvincular
                              </>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredFamilies.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhuma família encontrada</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Dialog de detalhes */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>Detalhes da Família: {selectedFamily?.name}</DialogTitle>
          </DialogHeader>
          
          {selectedFamily && (
            <div className="px-6 space-y-4 overflow-y-auto flex-1 min-h-0">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nome da Família</p>
                  <p className="font-medium">{selectedFamily.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pessoa de Contato</p>
                  <p className="font-medium">{selectedFamily.contact_person}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Telefone</p>
                  <p className="font-medium">{selectedFamily.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">CPF</p>
                  <p className="font-medium">{selectedFamily.cpf ? formatCpf(selectedFamily.cpf) : 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Número de Membros</p>
                  <p className="font-medium">{selectedFamily.members_count || 'N/A'}</p>
                </div>
              </div>
              
              {selectedFamily.address && (
                <div>
                  <p className="text-sm text-gray-600">Endereço</p>
                  <p className="font-medium">{selectedFamily.address}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-gray-600">Status Atual</p>
                {getStatusBadge(selectedFamily)}
              </div>
              
              {selectedFamily.is_blocked && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">Informações do Bloqueio</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Motivo:</strong> {selectedFamily.block_reason || 'N/A'}</p>
                    <p><strong>Bloqueada até:</strong> {selectedFamily.blocked_until ? new Date(selectedFamily.blocked_until).toLocaleDateString('pt-BR') : 'N/A'}</p>
                  </div>
                </div>
              )}
              
              {/* Instituições Vinculadas */}
              {selectedFamily.institution_families && selectedFamily.institution_families.length > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">Instituições Vinculadas</h4>
                  <div className="space-y-2 text-sm">
                    {selectedFamily.institution_families.map((assoc: any, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-500" />
                        <span>{assoc.institution?.name || 'Instituição não encontrada'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Última Entrega Global */}
              {selectedFamily.deliveries && selectedFamily.deliveries.length > 0 && (() => {
                // Ordenar entregas por data (mais recente primeiro)
                const sortedDeliveries = [...selectedFamily.deliveries].sort((a: any, b: any) => {
                  const dateA = new Date(a.delivery_date).getTime();
                  const dateB = new Date(b.delivery_date).getTime();
                  return dateB - dateA;
                });
                const lastDelivery = sortedDeliveries[0];
                const lastDeliveryInstitution = lastDelivery.institution?.name || 'Instituição não identificada';
                
                return (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Última Entrega</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Data:</strong> {formatDateBrasilia(lastDelivery.delivery_date)}</p>
                      <p><strong>Instituição:</strong> {lastDeliveryInstitution}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
          
          <DialogFooter className="px-6 pb-6 pt-4 border-t">
            <Button onClick={() => setIsDetailsOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Family Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Cadastrar Nova Família</DialogTitle>
          </DialogHeader>
          
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onSubmitCreate)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="name"
                rules={{ required: "Nome é obrigatório" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Família</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Família Silva" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="contact_person"
                rules={{ required: "Pessoa de contato é obrigatória" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pessoa de Contato</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: João Silva" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF (opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="000.000.000-00"
                        maxLength={14}
                        value={field.value || ""}
                        onChange={(e) => {
                          const formatted = formatCpf(e.target.value);
                          // Salvar apenas números no banco
                          const numbers = formatted.replace(/\D/g, '');
                          field.onChange(numbers.length === 11 ? numbers : formatted);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="(11) 99999-9999" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço (opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Rua, número, bairro, cidade..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="members_count"
                rules={{ 
                  required: "Número de membros é obrigatório",
                  min: { value: 1, message: "Deve ter pelo menos 1 membro" }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Membros</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        value={field.value || 1}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)} 
                        min="1"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> A família será automaticamente vinculada à sua instituição após o cadastro.
                </p>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={createFamilyMutation.isPending || !profile?.institution_id}
                >
                  {createFamilyMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cadastrando...
                    </>
                  ) : (
                    "Cadastrar Família"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Search Family Dialog */}
      <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Adicionar Família Existente</DialogTitle>
          </DialogHeader>
          
          <SearchFamilyByCpf
            onFamilyFound={handleFamilyFound}
            onClose={() => setIsSearchDialogOpen(false)}
          />
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsSearchDialogOpen(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Family Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Família</DialogTitle>
            <DialogDescription>
              Atualize as informações da família. Os campos marcados como opcionais podem ser deixados em branco.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Família</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Família Silva" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="contact_person"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pessoa de Contato (Titular da Família)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: João Silva" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF (opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="000.000.000-00"
                        maxLength={14}
                        value={field.value || ""}
                        onChange={(e) => {
                          const formatted = formatCpf(e.target.value);
                          // Salvar apenas números no banco
                          const numbers = formatted.replace(/\D/g, '');
                          field.onChange(numbers.length === 11 ? numbers : formatted);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="(11) 99999-9999" />
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
                    <FormLabel>Endereço (opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Rua, número, bairro, cidade..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="members_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Membros</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        value={field.value || 1}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)} 
                        min="1"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={updateFamilyMutation.isPending}
                >
                  {updateFamilyMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Alterações"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Unlink Confirmation Dialog */}
      <Dialog open={isUnlinkDialogOpen} onOpenChange={setIsUnlinkDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar Desvinculação</DialogTitle>
          </DialogHeader>
          
          {familyToUnlink && (
            <div className="py-4">
              <p className="text-sm text-gray-600 mb-2">
                Tem certeza que deseja desvincular a família <strong>{familyToUnlink.name || familyToUnlink.contact_person || 'N/A'}</strong> da sua instituição?
              </p>
              <p className="text-sm text-gray-500">
                Após desvincular, você não poderá mais registrar entregas para esta família até que ela seja vinculada novamente.
              </p>
              <p className="text-sm text-red-600 mt-2 font-medium">
                Esta ação não pode ser desfeita.
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsUnlinkDialogOpen(false);
                setFamilyToUnlink(null);
              }}
              disabled={disassociateMutation.isPending}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleConfirmUnlink}
              disabled={disassociateMutation.isPending}
            >
              {disassociateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Desvinculando...
                </>
              ) : (
                "Confirmar Desvinculação"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InstitutionFamilies;
