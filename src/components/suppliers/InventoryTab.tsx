import React, { useState } from 'react';
import { useInventory } from '@/hooks/useInventory';
import { useInstitutions } from '@/hooks/useInstitutions';
import { useAuth } from '@/hooks/useAuth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateBrasilia } from '@/utils/dateFormat';

interface InventoryTabProps {
  institutionId?: string;
}

const InventoryTab = ({ institutionId }: InventoryTabProps) => {
  const { profile } = useAuth();
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string | undefined>(institutionId);
  const { data: institutions = [] } = useInstitutions();
  const { data: inventory = [], isLoading } = useInventory(selectedInstitutionId);

  const isAdmin = profile?.role === 'admin';

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Estoque</h2>
        {isAdmin && (
          <Select
            value={selectedInstitutionId || 'all'}
            onValueChange={(value) => setSelectedInstitutionId(value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Selecione uma instituição" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Instituições</SelectItem>
              {institutions.map((inst) => (
                <SelectItem key={inst.id} value={inst.id}>
                  {inst.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Unidade</TableHead>
                {isAdmin && <TableHead>Instituição</TableHead>}
                <TableHead>Última Movimentação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 5 : 4} className="text-center py-8 text-gray-500">
                    Nenhum item em estoque
                  </TableCell>
                </TableRow>
              ) : (
                inventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.product?.name || 'Produto não encontrado'}
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.product?.unit || '-'}</TableCell>
                    {isAdmin && (
                      <TableCell>{item.institution?.name || '-'}</TableCell>
                    )}
                    <TableCell>
                      {item.last_movement_date
                        ? formatDateBrasilia(item.last_movement_date)
                        : 'Nunca'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default InventoryTab;

