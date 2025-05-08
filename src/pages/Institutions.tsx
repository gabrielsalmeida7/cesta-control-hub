
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "@/components/ui/page-header/PageHeader";
import InstitutionCard, { Institution } from "@/components/institutions/InstitutionCard/InstitutionCard";
import InstitutionEditForm from "@/components/institutions/InstitutionEditForm/InstitutionEditForm";
import InstitutionDetails from "@/components/institutions/InstitutionDetails/InstitutionDetails";
import './Institutions.css';

const Institutions = () => {
  // Mock data
  const username = "Gabriel Admin";
  const isAdmin = true; // Mock user role - would be from authentication context in a real app
  
  // State for dialog controls
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);

  // Array of institutions with their information and expanded inventory data
  const [institutions, setInstitutions] = useState<Institution[]>([
    { 
      id: 1, 
      name: "Centro Comunitário São José", 
      address: "Rua das Flores, 123", 
      phone: "(11) 9999-8888", 
      availableBaskets: 42, 
      color: "bg-primary",
      inventory: {
        baskets: 42,
        milk: 56,
        rice: 80,
        beans: 75,
        vegetables: 65,
        peppers: 30,
        others: ["Óleo", "Sal", "Açúcar"]
      }
    },
    { 
      id: 2, 
      name: "Associação Bem-Estar", 
      address: "Av. Principal, 456", 
      phone: "(11) 7777-6666", 
      availableBaskets: 37, 
      color: "bg-green-500",
      inventory: {
        baskets: 37,
        milk: 43,
        rice: 60,
        beans: 55,
        vegetables: 40,
        peppers: 25,
        others: ["Macarrão", "Café", "Farinha"]
      }
    },
    { 
      id: 3, 
      name: "Igreja Nossa Senhora", 
      address: "Praça Central, 789", 
      phone: "(11) 5555-4444", 
      availableBaskets: 25, 
      color: "bg-red-500",
      inventory: {
        baskets: 25,
        milk: 32,
        rice: 45,
        beans: 40,
        vegetables: 30,
        peppers: 15,
        others: ["Biscoitos", "Achocolatado"]
      }
    },
    { 
      id: 4, 
      name: "Instituto Esperança", 
      address: "Rua dos Sonhos, 101", 
      phone: "(11) 3333-2222", 
      availableBaskets: 31, 
      color: "bg-primary/80",
      inventory: {
        baskets: 31,
        milk: 40,
        rice: 50,
        beans: 45,
        vegetables: 35,
        peppers: 20,
        others: ["Ovos", "Frutas", "Fubá"]
      }
    },
  ]);

  // Function to handle opening the edit dialog
  const handleEdit = (institution: Institution) => {
    setSelectedInstitution(institution);
    setIsEditDialogOpen(true);
  };

  // Function to save edited institution
  const onSubmit = (data: Institution) => {
    // Update institutions array with edited data
    const updatedInstitutions = institutions.map(inst => 
      inst.id === data.id ? { ...inst, ...data } : inst
    );
    setInstitutions(updatedInstitutions);
    setIsEditDialogOpen(false);
    console.log("Dados salvos:", data);
  };

  // Function to handle opening the details dialog
  const handleDetails = (institution: Institution) => {
    setSelectedInstitution(institution);
    setIsDetailsDialogOpen(true);
  };

  return (
    <div className="institutions-page">
      {/* Header component with username */}
      <Header username={username} />
      
      <main className="main-content">
        {/* Page title and add new institution button */}
        <PageHeader title="Instituições">
          <Button className="add-button">
            <Building className="button-icon" /> Nova Instituição
          </Button>
        </PageHeader>
        
        {/* Grid layout for institution cards */}
        <div className="institutions-grid">
          {institutions.map((institution) => (
            <InstitutionCard 
              key={institution.id} 
              institution={institution}
              onEdit={handleEdit}
              onDetails={handleDetails}
            />
          ))}
        </div>
      </main>

      {/* Edit Institution Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Instituição</DialogTitle>
          </DialogHeader>
          
          {selectedInstitution && (
            <InstitutionEditForm 
              institution={selectedInstitution}
              onSubmit={onSubmit}
              onCancel={() => setIsEditDialogOpen(false)}
              isAdmin={isAdmin}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Details Institution Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Detalhes da Instituição: {selectedInstitution?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedInstitution && (
            <InstitutionDetails 
              institution={selectedInstitution}
              onClose={() => setIsDetailsDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Institutions;
