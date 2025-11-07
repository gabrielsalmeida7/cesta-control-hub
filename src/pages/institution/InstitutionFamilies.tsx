
import React, { useState, useMemo } from 'react';
import Header from '@/components/Header';
import InstitutionNavigationButtons from '@/components/InstitutionNavigationButtons';
import { Search, Eye, Clock, CheckCircle, XCircle, Loader2, UserPlus, Unlink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/hooks/useAuth';
import { useInstitutionFamilies, useCreateFamily, useDisassociateFamilyFromInstitution } from '@/hooks/useFamilies';
import { useDeliveries } from '@/hooks/useDeliveries';
import type { TablesInsert } from '@/integrations/supabase/types';

interface Family {
  id: string;
  family_name: string;
  main_cpf: string;
  address: string;
  members_count: number;
  is_blocked: boolean;
  blocked_until?: string;
  block_reason?: string;
  blocked_by_institution?: string;
  last_delivery_date?: string;
  last_delivery_institution?: string;
}

const InstitutionFamilies = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUnlinkDialogOpen, setIsUnlinkDialogOpen] = useState(false);
  const [familyToUnlink, setFamilyToUnlink] = useState<Family | null>(null);
  
  const { profile } = useAuth();
  const { data: familiesData = [], isLoading: familiesLoading } = useInstitutionFamilies(profile?.institution_id);
  const { data: deliveries = [] } = useDeliveries(profile?.institution_id);
  const createFamilyMutation = useCreateFamily();
  const disassociateMutation = useDisassociateFamilyFromInstitution();

  // Form for creating new family
  const createForm = useForm<TablesInsert<'families'>>({
    defaultValues: {
      name: "",
      contact_person: "",
      phone: "",
      members_count: 1,
      is_blocked: false,
    }
  });

  // Map families data and enrich with last delivery info
  const families = useMemo(() => {
    return familiesData.map((family) => {
      // Find last delivery for this family from THIS institution only
      // useDeliveries already filters by institution_id, but let's ensure we're using the right data
      const familyDeliveries = deliveries
        .filter((d) => {
          // Ensure delivery is for this family AND from this institution
          return d.family_id === family.id && 
                 d.institution_id === profile?.institution_id &&
                 d.institution?.id === profile?.institution_id;
        })
        .sort((a, b) => {
          const dateA = a.delivery_date ? new Date(a.delivery_date).getTime() : 0;
          const dateB = b.delivery_date ? new Date(b.delivery_date).getTime() : 0;
          return dateB - dateA;
        });
      
      const lastDelivery = familyDeliveries[0];
      
      const blockedByInstitution = family.blocked_by_institution as { name?: string } | null | undefined;
      
      // Get institution name from the delivery's institution relation
      // This should always be the current institution since we filtered above
      const lastDeliveryInstitution = lastDelivery?.institution as { id?: string; name?: string } | null | undefined;
      
      return {
        id: family.id,
        family_name: family.name || family.contact_person || 'N/A',
        main_cpf: '', // CPF não está no schema atual
        address: 'Não informado', // Address não está no schema atual de families
        members_count: family.members_count || 0,
        is_blocked: family.is_blocked || false,
        blocked_until: family.blocked_until || undefined,
        block_reason: family.block_reason || undefined,
        blocked_by_institution: blockedByInstitution?.name || undefined,
        last_delivery_date: lastDelivery?.delivery_date || undefined,
        last_delivery_institution: lastDeliveryInstitution?.name || undefined
      };
    });
  }, [familiesData, deliveries, profile?.institution_id]);

  const filteredFamilies = useMemo(() => {
    return families.filter(family =>
      family.family_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (family.main_cpf && family.main_cpf.includes(searchTerm))
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

  const handleCreateFamily = () => {
    createForm.reset();
    setIsCreateDialogOpen(true);
  };

  const onSubmitCreate = (data: TablesInsert<'families'>) => {
    if (!profile?.institution_id) {
      return;
    }

    createFamilyMutation.mutate({
      family: data,
      institutionId: profile.institution_id // Vincular automaticamente à instituição
    }, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        createForm.reset();
      }
    });
  };

  const handleUnlinkClick = (family: Family) => {
    setFamilyToUnlink(family);
    setIsUnlinkDialogOpen(true);
  };

  const handleConfirmUnlink = async () => {
    if (!familyToUnlink || !profile?.institution_id) {
      return;
    }

    try {
      await disassociateMutation.mutateAsync({
        familyId: familyToUnlink.id,
        institutionId: profile.institution_id
      }, {
        onSuccess: () => {
          setIsUnlinkDialogOpen(false);
          setFamilyToUnlink(null);
        }
      });
    } catch (error) {
      // Error is already handled by the hook
      console.error('Error disassociating family:', error);
    }
  };

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
            <Button 
              className="bg-primary hover:bg-primary/90"
              onClick={handleCreateFamily}
            >
              <UserPlus className="mr-2 h-4 w-4" /> Cadastrar Nova Família
            </Button>
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
              {familiesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : filteredFamilies.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Nenhuma família encontrada</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome da Família</TableHead>
                      <TableHead>Membros</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Última Entrega</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFamilies.map((family) => (
                      <TableRow key={family.id}>
                        <TableCell className="font-medium">{family.family_name}</TableCell>
                        <TableCell>{family.members_count}</TableCell>
                        <TableCell>{getStatusBadge(family)}</TableCell>
                        <TableCell>
                          {family.last_delivery_date ? (
                            <div>
                              <p className="text-sm">{new Date(family.last_delivery_date).toLocaleDateString('pt-BR')}</p>
                              {family.last_delivery_institution && (
                                <p className="text-xs text-gray-500">{family.last_delivery_institution}</p>
                              )}
                            </div>
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
                              onClick={() => handleUnlinkClick(family)}
                              disabled={disassociateMutation.isPending}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            >
                              {disassociateMutation.isPending ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <Unlink className="h-4 w-4 mr-1" />
                              )}
                              Desvincular
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Dialog de detalhes */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalhes da Família: {selectedFamily?.family_name}</DialogTitle>
          </DialogHeader>
          
          {selectedFamily && (
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nome da Família</p>
                  <p className="font-medium">{selectedFamily.family_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Número de Membros</p>
                  <p className="font-medium">{selectedFamily.members_count}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Endereço</p>
                  <p className="font-medium">{selectedFamily.address}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Status Atual</p>
                {getStatusBadge(selectedFamily)}
              </div>
              
              {selectedFamily.is_blocked && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">Informações do Bloqueio</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Motivo:</strong> {selectedFamily.block_reason}</p>
                    <p><strong>Bloqueada por:</strong> {selectedFamily.blocked_by_institution}</p>
                    <p><strong>Bloqueada até:</strong> {selectedFamily.blocked_until ? new Date(selectedFamily.blocked_until).toLocaleDateString('pt-BR') : 'N/A'}</p>
                  </div>
                </div>
              )}
              
              {selectedFamily.last_delivery_date && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Última Entrega</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Data:</strong> {new Date(selectedFamily.last_delivery_date).toLocaleDateString('pt-BR')}</p>
                    <p><strong>Instituição:</strong> {selectedFamily.last_delivery_institution}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
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

      {/* Unlink Confirmation Dialog */}
      <Dialog open={isUnlinkDialogOpen} onOpenChange={setIsUnlinkDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar Desvinculação</DialogTitle>
          </DialogHeader>
          
          {familyToUnlink && (
            <div className="py-4">
              <p className="text-sm text-gray-600 mb-2">
                Tem certeza que deseja desvincular a família <strong>{familyToUnlink.family_name}</strong> da sua instituição?
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
