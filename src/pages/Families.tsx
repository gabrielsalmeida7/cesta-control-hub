import Header from "@/components/Header";
import NavigationButtons from "@/components/NavigationButtons";
import Footer from "@/components/Footer";
import ConsentManagement from "@/components/ConsentManagement";
import { Users, UserPlus, Search, Lock, Unlock, Loader2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "@/hooks/use-toast";
import { useFamilies, useUpdateFamily, useCreateFamily } from "@/hooks/useFamilies";
import { useAuth } from "@/hooks/useAuth";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import FamilyInstitutionAssociation from "@/components/FamilyInstitutionAssociation";
import FamilyInstitutionLink from "@/components/FamilyInstitutionLink";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { formatDateTimeBrasilia, formatDateBrasilia } from "@/utils/dateFormat";

type Family = Tables<'families'> & {
  blocked_by_institution?: { name: string } | null;
  unblocked_by_user?: {
    id: string;
    email?: string;
    full_name?: string;
  } | null;
};

const Families = () => {
  const { data: families, isLoading } = useFamilies();
  const updateFamily = useUpdateFamily();
  const createFamilyMutation = useCreateFamily();
  const updateFamilyMutation = useUpdateFamily();

  // Dialog states
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isUnblockDialogOpen, setIsUnblockDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [unblockReason, setUnblockReason] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Estados para consentimento LGPD
  const [createConsentGiven, setCreateConsentGiven] = useState(false);
  const [createTermSigned, setCreateTermSigned] = useState(false);
  const [editConsentGiven, setEditConsentGiven] = useState(false);
  const [editTermSigned, setEditTermSigned] = useState(false);
  
  const { user } = useAuth();

  // Função para formatar CPF
  const formatCpf = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  // Forms
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

  // Filter families based on search term
  const filteredFamilies = useMemo(() => {
    return families?.filter(family => {
      const searchLower = searchTerm.toLowerCase();
      const searchNumbers = searchTerm.replace(/\D/g, '');
      return (
        family.name.toLowerCase().includes(searchLower) ||
        family.contact_person.toLowerCase().includes(searchLower) ||
        (family.cpf && family.cpf.replace(/\D/g, '').includes(searchNumbers))
      );
    }) || [];
  }, [families, searchTerm]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredFamilies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedFamilies = filteredFamilies.slice(startIndex, endIndex);

  // Reset to page 1 when search term or items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  // Function to unblock a family
  const handleUnblock = (family: Family) => {
    setSelectedFamily(family);
    setUnblockReason("");
    setIsUnblockDialogOpen(true);
  };

  // Function to confirm family unblock
  const confirmUnblock = () => {
    if (!selectedFamily) return;
    
    // Validar justificativa obrigatória
    if (!unblockReason.trim()) {
      toast({
        title: "Justificativa obrigatória",
        description: "Por favor, informe o motivo do desbloqueio manual.",
        variant: "destructive"
      });
      return;
    }
    
    updateFamily.mutate(
      { 
        id: selectedFamily.id, 
        updates: { 
          is_blocked: false, 
          blocked_until: null,
          blocked_by_institution_id: null,
          block_reason: null,
          unblock_reason: unblockReason.trim(),
          unblocked_by_user_id: user?.id || null,
          unblocked_at: new Date().toISOString()
        } 
      },
      {
        onSuccess: () => {
          setIsUnblockDialogOpen(false);
          setSelectedFamily(null);
          setUnblockReason("");
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
    // Limpar CPF (remover máscara) antes de salvar
    const familyData = {
      ...data,
      cpf: data.cpf ? (typeof data.cpf === 'string' ? data.cpf.replace(/\D/g, '') : data.cpf) : null
    };
    
    createFamilyMutation.mutate({
      family: familyData,
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
    // Formatar CPF com máscara para exibição no formulário
    const formattedCpf = family.cpf ? formatCpf(family.cpf) : "";
    editForm.reset({
      name: family.name,
      contact_person: family.contact_person,
      phone: family.phone || "",
      cpf: formattedCpf,
      address: family.address || "",
      members_count: family.members_count || 1,
      is_blocked: family.is_blocked || false,
    });
    setIsEditDialogOpen(true);
  };

  // Function to submit edit family form
  const onSubmitEdit = (data: TablesInsert<'families'>) => {
    if (!selectedFamily) return;
    
    // Limpar CPF (remover máscara) antes de salvar
    const familyData = {
      ...data,
      cpf: data.cpf ? (typeof data.cpf === 'string' ? data.cpf.replace(/\D/g, '') : data.cpf) : null
    };
    
    updateFamilyMutation.mutate({
      id: selectedFamily.id,
      updates: familyData
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
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600 whitespace-nowrap">por página</span>
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
                      <TableHead>Última Entrega</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedFamilies.length > 0 ? (
                      paginatedFamilies.map((family) => {
                        // Calcular última entrega global (de qualquer instituição)
                        const deliveries = (family as any).deliveries || [];
                        const sortedDeliveries = deliveries
                          .filter((d: any) => d.delivery_date)
                          .sort((a: any, b: any) => {
                            const dateA = new Date(a.delivery_date).getTime();
                            const dateB = new Date(b.delivery_date).getTime();
                            return dateB - dateA;
                          });
                        const lastDelivery = sortedDeliveries[0];
                        const lastDeliveryInstitution = lastDelivery?.institution?.name || 'Instituição não identificada';
                        
                        return (
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
                              {lastDelivery ? (
                                <div>
                                  <p className="text-sm">{formatDateTimeBrasilia(lastDelivery.delivery_date)}</p>
                                  <p className="text-xs text-gray-500">{lastDeliveryInstitution}</p>
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
                                  Detalhes
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEditFamily(family)}
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Editar
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
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          Nenhuma família encontrada
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
            
            {/* Pagination Controls */}
            {!isLoading && filteredFamilies.length > 0 && (
              <div className="flex items-center justify-between px-4 py-4 border-t">
                <div className="text-sm text-gray-600">
                  Mostrando {startIndex + 1} a {Math.min(endIndex, filteredFamilies.length)} de {filteredFamilies.length} famílias
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
          </div>
        </div>
      </main>
      
      {/* Family Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>Detalhes da Família</DialogTitle>
          </DialogHeader>
          
          {selectedFamily && (
            <div className="px-6 space-y-4 overflow-y-auto flex-1 min-h-0">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-500">Nome da Família</p>
                  <p>{selectedFamily.name}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500">Pessoa de Contato(Titular da Família)</p>
                  <p>{selectedFamily.contact_person}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-500">Telefone</p>
                  <p>{selectedFamily.phone || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500">CPF</p>
                  <p>{selectedFamily.cpf ? formatCpf(selectedFamily.cpf) : "Não informado"}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-500">Membros</p>
                  <p>{selectedFamily.members_count || 1} pessoas</p>
                </div>
              </div>
              
              {selectedFamily.address && (
                <div>
                  <p className="text-sm font-semibold text-gray-500">Endereço</p>
                  <p>{selectedFamily.address}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm font-semibold text-gray-500">Status</p>
                <div className="mt-1">
                  {!selectedFamily.is_blocked ? (
                    <Badge className="bg-green-500">Ativa</Badge>
                  ) : (
                    <Badge className="bg-red-500">Bloqueada</Badge>
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

              {/* Auditoria de Desbloqueio */}
              {(selectedFamily.unblock_reason || selectedFamily.unblocked_by_user_id || selectedFamily.unblocked_at) && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-3">Auditoria de Desbloqueio Manual</h4>
                  <div className="space-y-2 text-sm">
                    {selectedFamily.unblocked_at && (
                      <div>
                        <p className="font-semibold text-gray-700">Data e Hora do Desbloqueio:</p>
                        <p className="text-gray-600">{formatDateTimeBrasilia(selectedFamily.unblocked_at)}</p>
                      </div>
                    )}
                    {selectedFamily.unblocked_by_user && (
                      <div>
                        <p className="font-semibold text-gray-700">Desbloqueado por:</p>
                        <p className="text-gray-600">
                          {selectedFamily.unblocked_by_user.full_name || 
                           selectedFamily.unblocked_by_user.email || 
                           'Usuário não identificado'}
                        </p>
                      </div>
                    )}
                    {selectedFamily.unblock_reason && (
                      <div>
                        <p className="font-semibold text-gray-700">Motivo do Desbloqueio:</p>
                        <p className="text-gray-600">{selectedFamily.unblock_reason}</p>
                      </div>
                    )}
                  </div>
                </div>
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
      
      {/* Unblock Confirmation Dialog */}
      <Dialog open={isUnblockDialogOpen} onOpenChange={setIsUnblockDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Confirmar Desbloqueio Manual</DialogTitle>
          </DialogHeader>
          
          {selectedFamily && (
            <div className="py-4 space-y-4">
              <div>
                <p>
                  Tem certeza que deseja desbloquear a família <strong>{selectedFamily.name}</strong>?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Esta ação permitirá que a família receba cestas básicas novamente.
                </p>
              </div>
              
              <div>
                <label htmlFor="unblock-reason" className="text-sm font-medium text-gray-700 block mb-2">
                  Justificativa do Desbloqueio <span className="text-red-500">*</span>
                </label>
                <Textarea
                  id="unblock-reason"
                  placeholder="Informe o motivo do desbloqueio manual desta família..."
                  value={unblockReason}
                  onChange={(e) => setUnblockReason(e.target.value)}
                  rows={4}
                  className="w-full"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Este campo é obrigatório para auditoria e rastreabilidade.
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsUnblockDialogOpen(false);
                setUnblockReason("");
              }}
            >
              Cancelar
            </Button>
            <Button 
              className="bg-red-500 hover:bg-red-600" 
              onClick={confirmUnblock}
              disabled={updateFamily.isPending || !unblockReason.trim()}
            >
              {updateFamily.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Desbloqueando...
                </>
              ) : (
                "Desbloquear"
              )}
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pessoa de Contato(Titular da Família)</FormLabel>
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
              
              <ConsentManagement
                familyName={createForm.watch('name') || ''}
                familyCpf={createForm.watch('cpf')}
                contactPerson={createForm.watch('contact_person') || ''}
                phone={createForm.watch('phone')}
                address={createForm.watch('address')}
                institutionName="Sistema Cesta Justa"
                consentGiven={createConsentGiven}
                termSigned={createTermSigned}
                onConsentChange={setCreateConsentGiven}
                onTermSignedChange={setCreateTermSigned}
                mode="create"
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setCreateConsentGiven(false);
                    setCreateTermSigned(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={createFamilyMutation.isPending || !createConsentGiven}
                  title={!createConsentGiven ? "É necessário consentimento para cadastrar" : ""}
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
                    <FormLabel>Pessoa de Contato(Titular da Família)</FormLabel>
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
              
              <ConsentManagement
                familyName={editForm.watch('name') || ''}
                familyCpf={editForm.watch('cpf')}
                contactPerson={editForm.watch('contact_person') || ''}
                phone={editForm.watch('phone')}
                address={editForm.watch('address')}
                institutionName="Sistema Cesta Justa"
                consentGiven={editConsentGiven}
                termSigned={editTermSigned}
                onConsentChange={setEditConsentGiven}
                onTermSignedChange={setEditTermSigned}
                familyId={selectedFamily?.id}
                mode="edit"
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
