
import React, { useState, useMemo } from 'react';
import Header from '@/components/Header';
import InstitutionNavigationButtons from '@/components/InstitutionNavigationButtons';
import ConsentManagement from '@/components/ConsentManagement';
import { Search, Eye, Clock, CheckCircle, XCircle, Loader2, UserPlus, Unlink, Link as LinkIcon, Building, Edit, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { useInstitutionFamilies, useCreateFamily, useDisassociateFamilyFromInstitution, useUpdateFamily } from '@/hooks/useFamilies';
import { useDeliveries } from '@/hooks/useDeliveries';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useConsentManagement } from '@/hooks/useConsentManagement';
import { supabase } from '@/integrations/supabase/client';
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
  
  // Estados para consentimento LGPD
  const [createConsentGiven, setCreateConsentGiven] = useState(false);
  const [createTermSigned, setCreateTermSigned] = useState(false);
  const [editConsentGiven, setEditConsentGiven] = useState(false);
  const [editTermSigned, setEditTermSigned] = useState(false);
  const [institutionName, setInstitutionName] = useState<string>('');
  
  const { profile } = useAuth();
  const { data: familiesData = [], isLoading: familiesLoading, error } = useInstitutionFamilies(profile?.institution_id);
  const { data: deliveriesFromHook = [] } = useDeliveries(profile?.institution_id);
  const createFamilyMutation = useCreateFamily();
  const updateFamilyMutation = useUpdateFamily();
  const disassociateMutation = useDisassociateFamilyFromInstitution();
  const { toast } = useToast();
  const { generateTerm, downloadTerm, isGenerating } = useConsentManagement();
  
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

  // Função para buscar nome da instituição
  const getInstitutionName = async (institutionId: string): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('institutions')
        .select('name')
        .eq('id', institutionId)
        .single();
      
      if (error) {
        console.error('Erro ao buscar nome da instituição:', error);
        return 'Instituição';
      }
      
      return data?.name || 'Instituição';
    } catch (error) {
      console.error('Erro ao buscar nome da instituição:', error);
      return 'Instituição';
    }
  };

  // Função para gerar e imprimir termo de consentimento
  const handlePrintConsentTerm = async (family: Family) => {
    if (!profile?.institution_id) {
      toast({
        title: "Erro",
        description: "Instituição não identificada",
        variant: "destructive"
      });
      return;
    }

    try {
      // Buscar nome da instituição
      const institutionName = await getInstitutionName(profile.institution_id);

      // Gerar termo de consentimento
      const result = await generateTerm({
        familyName: family.name || 'Família',
        familyCpf: family.cpf || undefined,
        contactPerson: family.contact_person || 'Titular',
        phone: family.phone || undefined,
        address: family.address || undefined,
        institutionName: institutionName
      });

      if (result) {
        // Baixar PDF
        downloadTerm(result.blob, family.name || 'Familia', result.termId);
        
        toast({
          title: "Termo Gerado",
          description: "Termo de consentimento gerado e baixado com sucesso!",
        });
      }
    } catch (error) {
      console.error('Erro ao gerar termo de consentimento:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar termo de consentimento. Tente novamente.",
        variant: "destructive"
      });
    }
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
      mother_name: "",
      birth_date: "",
      id_document: "",
      occupation: "",
      work_situation: "",
      children_count: 0,
      has_disability: false,
      address_reference: "",
      registered_in_other_institution: false,
      other_institution_name: "",
      receives_government_aid: false,
      receives_bolsa_familia: false,
      receives_auxilio_gas: false,
      receives_bpc: false,
      receives_other_aid: false,
      other_aid_description: "",
      has_chronic_disease: false,
      chronic_disease_description: "",
      housing_type: "",
      construction_type: "",
      has_water_supply: false,
      has_electricity: false,
      has_garbage_collection: false,
      food_insecurity: false,
      unemployment: false,
      poor_health: false,
      substance_abuse: false,
      other_vulnerabilities: "",
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
      mother_name: "",
      birth_date: "",
      id_document: "",
      occupation: "",
      work_situation: "",
      children_count: 0,
      has_disability: false,
      address_reference: "",
      registered_in_other_institution: false,
      other_institution_name: "",
      receives_government_aid: false,
      receives_bolsa_familia: false,
      receives_auxilio_gas: false,
      receives_bpc: false,
      receives_other_aid: false,
      other_aid_description: "",
      has_chronic_disease: false,
      chronic_disease_description: "",
      housing_type: "",
      construction_type: "",
      has_water_supply: false,
      has_electricity: false,
      has_garbage_collection: false,
      food_insecurity: false,
      unemployment: false,
      poor_health: false,
      substance_abuse: false,
      other_vulnerabilities: "",
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

  const handleEditFamily = async (family: Family) => {
    setSelectedFamily(family);
    // Formatar CPF com máscara para exibição no formulário
    const formattedCpf = family.cpf ? formatCpf(family.cpf) : "";
    // Formatar data de nascimento se existir
    const formattedBirthDate = family.birth_date 
      ? (typeof family.birth_date === 'string' 
          ? family.birth_date.split('T')[0] 
          : new Date(family.birth_date).toISOString().split('T')[0])
      : "";
    editForm.reset({
      name: family.name || "",
      contact_person: family.contact_person || "",
      phone: family.phone || "",
      cpf: formattedCpf,
      address: family.address || "",
      members_count: family.members_count || 1,
      is_blocked: family.is_blocked || false,
      mother_name: family.mother_name || "",
      birth_date: formattedBirthDate,
      id_document: family.id_document || "",
      occupation: family.occupation || "",
      work_situation: family.work_situation || "",
      children_count: family.children_count || 0,
      has_disability: family.has_disability || false,
      address_reference: family.address_reference || "",
      registered_in_other_institution: family.registered_in_other_institution || false,
      other_institution_name: family.other_institution_name || "",
      receives_government_aid: family.receives_government_aid || false,
      receives_bolsa_familia: family.receives_bolsa_familia || false,
      receives_auxilio_gas: family.receives_auxilio_gas || false,
      receives_bpc: family.receives_bpc || false,
      receives_other_aid: family.receives_other_aid || false,
      other_aid_description: family.other_aid_description || "",
      has_chronic_disease: family.has_chronic_disease || false,
      chronic_disease_description: family.chronic_disease_description || "",
      housing_type: family.housing_type || "",
      construction_type: family.construction_type || "",
      has_water_supply: family.has_water_supply || false,
      has_electricity: family.has_electricity || false,
      has_garbage_collection: family.has_garbage_collection || false,
      food_insecurity: family.food_insecurity || false,
      unemployment: family.unemployment || false,
      poor_health: family.poor_health || false,
      substance_abuse: family.substance_abuse || false,
      other_vulnerabilities: family.other_vulnerabilities || "",
    });
    
    // Buscar nome da instituição
    if (profile?.institution_id) {
      const name = await getInstitutionName(profile.institution_id);
      setInstitutionName(name);
    }
    
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
                            onClick={() => handlePrintConsentTerm(family)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                            disabled={isGenerating}
                          >
                            {isGenerating ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <FileText className="h-4 w-4 mr-1" />
                            )}
                            Termo LGPD
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
        <DialogContent className="sm:max-w-[600px] h-[90vh] max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
            <DialogTitle>Detalhes da Família: {selectedFamily?.name}</DialogTitle>
          </DialogHeader>
          
          {selectedFamily && (
            <div className="px-6 space-y-4 overflow-y-auto flex-1 min-h-0 pb-4">
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
              
              {selectedFamily.address_reference && (
                <div>
                  <p className="text-sm text-gray-600">Ponto de Referência</p>
                  <p className="font-medium">{selectedFamily.address_reference}</p>
                </div>
              )}

              {/* Dados Adicionais do Responsável */}
              {(selectedFamily.mother_name || selectedFamily.birth_date || selectedFamily.id_document || selectedFamily.occupation || selectedFamily.work_situation) && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Dados Adicionais do Responsável</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedFamily.mother_name && (
                      <div>
                        <p className="text-sm text-gray-600">Nome da Mãe</p>
                        <p className="font-medium">{selectedFamily.mother_name}</p>
                      </div>
                    )}
                    {selectedFamily.birth_date && (
                      <div>
                        <p className="text-sm text-gray-600">Data de Nascimento</p>
                        <p className="font-medium">{new Date(selectedFamily.birth_date).toLocaleDateString('pt-BR')}</p>
                      </div>
                    )}
                    {selectedFamily.id_document && (
                      <div>
                        <p className="text-sm text-gray-600">ID / RG</p>
                        <p className="font-medium">{selectedFamily.id_document}</p>
                      </div>
                    )}
                    {selectedFamily.occupation && (
                      <div>
                        <p className="text-sm text-gray-600">Profissão/Ocupação</p>
                        <p className="font-medium">{selectedFamily.occupation}</p>
                      </div>
                    )}
                    {selectedFamily.work_situation && (
                      <div>
                        <p className="text-sm text-gray-600">Situação de Trabalho</p>
                        <p className="font-medium">{selectedFamily.work_situation}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Composição Familiar */}
              <div className="pt-4 border-t">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Composição Familiar</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Número de Membros</p>
                    <p className="font-medium">{selectedFamily.members_count || 'N/A'}</p>
                  </div>
                  {selectedFamily.children_count !== undefined && selectedFamily.children_count !== null && (
                    <div>
                      <p className="text-sm text-gray-600">Quantos Filhos</p>
                      <p className="font-medium">{selectedFamily.children_count}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Possui Deficiência na Família</p>
                    <p className="font-medium">{selectedFamily.has_disability ? "Sim" : "Não"}</p>
                  </div>
                </div>
              </div>
              
              {/* Situação Social */}
              {(selectedFamily.registered_in_other_institution || selectedFamily.receives_government_aid || selectedFamily.has_chronic_disease) && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Situação Social</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedFamily.registered_in_other_institution && (
                      <div>
                        <p className="text-sm text-gray-600">Cadastro em outra instituição</p>
                        <p className="font-medium">{selectedFamily.other_institution_name || "Sim"}</p>
                      </div>
                    )}
                    {selectedFamily.receives_government_aid && (
                      <div>
                        <p className="text-sm text-gray-600">Auxílios do governo</p>
                        <div className="space-y-1">
                          {selectedFamily.receives_bolsa_familia && <p className="text-sm">• Bolsa Família</p>}
                          {selectedFamily.receives_auxilio_gas && <p className="text-sm">• Auxílio Gás</p>}
                          {selectedFamily.receives_bpc && <p className="text-sm">• BPC</p>}
                          {selectedFamily.receives_other_aid && (
                            <p className="text-sm">• Outros: {selectedFamily.other_aid_description || "Sim"}</p>
                          )}
                        </div>
                      </div>
                    )}
                    {selectedFamily.has_chronic_disease && (
                      <div>
                        <p className="text-sm text-gray-600">Deficiência/Doença crônica</p>
                        <p className="font-medium">{selectedFamily.chronic_disease_description || "Sim"}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Condições de Moradia */}
              {(selectedFamily.housing_type || selectedFamily.construction_type || selectedFamily.has_water_supply || selectedFamily.has_electricity || selectedFamily.has_garbage_collection) && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Condições de Moradia</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedFamily.housing_type && (
                      <div>
                        <p className="text-sm text-gray-600">Tipo de Moradia</p>
                        <p className="font-medium">{selectedFamily.housing_type}</p>
                      </div>
                    )}
                    {selectedFamily.construction_type && (
                      <div>
                        <p className="text-sm text-gray-600">Tipo de Construção</p>
                        <p className="font-medium">{selectedFamily.construction_type}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Serviços Públicos</p>
                      <div className="space-y-1">
                        <p className="text-sm">{selectedFamily.has_water_supply ? "✓" : "✗"} Água</p>
                        <p className="text-sm">{selectedFamily.has_electricity ? "✓" : "✗"} Energia</p>
                        <p className="text-sm">{selectedFamily.has_garbage_collection ? "✓" : "✗"} Coleta de lixo</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Vulnerabilidades */}
              {(selectedFamily.food_insecurity || selectedFamily.unemployment || selectedFamily.poor_health || selectedFamily.substance_abuse || selectedFamily.other_vulnerabilities) && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Vulnerabilidades Identificadas</h4>
                  <div className="space-y-2">
                    {selectedFamily.food_insecurity && <p className="text-sm">• Insegurança alimentar</p>}
                    {selectedFamily.unemployment && <p className="text-sm">• Desemprego</p>}
                    {selectedFamily.poor_health && <p className="text-sm">• Saúde precária</p>}
                    {selectedFamily.substance_abuse && <p className="text-sm">• Dependência química</p>}
                    {selectedFamily.other_vulnerabilities && (
                      <div>
                        <p className="text-sm text-gray-600">Outras:</p>
                        <p className="text-sm">{selectedFamily.other_vulnerabilities}</p>
                      </div>
                    )}
                  </div>
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
        <DialogContent className="sm:max-w-[700px] h-[95vh] max-h-[95vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
            <DialogTitle>Cadastrar Nova Família</DialogTitle>
          </DialogHeader>
          
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onSubmitCreate)} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="px-6 space-y-6 overflow-y-auto flex-1 min-h-0 pb-4">
                {/* Seção 1: Dados da Família */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Dados da Família</h3>
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
                      rules={{ required: "Telefone é obrigatório" }}
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
                      name="address_reference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ponto de Referência (opcional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: Próximo ao mercado, em frente à escola..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>

                {/* Seção 2: Dados do Responsável */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Dados do Responsável</h3>
                  <FormField
                    control={createForm.control}
                    name="mother_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Mãe (opcional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nome completo da mãe" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name="birth_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Nascimento (opcional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              value={field.value ? (typeof field.value === 'string' ? field.value.split('T')[0] : new Date(field.value).toISOString().split('T')[0]) : ""}
                              max={new Date().toISOString().split('T')[0]}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name="id_document"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ID / RG (opcional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Número do documento de identidade" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name="occupation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profissão/Ocupação (opcional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: Pedreiro, Vendedor, etc." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name="work_situation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Situação de Trabalho (opcional)</FormLabel>
                          <Select value={field.value || ""} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a situação" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Empregado">Empregado</SelectItem>
                              <SelectItem value="Desempregado">Desempregado</SelectItem>
                              <SelectItem value="Autônomo">Autônomo</SelectItem>
                              <SelectItem value="Aposentado">Aposentado</SelectItem>
                              <SelectItem value="Outros">Outros</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>

                {/* Seção 3: Composição Familiar */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Composição Familiar</h3>
                  <FormField
                    control={createForm.control}
                    name="children_count"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantos Filhos (opcional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              value={field.value || 0}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} 
                              min="0"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name="has_disability"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Possui deficiência na família
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                </div>

                {/* Seção 4: Situação Social */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Situação Social</h3>
                  <FormField
                    control={createForm.control}
                    name="registered_in_other_institution"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Possui cadastro em outra instituição?
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    {createForm.watch('registered_in_other_institution') && (
                      <FormField
                        control={createForm.control}
                        name="other_institution_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Instituição (opcional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nome da instituição onde também está cadastrada" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                      )}
                    />
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="receives_government_aid"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Recebe algum auxílio do governo?
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  {createForm.watch('receives_government_aid') && (
                    <div className="space-y-3 pl-4 border-l-2">
                      <FormField
                        control={createForm.control}
                        name="receives_bolsa_familia"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Bolsa Família</FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={createForm.control}
                        name="receives_auxilio_gas"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Auxílio Gás</FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={createForm.control}
                        name="receives_bpc"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">BPC</FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={createForm.control}
                        name="receives_other_aid"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Outros</FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      {createForm.watch('receives_other_aid') && (
                        <FormField
                          control={createForm.control}
                          name="other_aid_description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descrição de outros auxílios (opcional)</FormLabel>
                              <FormControl>
                                <Textarea {...field} placeholder="Descreva outros auxílios recebidos" rows={2} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  )}
                  
                  <FormField
                    control={createForm.control}
                    name="has_chronic_disease"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Possui membro com deficiência ou doença crônica?
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  {createForm.watch('has_chronic_disease') && (
                    <FormField
                      control={createForm.control}
                      name="chronic_disease_description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Qual deficiência/doença? (opcional)</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Descreva a deficiência ou doença crônica" rows={2} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Seção 5: Condições de Moradia */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Condições de Moradia</h3>
                  <FormField
                    control={createForm.control}
                    name="housing_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Moradia (opcional)</FormLabel>
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de moradia" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Própria">Própria</SelectItem>
                          <SelectItem value="Alugada">Alugada</SelectItem>
                          <SelectItem value="Cedida">Cedida</SelectItem>
                          <SelectItem value="Ocupação/Área de risco">Ocupação/Área de risco</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="construction_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Construção (opcional)</FormLabel>
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de construção" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Alvenaria">Alvenaria</SelectItem>
                          <SelectItem value="Madeira">Madeira</SelectItem>
                          <SelectItem value="Mista">Mista</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-3">
                  <FormField
                    control={createForm.control}
                    name="has_water_supply"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">Possui abastecimento de água</FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="has_electricity"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">Possui energia elétrica</FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="has_garbage_collection"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">Possui coleta de lixo</FormLabel>
                      </FormItem>
                    )}
                    />
                  </div>
                </div>

                {/* Seção 6: Vulnerabilidades */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Vulnerabilidades</h3>
                  <div className="space-y-3">
                    <FormField
                      control={createForm.control}
                      name="food_insecurity"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Insegurança alimentar</FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={createForm.control}
                        name="unemployment"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Desemprego</FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={createForm.control}
                        name="poor_health"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Saúde precária</FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={createForm.control}
                        name="substance_abuse"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Dependência química na família</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={createForm.control}
                      name="other_vulnerabilities"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Outras vulnerabilidades (opcional)</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Descreva outras vulnerabilidades identificadas" rows={2} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>

                {/* Seção 7: Instituições */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Instituições</h3>
                  <div className="text-sm text-gray-600">
                    <p>As instituições podem ser associadas após a criação da família.</p>
                  </div>
                </div>

                {/* Seção 8: Consentimento LGPD */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Consentimento LGPD</h3>
                  <ConsentManagement
                    familyName={createForm.watch('name') || ''}
                    familyCpf={createForm.watch('cpf')}
                    contactPerson={createForm.watch('contact_person') || ''}
                    phone={createForm.watch('phone')}
                    address={createForm.watch('address')}
                    institutionName={profile?.institution?.name || 'Instituição'}
                    consentGiven={createConsentGiven}
                    termSigned={createTermSigned}
                    onConsentChange={setCreateConsentGiven}
                    onTermSignedChange={setCreateTermSigned}
                    mode="create"
                  />
                  
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Nota:</strong> A família será automaticamente vinculada à sua instituição após o cadastro.
                    </p>
                  </div>
                </div>
              </div>
              
              <DialogFooter className="px-6 pb-6 pt-4 border-t flex-shrink-0">
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
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          setEditConsentGiven(false);
          setEditTermSigned(false);
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
            <DialogTitle>Editar Família</DialogTitle>
            <DialogDescription>
              Atualize as informações da família. Os campos marcados como opcionais podem ser deixados em branco.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="flex flex-col flex-1 min-h-0">
              <div className="px-6 space-y-4 overflow-y-auto flex-1 min-h-0 pb-4">
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
                  name="address_reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ponto de Referência (opcional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Próximo ao mercado, em frente à escola..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Seção: Dados Adicionais do Responsável */}
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Dados Adicionais do Responsável</h3>
                  
                  <FormField
                    control={editForm.control}
                    name="mother_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Mãe (opcional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nome completo da mãe" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="birth_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Nascimento (opcional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            value={field.value ? (typeof field.value === 'string' ? field.value.split('T')[0] : new Date(field.value).toISOString().split('T')[0]) : ""}
                            max={new Date().toISOString().split('T')[0]}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="id_document"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID / RG (opcional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Número do documento de identidade" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="occupation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profissão/Ocupação (opcional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: Pedreiro, Vendedor, etc." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="work_situation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Situação de Trabalho (opcional)</FormLabel>
                        <Select value={field.value || ""} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a situação" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Empregado">Empregado</SelectItem>
                            <SelectItem value="Desempregado">Desempregado</SelectItem>
                            <SelectItem value="Autônomo">Autônomo</SelectItem>
                            <SelectItem value="Aposentado">Aposentado</SelectItem>
                            <SelectItem value="Outros">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Seção: Composição Familiar */}
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Composição Familiar</h3>
                  
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
                  
                  <FormField
                    control={editForm.control}
                    name="children_count"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantos Filhos (opcional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            value={field.value || 0}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} 
                            min="0"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="has_disability"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Possui deficiência na família
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Seção: Situação Social */}
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Situação Social</h3>
                  
                  <FormField
                    control={editForm.control}
                    name="registered_in_other_institution"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Possui cadastro em outra instituição?
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  {editForm.watch('registered_in_other_institution') && (
                    <FormField
                      control={editForm.control}
                      name="other_institution_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Instituição (opcional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nome da instituição onde também está cadastrada" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={editForm.control}
                    name="receives_government_aid"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Recebe algum auxílio do governo?
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  {editForm.watch('receives_government_aid') && (
                    <div className="space-y-3 pl-4 border-l-2">
                      <FormField
                        control={editForm.control}
                        name="receives_bolsa_familia"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Bolsa Família</FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="receives_auxilio_gas"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Auxílio Gás</FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="receives_bpc"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">BPC</FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="receives_other_aid"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Outros</FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      {editForm.watch('receives_other_aid') && (
                        <FormField
                          control={editForm.control}
                          name="other_aid_description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descrição de outros auxílios (opcional)</FormLabel>
                              <FormControl>
                                <Textarea {...field} placeholder="Descreva outros auxílios recebidos" rows={2} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  )}
                  
                  <FormField
                    control={editForm.control}
                    name="has_chronic_disease"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Possui membro com deficiência ou doença crônica?
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  {editForm.watch('has_chronic_disease') && (
                    <FormField
                      control={editForm.control}
                      name="chronic_disease_description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Qual deficiência/doença? (opcional)</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Descreva a deficiência ou doença crônica" rows={2} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Seção: Condições de Moradia */}
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Condições de Moradia</h3>
                  
                  <FormField
                    control={editForm.control}
                    name="housing_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Moradia (opcional)</FormLabel>
                        <Select value={field.value || ""} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo de moradia" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Própria">Própria</SelectItem>
                            <SelectItem value="Alugada">Alugada</SelectItem>
                            <SelectItem value="Cedida">Cedida</SelectItem>
                            <SelectItem value="Ocupação/Área de risco">Ocupação/Área de risco</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="construction_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Construção (opcional)</FormLabel>
                        <Select value={field.value || ""} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo de construção" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Alvenaria">Alvenaria</SelectItem>
                            <SelectItem value="Madeira">Madeira</SelectItem>
                            <SelectItem value="Mista">Mista</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-3">
                    <FormField
                      control={editForm.control}
                      name="has_water_supply"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">Possui abastecimento de água</FormLabel>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editForm.control}
                      name="has_electricity"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">Possui energia elétrica</FormLabel>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editForm.control}
                      name="has_garbage_collection"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">Possui coleta de lixo</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Seção: Vulnerabilidades */}
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Necessidades e Vulnerabilidades Identificadas</h3>
                  
                  <div className="space-y-3">
                    <FormField
                      control={editForm.control}
                      name="food_insecurity"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">Insegurança alimentar</FormLabel>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editForm.control}
                      name="unemployment"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">Desemprego</FormLabel>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editForm.control}
                      name="poor_health"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">Saúde precária</FormLabel>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editForm.control}
                      name="substance_abuse"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">Dependência química na família</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={editForm.control}
                    name="other_vulnerabilities"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Outras vulnerabilidades (opcional)</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Descreva outras vulnerabilidades identificadas" rows={2} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <ConsentManagement
                  familyName={editForm.watch('name') || ''}
                  familyCpf={editForm.watch('cpf')}
                  contactPerson={editForm.watch('contact_person') || ''}
                  phone={editForm.watch('phone')}
                  address={editForm.watch('address')}
                  institutionName={institutionName || 'Instituição'}
                  consentGiven={editConsentGiven}
                  termSigned={editTermSigned}
                  onConsentChange={setEditConsentGiven}
                  onTermSignedChange={setEditTermSigned}
                  familyId={selectedFamily?.id}
                  mode="edit"
                />
              </div>
              
              <DialogFooter className="px-6 pb-6 pt-4 border-t flex-shrink-0">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditConsentGiven(false);
                    setEditTermSigned(false);
                  }}
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
