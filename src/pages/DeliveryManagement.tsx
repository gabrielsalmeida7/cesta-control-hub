
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Package, Calendar, Search, Users, Check, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";

// Interfaces
interface Family {
  id: number;
  name: string;
  cpf: string;
  address: string;
  members: number;
  lastDelivery: string | null;
  status: "active" | "blocked";
  blockedBy?: {
    id: number;
    name: string;
  };
  blockedUntil?: string;
  blockReason?: string;
  institutionIds: number[]; // List of institutions this family is registered with
}

interface Institution {
  id: number;
  name: string;
  address: string;
  phone: string;
  availableBaskets: number; // Changed from deliveries to availableBaskets
}

interface Delivery {
  id: number;
  familyId: number;
  familyName: string;
  institutionId: number;
  institutionName: string;
  deliveryDate: string;
  blockPeriod: number; // Days
  blockUntil: string;
  items: {
    baskets: number;
    others: string[];
  };
}

interface DeliveryFormValues {
  familyId: number;
  blockPeriod: string; // Days as string to be used in select
  basketCount: number;
  otherItems: string;
}

const DeliveryManagement = () => {
  // Mock data
  const username = "Gabriel Admin";
  const isAdmin = true; // Mock admin status
  
  // States
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("active");
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<number>(1); // Default to first institution
  
  // Mock data for institutions
  const institutions: Institution[] = [
    { id: 1, name: "Centro Comunitário São José", address: "Rua das Flores, 123", phone: "(11) 9999-8888", availableBaskets: 42 },
    { id: 2, name: "Associação Bem-Estar", address: "Av. Principal, 456", phone: "(11) 7777-6666", availableBaskets: 37 },
    { id: 3, name: "Igreja Nossa Senhora", address: "Praça Central, 789", phone: "(11) 5555-4444", availableBaskets: 25 },
    { id: 4, name: "Instituto Esperança", address: "Rua dos Sonhos, 101", phone: "(11) 3333-2222", availableBaskets: 31 },
  ];
  
  // Mock data for families with different statuses and institution associations
  const [families, setFamilies] = useState<Family[]>([
    { 
      id: 1, 
      name: "Silva", 
      cpf: "123.456.789-00", 
      address: "Rua A, 123", 
      members: 4, 
      lastDelivery: "10/04/2025",
      status: "active",
      institutionIds: [1, 3] // Registered with institutions 1 and 3
    },
    { 
      id: 2, 
      name: "Santos", 
      cpf: "987.654.321-00", 
      address: "Rua B, 456", 
      members: 3, 
      lastDelivery: "05/04/2025",
      status: "blocked",
      blockedBy: {
        id: 1,
        name: "Centro Comunitário São José"
      },
      blockedUntil: "10/05/2025",
      blockReason: "Recebeu cesta básica",
      institutionIds: [1, 2] // Registered with institutions 1 and 2
    },
    { 
      id: 3, 
      name: "Oliveira", 
      cpf: "456.789.123-00", 
      address: "Rua C, 789", 
      members: 5, 
      lastDelivery: "01/04/2025",
      status: "active",
      institutionIds: [1, 2, 4] // Registered with institutions 1, 2 and 4
    },
    { 
      id: 4, 
      name: "Pereira", 
      cpf: "789.123.456-00", 
      address: "Rua D, 101", 
      members: 2, 
      lastDelivery: "28/03/2025",
      status: "blocked",
      blockedBy: {
        id: 2,
        name: "Associação Bem-Estar"
      },
      blockedUntil: "28/04/2025",
      blockReason: "Recebeu cesta básica",
      institutionIds: [2, 3] // Registered with institutions 2 and 3
    },
    { 
      id: 5, 
      name: "Costa", 
      cpf: "321.654.987-00", 
      address: "Rua E, 202", 
      members: 6, 
      lastDelivery: null,
      status: "active",
      institutionIds: [1, 3, 4] // Registered with institutions 1, 3 and 4
    },
  ]);
  
  // Mock data for past deliveries
  const [deliveries, setDeliveries] = useState<Delivery[]>([
    {
      id: 1,
      familyId: 1,
      familyName: "Silva",
      institutionId: 1,
      institutionName: "Centro Comunitário São José",
      deliveryDate: "10/04/2025",
      blockPeriod: 30,
      blockUntil: "10/05/2025",
      items: {
        baskets: 1,
        others: ["Leite (2L)", "Arroz (5kg)"]
      }
    },
    {
      id: 2,
      familyId: 3,
      familyName: "Oliveira",
      institutionId: 1,
      institutionName: "Centro Comunitário São José",
      deliveryDate: "01/04/2025",
      blockPeriod: 30,
      blockUntil: "01/05/2025",
      items: {
        baskets: 2,
        others: ["Feijão (2kg)", "Óleo (1L)"]
      }
    },
    {
      id: 3,
      familyId: 2,
      familyName: "Santos",
      institutionId: 1,
      institutionName: "Centro Comunitário São José",
      deliveryDate: "05/04/2025",
      blockPeriod: 30,
      blockUntil: "05/05/2025",
      items: {
        baskets: 1,
        others: ["Macarrão (500g)", "Café (500g)"]
      }
    },
    {
      id: 4,
      familyId: 4,
      familyName: "Pereira",
      institutionId: 2,
      institutionName: "Associação Bem-Estar",
      deliveryDate: "28/03/2025",
      blockPeriod: 30,
      blockUntil: "28/04/2025",
      items: {
        baskets: 1,
        others: ["Açúcar (1kg)", "Farinha (2kg)"]
      }
    },
    {
      id: 5,
      familyId: 5,
      familyName: "Costa",
      institutionId: 3,
      institutionName: "Igreja Nossa Senhora",
      deliveryDate: "25/03/2025",
      blockPeriod: 30,
      blockUntil: "25/04/2025",
      items: {
        baskets: 2,
        others: ["Sabonete (3un)", "Detergente (500ml)"]
      }
    }
  ]);

  // Filter families based on status and selected institution
  const filteredFamilies = filterStatus === "all" 
    ? families.filter(f => f.institutionIds.includes(selectedInstitutionId))
    : families.filter(f => f.status === filterStatus && f.institutionIds.includes(selectedInstitutionId));
  
  // Only show deliveries from selected institution
  const filteredDeliveries = deliveries
    .filter(d => d.institutionId === selectedInstitutionId)
    .sort((a, b) => {
      // Sort by date descending
      const dateA = new Date(a.deliveryDate.split('/').reverse().join('-'));
      const dateB = new Date(b.deliveryDate.split('/').reverse().join('-'));
      return dateB.getTime() - dateA.getTime();
    });
  
  // Setup form
  const form = useForm<DeliveryFormValues>({
    defaultValues: {
      familyId: 0,
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
    setSelectedInstitutionId(parseInt(value));
  };
  
  // Handle delivery details view
  const handleViewDeliveryDetails = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setIsDetailsDialogOpen(true);
  };
  
  // Function to format date as DD/MM/YYYY
  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  
  // Calculate block until date based on current date and period in days
  const calculateBlockUntilDate = (blockPeriod: number): string => {
    const today = new Date();
    const blockUntil = new Date(today);
    blockUntil.setDate(today.getDate() + blockPeriod);
    return formatDate(blockUntil);
  };

  // Get current institution
  const currentInstitution = institutions.find(i => i.id === selectedInstitutionId);

  // Process delivery submission
  const onSubmit = (data: DeliveryFormValues) => {
    if (!selectedFamily || !currentInstitution) return;
    
    const blockPeriod = parseInt(data.blockPeriod);
    const blockUntilDate = calculateBlockUntilDate(blockPeriod);
    
    // Create new delivery record
    const newDelivery: Delivery = {
      id: deliveries.length + 1,
      familyId: selectedFamily.id,
      familyName: selectedFamily.name,
      institutionId: selectedInstitutionId,
      institutionName: currentInstitution.name,
      deliveryDate: formatDate(new Date()),
      blockPeriod,
      blockUntil: blockUntilDate,
      items: {
        baskets: data.basketCount,
        others: data.otherItems ? data.otherItems.split(',').map(item => item.trim()) : []
      }
    };
    
    // Add delivery to records
    setDeliveries([...deliveries, newDelivery]);
    
    // Update available baskets count
    const updatedInstitutions = institutions.map(inst => {
      if (inst.id === selectedInstitutionId) {
        return {
          ...inst,
          availableBaskets: Math.max(0, inst.availableBaskets - data.basketCount)
        };
      }
      return inst;
    });
    
    // Update family's status to blocked
    const updatedFamilies = families.map(f => {
      if (f.id === selectedFamily.id) {
        return {
          ...f,
          status: "blocked" as const,
          lastDelivery: formatDate(new Date()),
          blockedBy: {
            id: selectedInstitutionId,
            name: currentInstitution.name
          },
          blockedUntil: blockUntilDate,
          blockReason: "Recebeu cesta básica"
        };
      }
      return f;
    });
    
    setFamilies(updatedFamilies);
    setIsDeliveryDialogOpen(false);
    
    toast({
      title: "Entrega realizada",
      description: `Cesta básica entregue para a família ${selectedFamily.name}`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
      <Header username={username} />
      
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
                value={selectedInstitutionId.toString()}
                onValueChange={handleInstitutionChange}
              >
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue placeholder="Selecione uma instituição" />
                </SelectTrigger>
                <SelectContent>
                  {institutions.map((institution) => (
                    <SelectItem
                      key={institution.id}
                      value={institution.id.toString()}
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
                    Cestas Disponíveis: {currentInstitution.availableBaskets}
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
                      <TableHead>CPF</TableHead>
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
                          <TableCell>{family.cpf}</TableCell>
                          <TableCell>{family.members}</TableCell>
                          <TableCell>
                            {family.status === "active" ? (
                              <Badge className="bg-green-500">Ativa</Badge>
                            ) : (
                              <Badge className="bg-red-500">Bloqueada</Badge>
                            )}
                          </TableCell>
                          <TableCell>{family.lastDelivery || "Não há registros"}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {family.status === "active" ? (
                                <Button 
                                  size="sm" 
                                  onClick={() => handleDelivery(family)}
                                  disabled={currentInstitution?.availableBaskets === 0}
                                >
                                  <Package className="h-4 w-4 mr-1" /> Entregar Cesta
                                </Button>
                              ) : (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  disabled
                                  title={`Bloqueada até ${family.blockedUntil}`}
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
                    {filteredDeliveries.length > 0 ? (
                      filteredDeliveries.map((delivery) => (
                        <TableRow key={delivery.id}>
                          <TableCell className="font-medium">{delivery.familyName}</TableCell>
                          <TableCell>{delivery.deliveryDate}</TableCell>
                          <TableCell>{delivery.blockPeriod} dias</TableCell>
                          <TableCell>{delivery.blockUntil}</TableCell>
                          <TableCell>{delivery.items.baskets}</TableCell>
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
                  <p className="text-sm text-gray-600">Membros: {selectedFamily.members} pessoas</p>
                  <p className="text-sm text-gray-600">CPF: {selectedFamily.cpf}</p>
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
                          max={currentInstitution?.availableBaskets || 1}
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
                  >
                    <Check className="h-4 w-4 mr-1" /> Confirmar Entrega
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
                  <p>{selectedDelivery.familyName}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500">Data da Entrega</p>
                  <p>{selectedDelivery.deliveryDate}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-500">Período de Bloqueio</p>
                  <p>{selectedDelivery.blockPeriod} dias</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500">Bloqueada até</p>
                  <p>{selectedDelivery.blockUntil}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-semibold text-gray-500">Itens Entregues</p>
                <div className="bg-gray-50 p-3 rounded-md mt-2">
                  <p><strong>Cestas básicas:</strong> {selectedDelivery.items.baskets}</p>
                  
                  {selectedDelivery.items.others.length > 0 && (
                    <>
                      <p className="mt-2"><strong>Outros itens:</strong></p>
                      <ul className="list-disc pl-5 mt-1">
                        {selectedDelivery.items.others.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
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
