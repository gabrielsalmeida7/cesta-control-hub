
import Header from "@/components/Header";
import { Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Institutions = () => {
  // Mock data
  const username = "Gabriel Admin";
  const institutions = [
    { id: 1, name: "Centro Comunitário São José", address: "Rua das Flores, 123", phone: "(11) 9999-8888", deliveries: 42 },
    { id: 2, name: "Associação Bem-Estar", address: "Av. Principal, 456", phone: "(11) 7777-6666", deliveries: 37 },
    { id: 3, name: "Igreja Nossa Senhora", address: "Praça Central, 789", phone: "(11) 5555-4444", deliveries: 25 },
    { id: 4, name: "Instituto Esperança", address: "Rua dos Sonhos, 101", phone: "(11) 3333-2222", deliveries: 31 },
  ];

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <Header username={username} />
      
      <main className="pt-20 pb-8 px-4 md:px-8 max-w-[1400px] mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Instituições</h2>
            <Button className="bg-primary hover:bg-primary/90">
              <Building className="mr-2 h-4 w-4" /> Nova Instituição
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {institutions.map((institution) => (
              <Card key={institution.id} className="overflow-hidden">
                <CardHeader className="bg-secondary text-white">
                  <CardTitle>{institution.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="mb-2"><strong>Endereço:</strong> {institution.address}</p>
                  <p className="mb-2"><strong>Telefone:</strong> {institution.phone}</p>
                  <p className="mb-4"><strong>Cestas entregues:</strong> {institution.deliveries}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">Editar</Button>
                    <Button variant="outline" size="sm" className="flex-1">Detalhes</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Institutions;
