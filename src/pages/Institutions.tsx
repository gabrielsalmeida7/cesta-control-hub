import { useState } from "react";
import Header from "@/components/Header";
import NavigationButtons from "@/components/NavigationButtons";
import Footer from "@/components/Footer";
import { Building, Edit, Info, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useInstitutions, useCreateInstitution, useUpdateInstitution, useDeleteInstitution } from "@/hooks/useInstitutions";
import type { Tables } from "@/integrations/supabase/types";

// Use Supabase types for institution data model
type Institution = Tables<'institutions'>;

const Institutions = () => {
  // Mock data
  const isAdmin = true; // Mock user role - would be from authentication context in a real app
  
  // State for dialog controls
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
  
  // Hooks for data management
  const { data: institutions = [], isLoading, error } = useInstitutions();
  const createInstitution = useCreateInstitution();
  const updateInstitution = useUpdateInstitution();
  const deleteInstitution = useDeleteInstitution();

  // Setup forms
  const editForm = useForm<Institution>({
    defaultValues: {
      name: "",
      address: "",
      phone: "",
    }
  });
  
  const createForm = useForm<Omit<Institution, 'id' | 'created_at' | 'updated_at'>>({
    defaultValues: {
      name: "",
      address: "",
      phone: "",
    }
  });


  // Function to handle opening the edit dialog
  const handleEdit = (institution: Institution) => {
    setSelectedInstitution(institution);
    // Reset form with institution values
    editForm.reset({
      id: institution.id,
      name: institution.name,
      address: institution.address,
      phone: institution.phone,
    });
    setIsEditDialogOpen(true);
  };
  
  // Function to handle opening the create dialog
  const handleCreate = () => {
    createForm.reset();
    setIsCreateDialogOpen(true);
  };
  
  // Function to handle opening the delete dialog
  const handleDelete = (institution: Institution) => {
    setSelectedInstitution(institution);
    setIsDeleteDialogOpen(true);
  };

  // Function to save edited institution
  const onEditSubmit = (data: Institution) => {
    if (!selectedInstitution?.id) return;
    
    updateInstitution.mutate({
      id: selectedInstitution.id,
      updates: {
        name: data.name,
        address: data.address,
        phone: data.phone,
      }
    }, {
      onSuccess: () => {
        setIsEditDialogOpen(false);
        setSelectedInstitution(null);
      }
    });
  };
  
  // Function to create new institution
  const onCreateSubmit = (data: Omit<Institution, 'id' | 'created_at' | 'updated_at'>) => {
    createInstitution.mutate(data, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        createForm.reset();
      }
    });
  };
  
  // Function to confirm delete
  const onDeleteConfirm = () => {
    if (!selectedInstitution?.id) return;
    
    deleteInstitution.mutate(selectedInstitution.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        setSelectedInstitution(null);
      }
    });
  };

  // Function to handle opening the details dialog
  const handleDetails = (institution: Institution) => {
    setSelectedInstitution(institution);
    setIsDetailsDialogOpen(true);
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
        <Header />
        <NavigationButtons />
        <main className="pt-20 pb-8 px-4 md:px-8 max-w-[1400px] mx-auto flex-grow">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Instituições</h2>
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="bg-primary">
                    <Skeleton className="h-6 w-3/4" />
                  </CardHeader>
                  <CardContent className="pt-4">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3 mb-4" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 flex-1" />
                      <Skeleton className="h-8 flex-1" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
        <Header />
        <NavigationButtons />
        <main className="pt-20 pb-8 px-4 md:px-8 max-w-[1400px] mx-auto flex-grow">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Instituições</h2>
            </div>
            <Alert variant="destructive">
              <AlertDescription>
                Erro ao carregar instituições: {error.message}
              </AlertDescription>
            </Alert>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
      <Header />
      <NavigationButtons />
      
      <main className="pt-20 pb-8 px-4 md:px-8 max-w-[1400px] mx-auto flex-grow">
        <div className="mb-8">
          {/* Page title and add new institution button */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Instituições</h2>
            <Button 
              className="bg-primary hover:bg-primary/90"
              onClick={handleCreate}
            >
              <Building className="mr-2 h-4 w-4" /> Nova Instituição
            </Button>
          </div>
          
          {/* Grid layout for institution cards */}
          {institutions.length === 0 ? (
            <div className="text-center py-12">
              <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma instituição encontrada</h3>
              <p className="text-gray-500 mb-4">Comece criando sua primeira instituição.</p>
              <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90">
                <Building className="mr-2 h-4 w-4" /> Nova Instituição
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {institutions.map((institution) => (
                <Card key={institution.id} className="overflow-hidden">
                  {/* Card header with institution name */}
                  <CardHeader className="bg-primary text-white">
                    <CardTitle>{institution.name}</CardTitle>
                  </CardHeader>
                  {/* Card content with institution details */}
                  <CardContent className="pt-4">
                    <p className="mb-2"><strong>Endereço:</strong> {institution.address || 'Não informado'}</p>
                    <p className="mb-4"><strong>Telefone:</strong> {institution.phone || 'Não informado'}</p>
                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleEdit(institution)}
                      >
                        <Edit className="mr-2 h-4 w-4" /> Editar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleDetails(institution)}
                      >
                        <Info className="mr-2 h-4 w-4" /> Detalhes
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(institution)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Edit Institution Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Instituição</DialogTitle>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
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
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      <Input {...field} />
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
                  disabled={updateInstitution.isPending}
                >
                  {updateInstitution.isPending ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Create Institution Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Instituição</DialogTitle>
          </DialogHeader>
          
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      <Input {...field} />
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
                  disabled={createInstitution.isPending}
                >
                  {createInstitution.isPending ? 'Criando...' : 'Criar Instituição'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          
          {selectedInstitution && (
            <div className="py-4">
              <p>
                Tem certeza que deseja excluir a instituição <strong>{selectedInstitution.name}</strong>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Esta ação não pode ser desfeita.
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={onDeleteConfirm}
              disabled={deleteInstitution.isPending}
            >
              {deleteInstitution.isPending ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Details Institution Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              Detalhes da Instituição: {selectedInstitution?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedInstitution && (
            <div className="py-4 space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-500">Nome</p>
                <p>{selectedInstitution.name}</p>
              </div>
              
              <div>
                <p className="text-sm font-semibold text-gray-500">Endereço</p>
                <p>{selectedInstitution.address || 'Não informado'}</p>
              </div>
              
              <div>
                <p className="text-sm font-semibold text-gray-500">Telefone</p>
                <p>{selectedInstitution.phone || 'Não informado'}</p>
              </div>
              
              <div>
                <p className="text-sm font-semibold text-gray-500">Criado em</p>
                <p>{selectedInstitution.created_at ? new Date(selectedInstitution.created_at).toLocaleDateString('pt-BR') : 'Não informado'}</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              onClick={() => setIsDetailsDialogOpen(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Institutions;
