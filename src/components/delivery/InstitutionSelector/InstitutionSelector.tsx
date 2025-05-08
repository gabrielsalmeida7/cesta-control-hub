
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import './InstitutionSelector.css';

export interface Institution {
  id: number;
  name: string;
  address: string;
  phone: string;
  availableBaskets: number;
}

interface InstitutionSelectorProps {
  institutions: Institution[];
  selectedId: number;
  onValueChange: (value: string) => void;
}

const InstitutionSelector: React.FC<InstitutionSelectorProps> = ({ 
  institutions, 
  selectedId, 
  onValueChange 
}) => {
  return (
    <div className="institution-selector">
      <label htmlFor="institution-select" className="selector-label">
        Selecionar Instituição
      </label>
      <Select
        value={selectedId.toString()}
        onValueChange={onValueChange}
      >
        <SelectTrigger className="selector-trigger">
          <SelectValue placeholder="Selecione uma instituição" />
        </SelectTrigger>
        <SelectContent>
          {institutions.map((institution) => (
            <SelectItem
              key={institution.id}
              value={institution.id.toString()}
            >
              {institution.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default InstitutionSelector;
