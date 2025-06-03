
import React, { useState } from 'react';
import Header from '@/components/Header';
import InstitutionNavigationButtons from '@/components/InstitutionNavigationButtons';
import { Calendar, Download, Package, Users, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import DashboardCard from '@/components/DashboardCard';

interface DeliveryReport {
  id: string;
  delivery_date: string;
  family_name: string;
  family_cpf: string;
  items_delivered: string[];
  blocking_period: number;
  notes?: string;
}

const InstitutionReports = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // Mock data - entregas feitas pela instituição
  const deliveries: DeliveryReport[] = [
    {
      id: '1',
      delivery_date: '2024-06-15',
      family_name: 'Família Silva',
      family_cpf: '123.456.789-10',
      items_delivered: ['Cesta Básica', 'Leite (2L)', 'Óleo (1L)'],
      blocking_period: 30,
      notes: 'Entrega realizada normalmente'
    },
    {
      id: '2',
      delivery_date: '2024-06-10',
      family_name: 'Família Oliveira',
      family_cpf: '456.789.123-45',
      items_delivered: ['Cesta Básica', 'Arroz (5kg)'],
      blocking_period: 30
    },
    {
      id: '3',
      delivery_date: '2024-06-05',
      family_name: 'Família Costa',
      family_cpf: '321.654.987-88',
      items_delivered: ['Cesta Básica'],
      blocking_period: 15,
      notes: 'Família com urgência'
    }
  ];

  const filteredDeliveries = deliveries.filter(delivery => {
    if (!startDate && !endDate) return true;
    
    const deliveryDate = new Date(delivery.delivery_date);
    const start = startDate ? new Date(startDate) : new Date('1900-01-01');
    const end = endDate ? new Date(endDate) : new Date('2100-12-31');
    
    return deliveryDate >= start && deliveryDate <= end;
  });

  const totalDeliveries = filteredDeliveries.length;
  const totalFamilies = new Set(filteredDeliveries.map(d => d.family_cpf)).size;
  const totalItems = filteredDeliveries.reduce((acc, d) => acc + d.items_delivered.length, 0);

  const exportReport = () => {
    // Aqui seria implementada a exportação do relatório
    console.log('Exportando relatório...', filteredDeliveries);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <InstitutionNavigationButtons />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Relatórios de Entregas
            </h2>
            <p className="text-gray-600">
              Acompanhe as entregas realizadas pela sua instituição
            </p>
          </div>

          {/* Filtros */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Data Inicial</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Data Final</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={exportReport} variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Relatório
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas do Período */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <DashboardCard
              title="Total de Entregas"
              value={totalDeliveries.toString()}
              description="Entregas realizadas no período"
              icon={<Package className="h-6 w-6" />}
            />
            
            <DashboardCard
              title="Famílias Atendidas"
              value={totalFamilies.toString()}
              description="Famílias únicas atendidas"
              icon={<Users className="h-6 w-6" />}
            />
            
            <DashboardCard
              title="Total de Itens"
              value={totalItems.toString()}
              description="Itens entregues no período"
              icon={<BarChart3 className="h-6 w-6" />}
            />
          </div>

          {/* Tabela de Entregas */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Entregas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Família</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Itens Entregues</TableHead>
                    <TableHead>Período Bloqueio</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeliveries.map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell>
                        {new Date(delivery.delivery_date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="font-medium">
                        {delivery.family_name}
                      </TableCell>
                      <TableCell>{delivery.family_cpf}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {delivery.items_delivered.map((item, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {delivery.blocking_period} dias
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {delivery.notes || '-'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredDeliveries.length === 0 && (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Nenhuma entrega encontrada no período selecionado
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default InstitutionReports;
