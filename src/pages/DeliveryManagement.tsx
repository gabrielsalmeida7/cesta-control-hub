
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import PageHeader from "@/components/ui/page-header/PageHeader";
import InstitutionSelector, { Institution } from "@/components/delivery/InstitutionSelector/InstitutionSelector";
import InstitutionInfoCard from "@/components/delivery/InstitutionInfoCard/InstitutionInfoCard";
import FamilyTable, { Family } from "@/components/delivery/FamilyTable/FamilyTable";
import DeliveryTable, { Delivery } from "@/components/delivery/DeliveryTable/DeliveryTable";
import DeliveryForm from "@/components/delivery/DeliveryForm/DeliveryForm";
import DeliveryDetails from "@/components/delivery/DeliveryDetails/DeliveryDetails";
import './DeliveryManagement.css';

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
  
  // Mock data for families
  const [families, setFamilies] = useState<Family[]>([
    { 
      id: 1, 
      name: "Silva", 
      cpf: "123.456.789-00", 
      address: "Rua A, 123", 
      members: 4, 
      lastDelivery: "10/04/2025",
      status: "active",
      institutionIds: [1, 3]
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
      institutionIds: [1, 2]
    },
    { 
      id: 3, 
      name: "Oliveira", 
      cpf: "456.789.123-00", 
      address: "Rua C, 789", 
      members: 5, 
      lastDelivery: "01/04/2025",
      status: "active",
      institutionIds: [1, 2, 4]
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
      institutionIds: [2, 3]
    },
    { 
      id: 5, 
      name: "Costa", 
      cpf: "321.654.987-00", 
      address: "Rua E, 202", 
      members: 6, 
      lastDelivery: null,
      status: "active",
      institutionIds: [1, 3, 4]
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
  
  // Open delivery dialog for a family
  const handleDelivery = (family: Family) => {
    setSelectedFamily(family);
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
  const onSubmit = (data: any) => {
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
        others: data.otherItems ? data.otherItems.split(',').map((item: string) => item.trim()) : []
      }
    };
    
    // Add delivery to records
    setDeliveries([...deliveries, newDelivery]);
    
    // Update available baskets count (would be done through API in real app)
    
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
    <div className="delivery-management-page">
      <Header username={username} />
      
      <main className="main-content">
        <PageHeader title="Gerenciamento de Entregas" />
        
        {/* Institution Selection for Admin */}
        {isAdmin && (
          <InstitutionSelector 
            institutions={institutions}
            selectedId={selectedInstitutionId}
            onValueChange={handleInstitutionChange}
          />
        )}
        
        {/* Institution Info Card */}
        {currentInstitution && (
          <InstitutionInfoCard institution={currentInstitution} />
        )}
        
        {/* Eligible Families Section */}
        {currentInstitution && (
          <FamilyTable 
            families={filteredFamilies}
            onDelivery={handleDelivery}
            basketsAvailable={currentInstitution.availableBaskets}
            filterStatus={filterStatus}
            onFilterChange={setFilterStatus}
          />
        )}
        
        {/* Recent Deliveries Section */}
        <DeliveryTable 
          deliveries={filteredDeliveries}
          onViewDetails={handleViewDeliveryDetails}
        />
      </main>
      
      {/* Delivery Dialog */}
      <Dialog open={isDeliveryDialogOpen} onOpenChange={setIsDeliveryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Entrega de Cesta</DialogTitle>
          </DialogHeader>
          
          {selectedFamily && currentInstitution && (
            <DeliveryForm 
              family={selectedFamily}
              maxBaskets={currentInstitution.availableBaskets}
              onSubmit={onSubmit}
              onCancel={() => setIsDeliveryDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delivery Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Entrega</DialogTitle>
          </DialogHeader>
          
          {selectedDelivery && (
            <DeliveryDetails 
              delivery={selectedDelivery}
              onClose={() => setIsDetailsDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
};

export default DeliveryManagement;
