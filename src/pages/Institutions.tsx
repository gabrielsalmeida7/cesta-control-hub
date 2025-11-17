import { useState, useEffect } from "react";
import Header from "@/components/Header";
import NavigationButtons from "@/components/NavigationButtons";
import Footer from "@/components/Footer";
import { Building, Edit, Info, Plus, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useInstitutions, useCreateInstitution, useUpdateInstitution, useDeleteInstitution } from "@/hooks/useInstitutions";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

type Institution = Tables<'institutions'>;

const Institutions = () => {
  // State for dialog controls
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(9); // 9 para grid 3x3
  const [currentPage, setCurrentPage] = useState(1);
  
  // Hooks for data management
  const { data: institutions = [], isLoading, error } = useInstitutions();
  const createInstitution = useCreateInstitution();
  const updateInstitution = useUpdateInstitution();
  const deleteInstitution = useDeleteInstitution();

  // Pagination calculations
  const totalPages = Math.ceil(institutions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInstitutions = institutions.slice(startIndex, endIndex);

  // Reset to page 1 when items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // Form data type
  type InstitutionFormData = {
    name: string;
    address?: string;
    phone?: string;
    email: string;
    password: string;
    confirmPassword: string;
    responsible_name: string;
  };

  // Setup form - extended to include user creation fields
  const form = useForm<InstitutionFormData>({
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
      responsible_name: "",
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
      email: institution.email || "",
      responsible_name: institution.responsible_name || "",
      password: "", // Don't show password in edit
      confirmPassword: "",
    });
    setIsEditDialogOpen(true);
  };
  
  // Function to handle opening the delete dialog
  const handleDelete = (institution: Institution) => {
    setSelectedInstitution(institution);
    setIsDeleteDialogOpen(true);
  };

  // Function to save institution (create or update)
  const onSubmit = (data: InstitutionFormData) => {
    if (selectedInstitution) {
      // Update existing (don't include password fields)
      const { password, confirmPassword, ...updateData } = data;
      updateInstitution.mutate(
        { 
          id: selectedInstitution.id, 
          updates: {
            name: updateData.name,
            address: updateData.address,
            phone: updateData.phone,
            email: updateData.email,
            responsible_name: updateData.responsible_name,
          }
        },
        {
          onSuccess: () => {
            setIsEditDialogOpen(false);
            setSelectedInstitution(null);
            form.reset();
          }
        }
      );
    } else {
      // Create new - validate password match
      if (data.password !== data.confirmPassword) {
        form.setError('confirmPassword', {
          type: 'manual',
          message: 'As senhas não coincidem'
        });
        return;
      }
      
      if (data.password.length < 6) {
        form.setError('password', {
          type: 'manual',
          message: 'A senha deve ter pelo menos 6 caracteres'
        });
        return;
      }
      
      // Create with all fields including password
      createInstitution.mutate({
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        password: data.password,
        responsible_name: data.responsible_name,
      }, {
        onSuccess: () => {
          setIsCreateDialogOpen(false);
          form.reset();
        }
      });
    }
  };

  // Function to handle opening the details dialog
  const handleDetails = (institution: Institution) => {
    setSelectedInstitution(institution);
    setIsDetailsDialogOpen(true);
  };
  
  // Query to get families count for selected institution
  const { data: familiesCount } = useQuery({
    queryKey: ['institution-families-count', selectedInstitution?.id],
    queryFn: async () => {
      if (!selectedInstitution?.id) return 0;
      const { count } = await supabase
        .from('institution_families')
        .select('*', { count: 'exact', head: true })
        .eq('institution_id', selectedInstitution.id);
      return count || 0;
    },
    enabled: !!selectedInstitution?.id && isDetailsDialogOpen,
  });

  // Function to handle delete confirmation
  const onDeleteConfirm = () => {
    if (selectedInstitution) {
      deleteInstitution.mutate(selectedInstitution.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setSelectedInstitution(null);
        }
      });
    }
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Instituições</h2>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 whitespace-nowrap">Mostrar:</label>
                <Select 
                  value={itemsPerPage.toString()} 
                  onValueChange={(value) => {
                    setItemsPerPage(parseInt(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6</SelectItem>
                    <SelectItem value="9">9</SelectItem>
                    <SelectItem value="12">12</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="18">18</SelectItem>
                    <SelectItem value="24">24</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600 whitespace-nowrap">por página</span>
              </div>
              <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" /> Nova Instituição
              </Button>
            </div>
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
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedInstitutions.map((institution) => (
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
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(institution)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
              
              {/* Pagination Controls */}
              {!isLoading && institutions.length > 0 && (
                <div className="flex items-center justify-between mt-6 px-4 py-4 border-t">
                  <div className="text-sm text-gray-600">
                    Mostrando {startIndex + 1} a {Math.min(endIndex, institutions.length)} de {institutions.length} instituições
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-600">
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Create Institution Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Instituição</DialogTitle>
            <DialogDescription>
              Preencha os dados da instituição. Um usuário de login será criado automaticamente com o email e senha informados.
            </DialogDescription>
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
              
              <FormField
                control={form.control}
                name="email"
                rules={{
                  required: "Email é obrigatório",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Email inválido"
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (para login)</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} placeholder="instituicao@exemplo.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="responsible_name"
                rules={{ required: "Nome do responsável é obrigatório" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Responsável</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome completo do responsável" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                rules={{
                  required: "Senha é obrigatória",
                  minLength: {
                    value: 6,
                    message: "A senha deve ter pelo menos 6 caracteres"
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} placeholder="Mínimo 6 caracteres" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                rules={{
                  required: "Confirmação de senha é obrigatória",
                  validate: (value) => {
                    if (value !== form.getValues('password')) {
                      return 'As senhas não coincidem';
                    }
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Senha</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} placeholder="Digite a senha novamente" />
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
            <DialogDescription>
              Atualize as informações da instituição. A senha não pode ser alterada aqui.
            </DialogDescription>
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
              
              <FormField
                control={form.control}
                name="email"
                rules={{
                  required: "Email é obrigatório",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Email inválido"
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (para login)</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} placeholder="instituicao@exemplo.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="responsible_name"
                rules={{ required: "Nome do responsável é obrigatório" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Responsável</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome completo do responsável" />
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
            <DialogDescription>
              Esta ação não pode ser desfeita. A instituição e seus dados serão permanentemente removidos.
            </DialogDescription>
          </DialogHeader>
          
          {selectedInstitution && (
            <div className="py-4 space-y-2">
              <p>
                Tem certeza que deseja excluir a instituição <strong>{selectedInstitution.name}</strong>?
              </p>
              <div className="text-sm text-gray-600 space-y-1">
                <p>⚠️ Esta ação irá:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>Excluir permanentemente a instituição</li>
                  <li>Excluir o usuário de login associado</li>
                  <li>Remover todas as associações com famílias</li>
                </ul>
                <p className="text-orange-600 font-medium mt-2">
                  ⚠️ Não é possível excluir se houver entregas registradas.
                </p>
              </div>
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
            <DialogDescription>
              Informações completas sobre a instituição e suas estatísticas.
            </DialogDescription>
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
                <p className="text-sm font-semibold text-gray-500">Email</p>
                <p>{selectedInstitution.email || "Não informado"}</p>
              </div>
              
              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-500">Nome do Responsável</p>
                <p>{selectedInstitution.responsible_name || "Não informado"}</p>
              </div>
              
              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-500">Endereço</p>
                <p>{selectedInstitution.address || "Não informado"}</p>
              </div>
              
              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-500">Telefone</p>
                <p>{selectedInstitution.phone || "Não informado"}</p>
              </div>
              
              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-500">Famílias Vinculadas</p>
                <p className="text-lg font-bold text-primary">{familiesCount ?? 0}</p>
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
