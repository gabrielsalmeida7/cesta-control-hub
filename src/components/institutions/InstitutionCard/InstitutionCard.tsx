
import React from 'react';
import { Edit, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import './InstitutionCard.css';

export interface Institution {
  id: number;
  name: string;
  address: string;
  phone: string;
  availableBaskets: number;
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

interface InstitutionCardProps {
  institution: Institution;
  onEdit: (institution: Institution) => void;
  onDetails: (institution: Institution) => void;
}

const InstitutionCard: React.FC<InstitutionCardProps> = ({ institution, onEdit, onDetails }) => {
  return (
    <Card className="institution-card">
      <CardHeader className={`${institution.color} card-header`}>
        <CardTitle>{institution.name}</CardTitle>
      </CardHeader>
      <CardContent className="card-content">
        <p className="card-field"><strong>Endereço:</strong> {institution.address}</p>
        <p className="card-field"><strong>Telefone:</strong> {institution.phone}</p>
        <p className="card-field"><strong>Cestas disponíveis:</strong> {institution.availableBaskets}</p>
        <div className="card-actions">
          <Button 
            variant="outline" 
            size="sm" 
            className="card-action-button"
            onClick={() => onEdit(institution)}
          >
            <Edit className="icon" /> Editar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="card-action-button"
            onClick={() => onDetails(institution)}
          >
            <Info className="icon" /> Detalhes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default InstitutionCard;
