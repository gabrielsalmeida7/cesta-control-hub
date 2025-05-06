
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Building, Edit, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

// Interface for our institution data model
interface Institution {
  id: number;
  name: string;
  address: string; 
  phone: string;
  deliveries: number;
  color: string;
  inventory?: {
    baskets: number;
    milk: number;
    rice: number;
    beans: number;
    vegetables: number;
    peppers: number;
    others: string[];
  };
}

const Institutions = () => {
  // Mock data
  const username = "Gabriel Admin";
  
  // State for dialog controls
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);

  // Setup form
  const form = useForm<Institution>({
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      deliveries: 0,
    }
  });

  // Array of institutions with their information and expanded inventory data
  const [institutions, setInstitutions] = useState<Institution[]>([
    { 
      id: 1, 
      name: "Centro Comunitário São José", 
      address: "Rua das Flores, 123", 
      phone: "(11) 9999-8888", 
      deliveries: 42, 
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
      deliveries: 37, 
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
      deliveries: 25, 
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
      deliveries: 31, 
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
    // Reset form with institution values
    form.reset({
      id: institution.id,
      name: institution.name,
      address: institution.address,
      phone: institution.phone,
      deliveries: institution.deliveries,
      color: institution.color
    });
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
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
      {/* Header component with username */}
      <Header username={username} />
      
      <main className="pt-20 pb-8 px-4 md:px-8 max-w-[1400px] mx-auto flex-grow">
        <div className="mb-8">
          {/* Page title and add new institution button */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Instituições</h2>
            <Button className="bg-primary hover:bg-primary/90">
              <Building className="mr-2 h-4 w-4" /> Nova Instituição
            </Button>
          </div>
          
          {/* Grid layout for institution cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {institutions.map((institution) => (
              <Card key={institution.id} className="overflow-hidden">
                {/* Card header with institution name */}
                <CardHeader className={`${institution.color} text-white`}>
                  <CardTitle>{institution.name}</CardTitle>
                </CardHeader>
                {/* Card content with institution details */}
                <CardContent className="pt-4">
                  <p className="mb-2"><strong>Endereço:</strong> {institution.address}</p>
                  <p className="mb-2"><strong>Telefone:</strong> {institution.phone}</p>
                  <p className="mb-4"><strong>Cestas entregues:</strong> {institution.deliveries}</p>
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
            ))}
          </div>
        </div>
      </main>

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
              
              <FormField
                control={form.control}
                name="deliveries"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cestas Entregues</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        value={field.value} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} 
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
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Salvar Alterações</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Details Institution Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              Detalhes da Instituição: {selectedInstitution?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedInstitution && selectedInstitution.inventory && (
            <div className="py-4">
              <h3 className="text-lg font-medium mb-4">Inventário de Alimentos</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Cestas Básicas</TableCell>
                    <TableCell className="text-right">{selectedInstitution.inventory.baskets}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Leite</TableCell>
                    <TableCell className="text-right">{selectedInstitution.inventory.milk} litros</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Arroz</TableCell>
                    <TableCell className="text-right">{selectedInstitution.inventory.rice} kg</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Feijão</TableCell>
                    <TableCell className="text-right">{selectedInstitution.inventory.beans} kg</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Hortaliças</TableCell>
                    <TableCell className="text-right">{selectedInstitution.inventory.vegetables} kg</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Pimentão</TableCell>
                    <TableCell className="text-right">{selectedInstitution.inventory.peppers} kg</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              
              <div className="mt-4">
                <h4 className="font-medium mb-2">Outros Itens:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedInstitution.inventory.others.map((item, index) => (
                    <span 
                      key={index} 
                      className="bg-slate-100 px-2 py-1 rounded-md text-sm"
                    >
                      {item}
                    </span>
                  ))}
                </div>
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
