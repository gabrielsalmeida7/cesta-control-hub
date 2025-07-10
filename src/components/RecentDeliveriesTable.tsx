
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminRecentDeliveries } from "@/hooks/useAdminRecentDeliveries";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

const RecentDeliveriesTable = () => {
  const { profile } = useAuth();
  const { data: deliveries, isLoading } = useAdminRecentDeliveries();

  if (profile?.role !== 'admin') {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="shadow-md overflow-hidden">
        <div className="bg-primary text-white p-4">
          <h2 className="text-xl font-bold">Entregas Recentes</h2>
        </div>
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </Card>
    );
  }
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
            {deliveries && deliveries.length > 0 ? (
              deliveries.map((delivery) => (
                <TableRow key={delivery.id}>
                  <TableCell className="font-medium">
                    {delivery.family?.name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {delivery.delivery_date 
                      ? format(new Date(delivery.delivery_date), 'dd/MM/yyyy')
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell>{delivery.institution?.name || 'N/A'}</TableCell>
                  <TableCell className="text-right">1</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Nenhuma entrega encontrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default RecentDeliveriesTable;
