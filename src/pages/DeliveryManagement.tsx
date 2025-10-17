import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Package, Calendar, Search, Users, Check, Building, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { useDeliveries, useCreateDelivery } from "@/hooks/useDeliveries";
import { useInstitutions } from "@/hooks/useInstitutions";
import { useInstitutionFamilies } from "@/hooks/useFamilies";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";

// Types from Supabase
type Family = Tables<'families'> & {
  blocked_by_institution?: {
    name: string;
  } | null;
};

type Institution = Tables<'institutions'>;

type Delivery = Tables<'deliveries'> & {
  family: {
    id: string;
    name: string;
    contact_person: string;
    members_count: number | null;
    is_blocked: boolean | null;
    blocked_until: string | null;
    block_reason: string | null;
    blocked_by_institution?: {
      name: string;
    } | null;
  };
  institution: {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
  };
};

interface DeliveryFormValues {
  familyId: string;
  blockPeriod: string; // Days as string to be used in select
  basketCount: number;
  otherItems: string;
}

const DeliveryManagement = () => {
  // Auth and user data
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const userInstitutionId = profile?.institution_id;
  
  // States
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("active");
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string | null>(null);
  
  // Data hooks
  const institutions = useInstitutions();
  const families = useInstitutionFamilies(selectedInstitutionId || undefined);
  const deliveries = useDeliveries(selectedInstitutionId || undefined);
  const createDelivery = useCreateDelivery();
  
  // Initialize selectedInstitutionId based on user role
  useEffect(() => {
    if (isAdmin && institutions.data && institutions.data.length > 0) {
      setSelectedInstitutionId(institutions.data[0].id);
    } else if (!isAdmin && userInstitutionId) {
      setSelectedInstitutionId(userInstitutionId);
    }
  }, [isAdmin, institutions.data, userInstitutionId]);
  
  // Loading states
  const isLoading = institutions.isLoading || families.isLoading || deliveries.isLoading;
  const hasError = institutions.isError || families.isError || deliveries.isError;
  
  // Helper functions
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "Não há registros";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  
  const calculateBlockUntilDate = (blockPeriod: number): string => {
    const today = new Date();
    const blockUntil = new Date(today);
    blockUntil.setDate(today.getDate() + blockPeriod);
    return blockUntil.toISOString().split('T')[0];
  };
  
  // Filter families based on status
  const filteredFamilies = families.data?.filter(family => {
    if (filterStatus === "all") return true;
    if (filterStatus === "active") return !family.is_blocked;
    if (filterStatus === "blocked") return family.is_blocked;
    return true;
  }) || [];
  
  // Get deliveries data
  const deliveriesData = deliveries.data || [];
  
  // Setup form
  const form = useForm<DeliveryFormValues>({
    defaultValues: {
      familyId: "",
      blockPeriod: "30",
      basketCount: 1,
      otherItems: ""
    }
  });

  // Open delivery dialog for a family
  const handleDelivery = (family: Family) => {
    setSelectedFamily(family);
    form.reset({
      familyId: family.id,
      blockPeriod: "30",
      basketCount: 1,
      otherItems: ""
    });
    setIsDeliveryDialogOpen(true);
  };
  
  // Handle institution change (admin only)
  const handleInstitutionChange = (value: string) => {
    setSelectedInstitutionId(value);
  };
  
  // Handle delivery details view
  const handleViewDeliveryDetails = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setIsDetailsDialogOpen(true);
  };
  
  // Get current institution
  const currentInstitution = institutions.data?.find(i => i.id === selectedInstitutionId);

  // Validation functions
  const isFamilyBlocked = (family: Family) => {
    if (!family.is_blocked) return false;
    if (!family.blocked_until) return false;
    const blockedUntil = new Date(family.blocked_until);
    const today = new Date();
    return blockedUntil > today;
  };

  const isFamilyAssociatedWithInstitution = (family: Family, institutionId: string) => {
    // This would need to be checked against the institution_families table
    // For now, we'll assume all families in the filtered list are associated
    return true;
  };

  // Process delivery submission
  const onSubmit = (data: DeliveryFormValues) => {
    if (!selectedFamily || !currentInstitution || !selectedInstitutionId) return;
    
    // Validation checks
    if (isFamilyBlocked(selectedFamily)) {
      toast({
        title: "Erro",
        description: "Esta família está bloqueada e não pode receber entregas no momento.",
        variant: "destructive",
      });
      return;
    }

    if (!isFamilyAssociatedWithInstitution(selectedFamily, selectedInstitutionId)) {
      toast({
        title: "Erro",
        description: "Esta família não está associada à instituição selecionada.",
        variant: "destructive",
      });
      return;
    }
    
    const blockPeriod = parseInt(data.blockPeriod);
    const blockUntilDate = calculateBlockUntilDate(blockPeriod);
    
    // Create delivery data for Supabase
    const deliveryData = {
      family_id: selectedFamily.id,
      institution_id: selectedInstitutionId,
      delivery_date: new Date().toISOString().split('T')[0],
      blocking_period_days: blockPeriod,
      notes: data.otherItems || null,
      delivered_by_user_id: user?.id || null
    };
    
    createDelivery.mutate(deliveryData, {
      onSuccess: () => {
        setIsDeliveryDialogOpen(false);
        form.reset();
      }
    });
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
        <Header />
        <main className="pt-20 pb-8 px-4 md:px-8 max-w-[1400px] mx-auto flex-grow">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Gerenciamento de Entregas</h2>
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Show error state
  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
        <Header />
        <main className="pt-20 pb-8 px-4 md:px-8 max-w-[1400px] mx-auto flex-grow">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Gerenciamento de Entregas</h2>
            <Alert variant="destructive">
              <AlertDescription>
                Erro ao carregar dados. Tente novamente mais tarde.
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
      
      <main className="pt-20 pb-8 px-4 md:px-8 max-w-[1400px] mx-auto flex-grow">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Gerenciamento de Entregas</h2>
          
          {/* Institution Selection for Admin */}
          {isAdmin && (
            <div className="mb-6">
              <label htmlFor="institution-select" className="block text-sm font-medium mb-2">
                Selecionar Instituição
              </label>
              <Select
                value={selectedInstitutionId || ""}
                onValueChange={handleInstitutionChange}
              >
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue placeholder="Selecione uma instituição" />
                </SelectTrigger>
                <SelectContent>
                  {institutions.data?.map((institution) => (
                    <SelectItem
                      key={institution.id}
                      value={institution.id}
                    >
                      {institution.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Institution Info Card */}
          {currentInstitution && (
            <Card className="mb-6">
              <CardHeader className="bg-primary text-white">
                <CardTitle>Instituição Atual</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="font-semibold">{currentInstitution.name}</p>
                <p className="text-sm text-gray-600 mt-1">{currentInstitution.address}</p>
                <p className="text-sm text-gray-600">{currentInstitution.phone}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge className="bg-green-500">
                    <Package className="h-3 w-3 mr-1" />
                    Instituição Ativa
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Eligible Families Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Famílias Disponíveis</h3>
              <div className="flex items-center gap-3">
                <Select 
                  defaultValue="active" 
                  onValueChange={(value) => setFilterStatus(value)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Famílias</SelectItem>
                    <SelectItem value="active">Famílias Ativas</SelectItem>
                    <SelectItem value="blocked">Famílias Bloqueadas</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Buscar família..."
                    className="pl-9 w-[200px]"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Membros</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Última Entrega</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFamilies.length > 0 ? (
                      filteredFamilies.map((family) => (
                        <TableRow key={family.id}>
                          <TableCell className="font-medium">{family.name}</TableCell>
                          <TableCell>{family.contact_person}</TableCell>
                          <TableCell>{family.members_count || 0}</TableCell>
                          <TableCell>
                            {!family.is_blocked ? (
                              <Badge className="bg-green-500">Ativa</Badge>
                            ) : (
                              <Badge className="bg-red-500">Bloqueada</Badge>
                            )}
                          </TableCell>
                          <TableCell>{formatDate(family.blocked_until)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {!isFamilyBlocked(family) ? (
                                <Button 
                                  size="sm" 
                                  onClick={() => handleDelivery(family)}
                                  disabled={createDelivery.isPending}
                                >
                                  <Package className="h-4 w-4 mr-1" /> Entregar Cesta
                                </Button>
                              ) : (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  disabled
                                  title={`Bloqueada até ${formatDate(family.blocked_until)}`}
                                >
                                  Bloqueada
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                          Nenhuma família encontrada com os filtros selecionados.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
          
          {/* Recent Deliveries Section */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Entregas Recentes</h3>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Família</TableHead>
                      <TableHead>Data da Entrega</TableHead>
                      <TableHead>Período de Bloqueio</TableHead>
                      <TableHead>Desbloqueio em</TableHead>
                      <TableHead>Cestas</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliveriesData.length > 0 ? (
                      deliveriesData.map((delivery) => (
                        <TableRow key={delivery.id}>
                          <TableCell className="font-medium">{delivery.family.name}</TableCell>
                          <TableCell>{formatDate(delivery.delivery_date)}</TableCell>
                          <TableCell>{delivery.blocking_period_days} dias</TableCell>
                          <TableCell>{formatDate(delivery.family.blocked_until)}</TableCell>
                          <TableCell>1</TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewDeliveryDetails(delivery)}
                            >
                              Detalhes
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                          Nenhuma entrega registrada por esta instituição.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Delivery Dialog */}
      <Dialog open={isDeliveryDialogOpen} onOpenChange={setIsDeliveryDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Registrar Entrega de Cesta</DialogTitle>
          </DialogHeader>
          
          {selectedFamily && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-md mb-2">
                  <p className="font-semibold">Família: {selectedFamily.name}</p>
                  <p className="text-sm text-gray-600">Membros: {selectedFamily.members_count || 0} pessoas</p>
                  <p className="text-sm text-gray-600">Contato: {selectedFamily.contact_person}</p>
                </div>
                
                <FormField
                  control={form.control}
                  name="basketCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade de Cestas</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={10}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="otherItems"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Outros Itens (separados por vírgula)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Leite (2L), Arroz (5kg), Feijão (1kg)"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="blockPeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Período de Bloqueio</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o período" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 dias</SelectItem>
                            <SelectItem value="30">30 dias</SelectItem>
                            <SelectItem value="45">45 dias</SelectItem>
                            <SelectItem value="60">60 dias</SelectItem>
                            <SelectItem value="90">90 dias</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    <Calendar className="h-4 w-4 inline-block mr-1" />
                    A família ficará bloqueada por {form.watch("blockPeriod")} dias após esta entrega.
                  </p>
                </div>
                
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDeliveryDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-primary hover:bg-primary/90"
                    disabled={createDelivery.isPending}
                  >
                    {createDelivery.isPending ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-1" />
                    )}
                    {createDelivery.isPending ? "Registrando..." : "Confirmar Entrega"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delivery Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Detalhes da Entrega</DialogTitle>
          </DialogHeader>
          
          {selectedDelivery && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-500">Família</p>
                  <p>{selectedDelivery.family.name}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500">Data da Entrega</p>
                  <p>{formatDate(selectedDelivery.delivery_date)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-500">Período de Bloqueio</p>
                  <p>{selectedDelivery.blocking_period_days} dias</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500">Bloqueada até</p>
                  <p>{formatDate(selectedDelivery.family.blocked_until)}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-semibold text-gray-500">Itens Entregues</p>
                <div className="bg-gray-50 p-3 rounded-md mt-2">
                  <p><strong>Cestas básicas:</strong> 1</p>
                  
                  {selectedDelivery.notes && (
                    <>
                      <p className="mt-2"><strong>Observações:</strong></p>
                      <p className="text-sm">{selectedDelivery.notes}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setIsDetailsDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
};

export default DeliveryManagement;