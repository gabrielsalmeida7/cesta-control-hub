
import React from 'react';
import { Package, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import './FamilyTable.css';

export interface Family {
  id: number;
  name: string;
  cpf: string;
  address: string;
  members: number;
  lastDelivery: string | null;
  status: "active" | "blocked";
  blockedBy?: {
    id: number;
    name: string;
  };
  blockedUntil?: string;
  blockReason?: string;
  institutionIds: number[];
}

interface FamilyTableProps {
  families: Family[];
  onDelivery: (family: Family) => void;
  basketsAvailable: number;
  filterStatus: string;
  onFilterChange: (value: string) => void;
}

const FamilyTable: React.FC<FamilyTableProps> = ({ 
  families, 
  onDelivery, 
  basketsAvailable,
  filterStatus,
  onFilterChange
}) => {
  return (
    <div className="family-table-container">
      <div className="table-header">
        <h3 className="section-title">Famílias Disponíveis</h3>
        <div className="filter-controls">
          <Select 
            defaultValue={filterStatus} 
            onValueChange={onFilterChange}
          >
            <SelectTrigger className="filter-select">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Famílias</SelectItem>
              <SelectItem value="active">Famílias Ativas</SelectItem>
              <SelectItem value="blocked">Famílias Bloqueadas</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="search-container">
            <Search className="search-icon" />
            <Input
              placeholder="Buscar família..."
              className="search-input"
            />
          </div>
        </div>
      </div>
      
      <div className="table-wrapper">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Membros</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Última Entrega</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {families.length > 0 ? (
              families.map((family) => (
                <TableRow key={family.id}>
                  <TableCell className="font-medium">{family.name}</TableCell>
                  <TableCell>{family.cpf}</TableCell>
                  <TableCell>{family.members}</TableCell>
                  <TableCell>
                    {family.status === "active" ? (
                      <Badge className="active-badge">Ativa</Badge>
                    ) : (
                      <Badge className="blocked-badge">Bloqueada</Badge>
                    )}
                  </TableCell>
                  <TableCell>{family.lastDelivery || "Não há registros"}</TableCell>
                  <TableCell>
                    <div className="action-buttons">
                      {family.status === "active" ? (
                        <Button 
                          size="sm" 
                          onClick={() => onDelivery(family)}
                          disabled={basketsAvailable === 0}
                          className="deliver-button"
                        >
                          <Package className="button-icon" /> Entregar Cesta
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          disabled
                          title={`Bloqueada até ${family.blockedUntil}`}
                          className="blocked-button"
                        >
                          Bloqueada
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="empty-message">
                  Nenhuma família encontrada com os filtros selecionados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default FamilyTable;
