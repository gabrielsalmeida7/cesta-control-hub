import { useState } from "react";
import Header from "@/components/Header";
import NavigationButtons from "@/components/NavigationButtons";
import Footer from "@/components/Footer";
import { Building, Edit, Info, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useInstitutions, useCreateInstitution, useUpdateInstitution } from "@/hooks/useInstitutions";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

type Institution = Tables<'institutions'>;

const Institutions = () => {
  const { data: institutions, isLoading } = useInstitutions();
  const createInstitution = useCreateInstitution();
  const updateInstitution = useUpdateInstitution();
  
  // State for dialog controls
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
  
  // Hooks for data management
  const { data: institutions = [], isLoading, error } = useInstitutions();
  const createInstitution = useCreateInstitution();
  const updateInstitution = useUpdateInstitution();
  const deleteInstitution = useDeleteInstitution();

  // Setup form
  const form = useForm<TablesInsert<'institutions'>>({
    defaultValues: {
      name: "",
      address: "",
      phone: "",
    }
  });

  // Function to handle creating new institution
  const handleCreate = () => {
    form.reset();
    setIsCreateDialogOpen(true);
  };

  // Function to handle opening the edit dialog
  const handleEdit = (institution: Institution) => {
    setSelectedInstitution(institution);
    form.reset({
      name: institution.name,
      address: institution.address || "",
      phone: institution.phone || "",
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

  // Function to save institution (create or update)
  const onSubmit = (data: TablesInsert<'institutions'>) => {
    if (selectedInstitution) {
      // Update existing
      updateInstitution.mutate(
        { id: selectedInstitution.id, updates: data },
        {
          onSuccess: () => {
            setIsEditDialogOpen(false);
            setSelectedInstitution(null);
          }
        }
      );
    } else {
      // Create new
      createInstitution.mutate(data, {
        onSuccess: () => {
          setIsCreateDialogOpen(false);
        }
      });
    }
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
            <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> Nova Instituição
            </Button>
          </div>
          
          {/* Grid layout for institution cards */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-20 mb-4" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 flex-1" />
                      <Skeleton className="h-8 flex-1" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {institutions?.map((institution) => (
                <Card key={institution.id} className="overflow-hidden">
                  {/* Card header with institution name */}
                  <CardHeader className="bg-primary text-white">
                    <CardTitle>{institution.name}</CardTitle>
                  </CardHeader>
                  {/* Card content with institution details */}
                  <CardContent className="pt-4">
                    <p className="mb-2"><strong>Endereço:</strong> {institution.address || "Não informado"}</p>
                    <p className="mb-4"><strong>Telefone:</strong> {institution.phone || "Não informado"}</p>
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
                    </div>
                  </CardContent>
                </Card>
              )) || []}
            </div>
          )}
        </div>
      </main>

      {/* Create Institution Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Instituição</DialogTitle>
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
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createInstitution.isPending}>
                  {createInstitution.isPending ? "Criando..." : "Criar Instituição"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Institution Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Instituição</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
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
                control={form.control}
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
                control={form.control}
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
                <Button type="submit" disabled={updateInstitution.isPending}>
                  {updateInstitution.isPending ? "Salvando..." : "Salvar Alterações"}
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
            <div className="py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-500">Nome</p>
                  <p>{selectedInstitution.name}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500">Data de Criação</p>
                  <p>{selectedInstitution.created_at ? new Date(selectedInstitution.created_at).toLocaleDateString('pt-BR') : 'N/A'}</p>
                </div>
              </div>
              
              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-500">Endereço</p>
                <p>{selectedInstitution.address || "Não informado"}</p>
              </div>
              
              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-500">Telefone</p>
                <p>{selectedInstitution.phone || "Não informado"}</p>
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
