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
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useFamilies, useUpdateFamily } from "@/hooks/useFamilies";
import type { Tables } from "@/integrations/supabase/types";

type Family = Tables<'families'> & {
  blocked_by_institution?: { name: string } | null;
};

const Families = () => {
  const { data: families, isLoading } = useFamilies();
  const updateFamily = useUpdateFamily();

  // Dialog states
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isUnblockDialogOpen, setIsUnblockDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter families based on search term
  const filteredFamilies = families?.filter(family =>
    family.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    family.contact_person.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Function to unblock a family
  const handleUnblock = (family: Family) => {
    setSelectedFamily(family);
    setIsUnblockDialogOpen(true);
  };

  // Function to confirm family unblock
  const confirmUnblock = () => {
    if (!selectedFamily) return;
    
    updateFamily.mutate(
      { 
        id: selectedFamily.id, 
        updates: { 
          is_blocked: false, 
          blocked_until: null,
          blocked_by_institution_id: null,
          block_reason: null
        } 
      },
      {
        onSuccess: () => {
          setIsUnblockDialogOpen(false);
          setSelectedFamily(null);
          toast({
            title: "Família desbloqueada",
            description: `A família ${selectedFamily.name} foi desbloqueada com sucesso.`
          });
        }
      }
    );
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
    createFamilyMutation.mutate({
      family: data,
      institutionId: undefined // Admin não vincula automaticamente
    }, {
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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 py-4">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Membros</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFamilies.map((family) => (
                      <TableRow key={family.id}>
                        <TableCell className="font-medium">{family.name}</TableCell>
                        <TableCell>{family.contact_person}</TableCell>
                        <TableCell>{family.phone || "Não informado"}</TableCell>
                        <TableCell>{family.members_count || 1}</TableCell>
                        <TableCell>
                          {!family.is_blocked ? (
                            <Badge className="bg-green-500">Ativa</Badge>
                          ) : (
                            <Badge className="bg-red-500">
                              <Lock className="h-3 w-3 mr-1" /> 
                              Bloqueada
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewDetails(family)}
                            >
                              Detalhes
                            </Button>
                            {family.is_blocked && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleUnblock(family)}
                                className="border-red-500 text-red-500 hover:bg-red-50"
                                disabled={updateFamily.isPending}
                              >
                                <Unlock className="h-3 w-3 mr-1" /> 
                                {updateFamily.isPending ? "..." : "Desbloquear"}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
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
                  <p className="text-sm font-semibold text-gray-500">Nome da Família</p>
                  <p>{selectedFamily.name}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500">Pessoa de Contato</p>
                  <p>{selectedFamily.contact_person}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-500">Telefone</p>
                  <p>{selectedFamily.phone || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500">Membros</p>
                  <p>{selectedFamily.members_count || 1} pessoas</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-semibold text-gray-500">Status</p>
                <div className="mt-1">
                  {!selectedFamily.is_blocked ? (
                    <Badge className="bg-green-500">Ativa</Badge>
                  ) : (
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
                    <p>{selectedFamily.blocked_by_institution?.name || "Sistema"}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-500">Bloqueada até</p>
                      <p>{selectedFamily.blocked_until ? new Date(selectedFamily.blocked_until).toLocaleDateString('pt-BR') : "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-500">Motivo</p>
                      <p>{selectedFamily.block_reason || "Não especificado"}</p>
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

              {/* Institution Association Section */}
              {selectedFamily && (
                <div className="pt-4 border-t">
                  <FamilyInstitutionLink 
                    family={selectedFamily}
                    onAssociationChange={() => {
                      // Refresh family data after association
                      // React Query will handle invalidation
                    }}
                  />
                </div>
              )}
              
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
