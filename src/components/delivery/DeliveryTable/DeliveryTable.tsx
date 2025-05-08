
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import './DeliveryTable.css';

export interface Delivery {
  id: number;
  familyId: number;
  familyName: string;
  institutionId: number;
  institutionName: string;
  deliveryDate: string;
  blockPeriod: number;
  blockUntil: string;
  items: {
    baskets: number;
    others: string[];
  };
}

interface DeliveryTableProps {
  deliveries: Delivery[];
  onViewDetails: (delivery: Delivery) => void;
}

const DeliveryTable: React.FC<DeliveryTableProps> = ({ deliveries, onViewDetails }) => {
  return (
    <div className="delivery-table-container">
      <h3 className="section-title">Entregas Recentes</h3>
      
      <div className="table-wrapper">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Família</TableHead>
              <TableHead>Data da Entrega</TableHead>
              <TableHead>Período de Bloqueio</TableHead>
              <TableHead>Desbloqueio em</TableHead>
              <TableHead>Cestas</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deliveries.length > 0 ? (
              deliveries.map((delivery) => (
                <TableRow key={delivery.id}>
                  <TableCell className="font-medium">{delivery.familyName}</TableCell>
                  <TableCell>{delivery.deliveryDate}</TableCell>
                  <TableCell>{delivery.blockPeriod} dias</TableCell>
                  <TableCell>{delivery.blockUntil}</TableCell>
                  <TableCell>{delivery.items.baskets}</TableCell>
                  <TableCell>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onViewDetails(delivery)}
                      className="details-button"
                    >
                      Detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="empty-message">
                  Nenhuma entrega registrada por esta instituição.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DeliveryTable;
