
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Institution } from '../InstitutionCard/InstitutionCard';
import './InstitutionDetails.css';

interface InstitutionDetailsProps {
  institution: Institution;
  onClose: () => void;
}

const InstitutionDetails: React.FC<InstitutionDetailsProps> = ({ institution, onClose }) => {
  if (!institution.inventory) {
    return (
      <div className="details-container">
        <p>Nenhuma informação de inventário disponível.</p>
        <DialogFooter>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </div>
    );
  }

  return (
    <div className="details-container">
      <h3 className="inventory-title">Inventário de Alimentos</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead className="text-right">Quantidade</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Cestas Básicas</TableCell>
            <TableCell className="text-right">{institution.inventory.baskets}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Leite</TableCell>
            <TableCell className="text-right">{institution.inventory.milk} litros</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Arroz</TableCell>
            <TableCell className="text-right">{institution.inventory.rice} kg</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Feijão</TableCell>
            <TableCell className="text-right">{institution.inventory.beans} kg</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Hortaliças</TableCell>
            <TableCell className="text-right">{institution.inventory.vegetables} kg</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Pimentão</TableCell>
            <TableCell className="text-right">{institution.inventory.peppers} kg</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      
      <div className="other-items">
        <h4 className="other-items-title">Outros Itens:</h4>
        <div className="items-tags">
          {institution.inventory.others.map((item, index) => (
            <span 
              key={index} 
              className="item-tag"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
      
      <DialogFooter>
        <Button 
          onClick={onClose}
        >
          Fechar
        </Button>
      </DialogFooter>
    </div>
  );
};

export default InstitutionDetails;
