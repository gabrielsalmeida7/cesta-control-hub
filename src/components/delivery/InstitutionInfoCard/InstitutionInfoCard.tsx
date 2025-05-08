
import React from 'react';
import { Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Institution } from '../InstitutionSelector/InstitutionSelector';
import './InstitutionInfoCard.css';

interface InstitutionInfoCardProps {
  institution: Institution;
}

const InstitutionInfoCard: React.FC<InstitutionInfoCardProps> = ({ institution }) => {
  return (
    <Card className="institution-info-card">
      <CardHeader className="card-header">
        <CardTitle>Instituição Atual</CardTitle>
      </CardHeader>
      <CardContent className="card-content">
        <p className="institution-name">{institution.name}</p>
        <p className="institution-address">{institution.address}</p>
        <p className="institution-phone">{institution.phone}</p>
        <div className="badge-container">
          <Badge className="baskets-badge">
            <Package className="badge-icon" />
            Cestas Disponíveis: {institution.availableBaskets}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default InstitutionInfoCard;
