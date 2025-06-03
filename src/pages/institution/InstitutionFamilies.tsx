
import React, { useState } from 'react';
import Header from '@/components/Header';
import InstitutionNavigationButtons from '@/components/InstitutionNavigationButtons';
import { Search, Eye, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface Family {
  id: string;
  family_name: string;
  main_cpf: string;
  address: string;
  members_count: number;
  is_blocked: boolean;
  blocked_until?: string;
  block_reason?: string;
  blocked_by_institution?: string;
  last_delivery_date?: string;
  last_delivery_institution?: string;
}

const InstitutionFamilies = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Mock data - Em uma implementação real, viria do Supabase
  const families: Family[] = [
    {
      id: '1',
      family_name: 'Família Silva',
      main_cpf: '123.456.789-10',
      address: 'Rua das Flores, 123',
      members_count: 4,
      is_blocked: true,
      blocked_until: '2024-07-15',
      block_reason: 'Recebeu cesta básica',
      blocked_by_institution: 'Centro Comunitário São José',
      last_delivery_date: '2024-06-15',
      last_delivery_institution: 'Centro Comunitário São José'
    },
    {
      id: '2', 
      family_name: 'Família Santos',
      main_cpf: '987.654.321-00',
      address: 'Av. Principal, 456',
      members_count: 3,
      is_blocked: false,
      last_delivery_date: '2024-05-10',
      last_delivery_institution: 'Associação Bem-Estar'
    },
    {
      id: '3',
      family_name: 'Família Oliveira', 
      main_cpf: '456.789.123-45',
      address: 'Rua do Campo, 789',
      members_count: 5,
      is_blocked: true,
      blocked_until: '2024-07-20',
      block_reason: 'Recebeu cesta básica',
      blocked_by_institution: 'Igreja Nossa Senhora',
      last_delivery_date: '2024-06-20',
      last_delivery_institution: 'Igreja Nossa Senhora'
    }
  ];

  const filteredFamilies = families.filter(family =>
    family.family_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    family.main_cpf.includes(searchTerm)
  );

  const getStatusBadge = (family: Family) => {
    if (family.is_blocked) {
      const daysRemaining = family.blocked_until ? 
        Math.ceil((new Date(family.blocked_until).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
      
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Bloqueada ({daysRemaining} dias)
        </Badge>
      );
    }
    
    return (
      <Badge variant="default" className="flex items-center gap-1 bg-green-500">
        <CheckCircle className="h-3 w-3" />
        Liberada
      </Badge>
    );
  };

  const handleViewDetails = (family: Family) => {
    setSelectedFamily(family);
    setIsDetailsOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <InstitutionNavigationButtons />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Famílias Cadastradas
            </h2>
            <p className="text-gray-600">
              Visualize o status das famílias e histórico de entregas
            </p>
          </div>

          {/* Barra de pesquisa */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome da família ou CPF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total de Famílias</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{families.length}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Famílias Liberadas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">
                  {families.filter(f => !f.is_blocked).length}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Famílias Bloqueadas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-red-600">
                  {families.filter(f => f.is_blocked).length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de famílias */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Famílias</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome da Família</TableHead>
                    <TableHead>CPF Principal</TableHead>
                    <TableHead>Membros</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Última Entrega</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFamilies.map((family) => (
                    <TableRow key={family.id}>
                      <TableCell className="font-medium">{family.family_name}</TableCell>
                      <TableCell>{family.main_cpf}</TableCell>
                      <TableCell>{family.members_count}</TableCell>
                      <TableCell>{getStatusBadge(family)}</TableCell>
                      <TableCell>
                        {family.last_delivery_date ? (
                          <div>
                            <p className="text-sm">{new Date(family.last_delivery_date).toLocaleDateString('pt-BR')}</p>
                            <p className="text-xs text-gray-500">{family.last_delivery_institution}</p>
                          </div>
                        ) : (
                          <span className="text-gray-500">Nunca</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewDetails(family)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Dialog de detalhes */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalhes da Família: {selectedFamily?.family_name}</DialogTitle>
          </DialogHeader>
          
          {selectedFamily && (
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nome da Família</p>
                  <p className="font-medium">{selectedFamily.family_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">CPF Principal</p>
                  <p className="font-medium">{selectedFamily.main_cpf}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Endereço</p>
                  <p className="font-medium">{selectedFamily.address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Número de Membros</p>
                  <p className="font-medium">{selectedFamily.members_count}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Status Atual</p>
                {getStatusBadge(selectedFamily)}
              </div>
              
              {selectedFamily.is_blocked && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">Informações do Bloqueio</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Motivo:</strong> {selectedFamily.block_reason}</p>
                    <p><strong>Bloqueada por:</strong> {selectedFamily.blocked_by_institution}</p>
                    <p><strong>Bloqueada até:</strong> {selectedFamily.blocked_until ? new Date(selectedFamily.blocked_until).toLocaleDateString('pt-BR') : 'N/A'}</p>
                  </div>
                </div>
              )}
              
              {selectedFamily.last_delivery_date && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Última Entrega</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Data:</strong> {new Date(selectedFamily.last_delivery_date).toLocaleDateString('pt-BR')}</p>
                    <p><strong>Instituição:</strong> {selectedFamily.last_delivery_institution}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setIsDetailsOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InstitutionFamilies;
