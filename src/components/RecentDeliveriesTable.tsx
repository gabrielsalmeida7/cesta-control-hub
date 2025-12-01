
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminRecentDeliveries } from "@/hooks/useAdminRecentDeliveries";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { Package } from "lucide-react";

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
      <div className="bg-primary text-white p-3 md:p-4">
        <h2 className="text-lg md:text-xl font-bold">Entregas Recentes</h2>
      </div>
      <div className="overflow-x-auto max-h-[400px]">
        <Table>
          <TableHeader className="bg-secondary sticky top-0">
            <TableRow>
              <TableHead className="font-semibold text-primary text-xs md:text-sm">Família</TableHead>
              <TableHead className="font-semibold text-primary text-xs md:text-sm">Data da Entrega</TableHead>
              <TableHead className="font-semibold text-primary text-xs md:text-sm hidden sm:table-cell">Instituição</TableHead>
              <TableHead className="font-semibold text-primary text-right text-xs md:text-sm">Cestas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deliveries && deliveries.length > 0 ? (
              deliveries.map((delivery) => (
                <TableRow key={delivery.id}>
                  <TableCell className="font-medium text-xs md:text-sm">
                    {delivery.family?.name || 'N/A'}
                  </TableCell>
                  <TableCell className="text-xs md:text-sm">
                    {delivery.delivery_date 
                      ? format(new Date(delivery.delivery_date), 'dd/MM/yyyy')
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell className="text-xs md:text-sm hidden sm:table-cell">{delivery.institution?.name || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Package className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                      <span className="font-medium text-xs md:text-sm">1</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8 text-sm">
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
