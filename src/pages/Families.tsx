import Header from "@/components/Header";
import NavigationButtons from "@/components/NavigationButtons";
import Footer from "@/components/Footer";
import { Users, UserPlus, Search, Lock, Unlock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useFamilies, useUpdateFamily, useCreateFamily } from "@/hooks/useFamilies";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import FamilyInstitutionAssociation from "@/components/FamilyInstitutionAssociation";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

// Use Supabase types for families
type Family = Tables<'families'> & {
  blocked_by_institution?: {
    name: string;
  };
  institution_families?: Array<{
    institution_id: string;
    institution: {
      id: string;
      name: string;
    };
  }>;
};

const Families = () => {
  // Real data from Supabase
  const isAdmin = true; // Simulating admin privileges - would come from auth context
  
  // Dialog states
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isUnblockDialogOpen, setIsUnblockDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Use real data from Supabase
  const { data: families = [], isLoading, error } = useFamilies();
  const updateFamilyMutation = useUpdateFamily();
  const createFamilyMutation = useCreateFamily();

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

  // Form for editing family
  const editForm = useForm<TablesInsert<'families'>>({
    defaultValues: {
      name: "",
      contact_person: "",
      phone: "",
      members_count: 1,
      is_blocked: false,
    }
  });

  // Function to unblock a family
  const handleUnblock = (family: Family) => {
    if (!isAdmin) return;
    
    setSelectedFamily(family);
    setIsUnblockDialogOpen(true);
  };

  // Function to confirm family unblock
  const confirmUnblock = () => {
    if (!selectedFamily) return;
    
    updateFamilyMutation.mutate({
      id: selectedFamily.id,
      updates: {
        is_blocked: false,
        blocked_by_institution_id: null,
        blocked_until: null,
        block_reason: null
      }
    });
    
    setIsUnblockDialogOpen(false);
  };

  // Function to view family details
  const handleViewDetails = (family: Family) => {
    setSelectedFamily(family);
    setIsDetailsOpen(true);
  };

  // Function to handle creating a new family
  const handleCreateFamily = () => {
    createForm.reset();
    setIsCreateDialogOpen(true);
  };

  // Function to submit create family form
  const onSubmitCreate = (data: TablesInsert<'families'>) => {
    createFamilyMutation.mutate(data, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        createForm.reset();
      }
    });
  };

  // Function to handle editing a family
  const handleEditFamily = (family: Family) => {
    setSelectedFamily(family);
    editForm.reset({
      name: family.name,
      contact_person: family.contact_person,
      phone: family.phone || "",
      members_count: family.members_count || 1,
      is_blocked: family.is_blocked || false,
    });
    setIsEditDialogOpen(true);
  };

  // Function to submit edit family form
  const onSubmitEdit = (data: TablesInsert<'families'>) => {
    if (!selectedFamily) return;
    
    updateFamilyMutation.mutate({
      id: selectedFamily.id,
      updates: data
    }, {
      onSuccess: () => {
        setIsEditDialogOpen(false);
        editForm.reset();
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
      <Header />
      <NavigationButtons />
      
      <main className="pt-20 pb-8 px-4 md:px-8 max-w-[1400px] mx-auto flex-grow">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Famílias Cadastradas</h2>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Buscar família..."
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={handleCreateFamily}
              >
                <UserPlus className="mr-2 h-4 w-4" /> Nova Família
              </Button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex space-x-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-6">
                <Alert variant="destructive">
                  <AlertDescription>
                    Erro ao carregar famílias: {error.message}
                  </AlertDescription>
                </Alert>
              </div>
            ) : families.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                Nenhuma família cadastrada.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Pessoas</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Última Atualização</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {families.map((family) => (
                      <TableRow key={family.id}>
                        <TableCell className="font-medium">{family.name}</TableCell>
                        <TableCell>{family.contact_person}</TableCell>
                        <TableCell>{family.phone || '-'}</TableCell>
                        <TableCell>{family.members_count || 0}</TableCell>
                        <TableCell>
                          {family.is_blocked ? (
                            <Badge className="bg-red-500">
                              <Lock className="h-3 w-3 mr-1" /> 
                              Bloqueada
                            </Badge>
                          ) : (
                            <Badge className="bg-green-500">Ativa</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {family.updated_at ? new Date(family.updated_at).toLocaleDateString('pt-BR') : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditFamily(family)}
                            >
                              Editar
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewDetails(family)}
                            >
                              Detalhes
                            </Button>
                            {isAdmin && family.is_blocked && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleUnblock(family)}
                                className="border-red-500 text-red-500 hover:bg-red-50"
                                disabled={updateFamilyMutation.isPending}
                              >
                                {updateFamilyMutation.isPending ? (
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <Unlock className="h-3 w-3 mr-1" />
                                )}
                                Desbloquear
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Family Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Detalhes da Família</DialogTitle>
          </DialogHeader>
          
          {selectedFamily && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-500">Nome</p>
                  <p>{selectedFamily.name}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500">Contato</p>
                  <p>{selectedFamily.contact_person}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-500">Telefone</p>
                  <p>{selectedFamily.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500">Membros</p>
                  <p>{selectedFamily.members_count || 0} pessoas</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-500">Criado em</p>
                  <p>{selectedFamily.created_at ? new Date(selectedFamily.created_at).toLocaleDateString('pt-BR') : '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500">Última Atualização</p>
                  <p>{selectedFamily.updated_at ? new Date(selectedFamily.updated_at).toLocaleDateString('pt-BR') : '-'}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-semibold text-gray-500">Status</p>
                <div className="mt-1">
                  {selectedFamily.is_blocked ? (
                    <Badge className="bg-red-500">Bloqueada</Badge>
                  ) : (
                    <Badge className="bg-green-500">Ativa</Badge>
                  )}
                </div>
              </div>
              
              {selectedFamily.is_blocked && (
                <>
                  <div>
                    <p className="text-sm font-semibold text-gray-500">Bloqueada por</p>
                    <p>{selectedFamily.blocked_by_institution?.name || '-'}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-500">Bloqueada até</p>
                      <p>{selectedFamily.blocked_until ? new Date(selectedFamily.blocked_until).toLocaleDateString('pt-BR') : '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-500">Motivo</p>
                      <p>{selectedFamily.block_reason || '-'}</p>
                    </div>
                  </div>
                </>
              )}

              {/* Institution Association */}
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-3">Associações com Instituições</p>
                <FamilyInstitutionAssociation 
                  family={selectedFamily} 
                  onAssociationChange={() => {
                    // Refresh the families data when associations change
                    // This will be handled by React Query's invalidation
                  }}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setIsDetailsOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Unblock Confirmation Dialog */}
      <Dialog open={isUnblockDialogOpen} onOpenChange={setIsUnblockDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar Desbloqueio</DialogTitle>
          </DialogHeader>
          
          {selectedFamily && (
            <div className="py-4">
              <p>
                Tem certeza que deseja desbloquear a família <strong>{selectedFamily.name}</strong>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Esta ação permitirá que a família receba cestas básicas novamente.
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsUnblockDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              className="bg-red-500 hover:bg-red-600" 
              onClick={confirmUnblock}
            >
              Desbloquear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Family Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Família</DialogTitle>
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
                  disabled={createFamilyMutation.isPending}
                >
                  {createFamilyMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    "Criar Família"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Family Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Família</DialogTitle>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-4">
              <FormField
                control={editForm.control}
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
                control={editForm.control}
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

      <Footer />
    </div>
  );
};

export default Families;
