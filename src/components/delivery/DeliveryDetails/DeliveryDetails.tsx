
import React from 'react';
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Delivery } from '../DeliveryTable/DeliveryTable';
import './DeliveryDetails.css';

interface DeliveryDetailsProps {
  delivery: Delivery;
  onClose: () => void;
}

const DeliveryDetails: React.FC<DeliveryDetailsProps> = ({ delivery, onClose }) => {
  return (
    <div className="delivery-details">
      <div className="details-grid">
        <div className="detail-group">
          <p className="detail-label">Família</p>
          <p className="detail-value">{delivery.familyName}</p>
        </div>
        <div className="detail-group">
          <p className="detail-label">Data da Entrega</p>
          <p className="detail-value">{delivery.deliveryDate}</p>
        </div>
      </div>
      
      <div className="details-grid">
        <div className="detail-group">
          <p className="detail-label">Período de Bloqueio</p>
          <p className="detail-value">{delivery.blockPeriod} dias</p>
        </div>
        <div className="detail-group">
          <p className="detail-label">Bloqueada até</p>
          <p className="detail-value">{delivery.blockUntil}</p>
        </div>
      </div>
      
      <div>
        <p className="detail-label">Itens Entregues</p>
        <div className="items-container">
          <p><strong>Cestas básicas:</strong> {delivery.items.baskets}</p>
          
          {delivery.items.others.length > 0 && (
            <>
              <p className="other-items-label"><strong>Outros itens:</strong></p>
              <ul className="items-list">
                {delivery.items.others.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
      
      <DialogFooter>
        <Button onClick={onClose}>Fechar</Button>
      </DialogFooter>
    </div>
  );
};

export default DeliveryDetails;
