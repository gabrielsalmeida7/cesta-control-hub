
import Header from "@/components/Header";
import { Users, UserPlus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const Families = () => {
  // Mock data
  const username = "Admin Silva";
  const families = [
    { id: 1, name: "Silva", cpf: "123.456.789-00", address: "Rua A, 123", members: 4, lastDelivery: "10/04/2025" },
    { id: 2, name: "Santos", cpf: "987.654.321-00", address: "Rua B, 456", members: 3, lastDelivery: "05/04/2025" },
    { id: 3, name: "Oliveira", cpf: "456.789.123-00", address: "Rua C, 789", members: 5, lastDelivery: "01/04/2025" },
    { id: 4, name: "Pereira", cpf: "789.123.456-00", address: "Rua D, 101", members: 2, lastDelivery: "28/03/2025" },
    { id: 5, name: "Costa", cpf: "321.654.987-00", address: "Rua E, 202", members: 6, lastDelivery: "25/03/2025" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <Header username={username} />
      
      <main className="pt-20 pb-8 px-4 md:px-8 max-w-[1400px] mx-auto">
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
                      <TableCell>{family.lastDelivery}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">Editar</Button>
                          <Button variant="outline" size="sm">Detalhes</Button>
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
    </div>
  );
};

export default Families;
