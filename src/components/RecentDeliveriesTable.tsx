
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDeliveries } from "@/hooks/useDeliveries";
import { Loader2 } from "lucide-react";

const RecentDeliveriesTable = () => {
  const { data: deliveries = [], isLoading } = useDeliveries();

  // Get recent deliveries (last 10)
  const recentDeliveries = useMemo(() => {
    if (!deliveries || deliveries.length === 0) return [];
    
    return deliveries
      .slice(0, 10)
      .map((delivery: any) => ({
        id: delivery.id,
        family: delivery.family?.name || delivery.family?.contact_person || 'N/A',
        date: delivery.delivery_date ? new Date(delivery.delivery_date).toLocaleDateString('pt-BR') : 'N/A',
        institution: delivery.institution?.name || 'N/A',
        quantity: 1 // Default quantity, pode ser ajustado se houver campo no schema
      }));
  }, [deliveries]);
  return (
    <Card className="shadow-md overflow-hidden">
      <div className="bg-primary text-white p-4">
        <h2 className="text-xl font-bold">Entregas Recentes</h2>
      </div>
      <div className="overflow-x-auto max-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : recentDeliveries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Nenhuma entrega recente encontrada</p>
          </div>
        ) : (
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
              {recentDeliveries.map((delivery) => (
                <TableRow key={delivery.id}>
                  <TableCell className="font-medium">{delivery.family}</TableCell>
                  <TableCell>{delivery.date}</TableCell>
                  <TableCell>{delivery.institution}</TableCell>
                  <TableCell className="text-right">{delivery.quantity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </Card>
  );
};

export default RecentDeliveriesTable;
