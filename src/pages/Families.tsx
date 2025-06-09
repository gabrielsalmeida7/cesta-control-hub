import Header from "@/components/Header";
import NavigationButtons from "@/components/NavigationButtons";
import Footer from "@/components/Footer";
import { Users, UserPlus, Search, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

// Updated interface for families with blocking information
interface Family {
  id: number;
  name: string;
  cpf: string;
  address: string;
  members: number;
  lastDelivery: string;
  status: "active" | "blocked";
  blockedBy?: {
    id: number;
    name: string;
  };
  blockedUntil?: string;
  blockReason?: string;
}

const Families = () => {
  // Mock data
  const isAdmin = true; // Simulating admin privileges

  // Dialog states
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isUnblockDialogOpen, setIsUnblockDialogOpen] = useState(false);

  // Mock family data with block status
  const [families, setFamilies] = useState<Family[]>([
    { 
      id: 1, 
      name: "Silva", 
      cpf: "123.456.789-00", 
      address: "Rua A, 123", 
      members: 4, 
      lastDelivery: "10/04/2025",
      status: "active"
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
      blockReason: "Recebeu cesta básica"
    },
    { 
      id: 3, 
      name: "Oliveira", 
      cpf: "456.789.123-00", 
      address: "Rua C, 789", 
      members: 5, 
      lastDelivery: "01/04/2025",
      status: "active"
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
      blockReason: "Recebeu cesta básica"
    },
    { 
      id: 5, 
      name: "Costa", 
      cpf: "321.654.987-00", 
      address: "Rua E, 202", 
      members: 6, 
      lastDelivery: "25/03/2025",
      status: "active"
    },
  ]);

  // Function to unblock a family
  const handleUnblock = (family: Family) => {
    if (!isAdmin) return;
    
    setSelectedFamily(family);
    setIsUnblockDialogOpen(true);
  };

  // Function to confirm family unblock
  const confirmUnblock = () => {
    if (!selectedFamily) return;
    
    const updatedFamilies = families.map(f => {
      if (f.id === selectedFamily.id) {
        return {
          ...f,
          status: "active" as const,
          blockedBy: undefined,
          blockedUntil: undefined,
          blockReason: undefined
        };
      }
      return f;
    });
    
    setFamilies(updatedFamilies);
    setIsUnblockDialogOpen(false);
    toast({
      title: "Família desbloqueada",
      description: `A família ${selectedFamily.name} foi desbloqueada com sucesso.`
    });
  };

  // Function to view family details
  const handleViewDetails = (family: Family) => {
    setSelectedFamily(family);
    setIsDetailsOpen(true);
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
              <Button className="bg-primary hover:bg-primary/90">
                <UserPlus className="mr-2 h-4 w-4" /> Nova Família
              </Button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>Pessoas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Última Entrega</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {families.map((family) => (
                    <TableRow key={family.id}>
                      <TableCell className="font-medium">{family.name}</TableCell>
                      <TableCell>{family.cpf}</TableCell>
                      <TableCell>{family.address}</TableCell>
                      <TableCell>{family.members}</TableCell>
                      <TableCell>
                        {family.status === "active" ? (
                          <Badge className="bg-green-500">Ativa</Badge>
                        ) : (
                          <Badge className="bg-red-500">
                            <Lock className="h-3 w-3 mr-1" /> 
                            Bloqueada
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{family.lastDelivery}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">Editar</Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewDetails(family)}
                          >
                            Detalhes
                          </Button>
                          {isAdmin && family.status === "blocked" && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleUnblock(family)}
                              className="border-red-500 text-red-500 hover:bg-red-50"
                            >
                              <Unlock className="h-3 w-3 mr-1" /> Desbloquear
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                  <p className="text-sm font-semibold text-gray-500">Nome</p>
                  <p>{selectedFamily.name}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500">CPF</p>
                  <p>{selectedFamily.cpf}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-semibold text-gray-500">Endereço</p>
                <p>{selectedFamily.address}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-500">Membros</p>
                  <p>{selectedFamily.members} pessoas</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500">Última Entrega</p>
                  <p>{selectedFamily.lastDelivery}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-semibold text-gray-500">Status</p>
                <div className="mt-1">
                  {selectedFamily.status === "active" ? (
                    <Badge className="bg-green-500">Ativa</Badge>
                  ) : (
                    <Badge className="bg-red-500">Bloqueada</Badge>
                  )}
                </div>
              </div>
              
              {selectedFamily.status === "blocked" && (
                <>
                  <div>
                    <p className="text-sm font-semibold text-gray-500">Bloqueada por</p>
                    <p>{selectedFamily.blockedBy?.name}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-500">Bloqueada até</p>
                      <p>{selectedFamily.blockedUntil}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-500">Motivo</p>
                      <p>{selectedFamily.blockReason}</p>
                    </div>
                  </div>
                </>
              )}
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

      <Footer />
    </div>
  );
};

export default Families;
