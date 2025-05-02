
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Sample data for the table
const deliveries = [
  { id: 1, family: 'Silva, Maria', date: '02/05/2023', institution: 'APAE', quantity: 2 },
  { id: 2, family: 'Santos, João', date: '30/04/2023', institution: 'Casa de Apoio', quantity: 1 },
  { id: 3, family: 'Oliveira, Ana', date: '28/04/2023', institution: 'Lar dos Idosos', quantity: 3 },
  { id: 4, family: 'Souza, Pedro', date: '25/04/2023', institution: 'APAE', quantity: 2 },
  { id: 5, family: 'Ferreira, Luiza', date: '22/04/2023', institution: 'Casa de Apoio', quantity: 1 },
  { id: 6, family: 'Costa, Carlos', date: '20/04/2023', institution: 'Lar dos Idosos', quantity: 2 },
  { id: 7, family: 'Pereira, Mariana', date: '18/04/2023', institution: 'APAE', quantity: 1 },
  { id: 8, family: 'Alves, Roberto', date: '15/04/2023', institution: 'Casa de Apoio', quantity: 3 },
];

const RecentDeliveriesTable = () => {
  return (
    <Card className="shadow-md overflow-hidden">
      <div className="bg-primary text-white p-4">
        <h2 className="text-xl font-bold">Entregas Recentes</h2>
      </div>
      <div className="overflow-x-auto max-h-[400px]">
        <Table>
          <TableHeader className="bg-secondary sticky top-0">
            <TableRow>
              <TableHead className="font-semibold text-primary">Família</TableHead>
              <TableHead className="font-semibold text-primary">Data da Entrega</TableHead>
              <TableHead className="font-semibold text-primary">Instituição</TableHead>
              <TableHead className="font-semibold text-primary text-right">Quantidade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deliveries.map((delivery) => (
              <TableRow key={delivery.id}>
                <TableCell className="font-medium">{delivery.family}</TableCell>
                <TableCell>{delivery.date}</TableCell>
                <TableCell>{delivery.institution}</TableCell>
                <TableCell className="text-right">{delivery.quantity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default RecentDeliveriesTable;
