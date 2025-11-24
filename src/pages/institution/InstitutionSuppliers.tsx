import React, { useState } from 'react';
import Header from '@/components/Header';
import InstitutionNavigationButtons from '@/components/InstitutionNavigationButtons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Package, Warehouse, ArrowDownUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import SuppliersTab from '@/components/suppliers/SuppliersTab';
import ProductsTab from '@/components/suppliers/ProductsTab';
import InventoryTab from '@/components/suppliers/InventoryTab';
import StockMovementsTab from '@/components/suppliers/StockMovementsTab';

const InstitutionSuppliers = () => {
  const { profile } = useAuth();

  if (!profile) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <InstitutionNavigationButtons />
        
        <div className="mt-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Fornecedores e Estoque</h1>
          
          <Tabs defaultValue="suppliers" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="suppliers">
                <Package className="h-4 w-4 mr-2" />
                Fornecedores
              </TabsTrigger>
              <TabsTrigger value="products">
                <Package className="h-4 w-4 mr-2" />
                Produtos
              </TabsTrigger>
              <TabsTrigger value="inventory">
                <Warehouse className="h-4 w-4 mr-2" />
                Estoque
              </TabsTrigger>
              <TabsTrigger value="movements">
                <ArrowDownUp className="h-4 w-4 mr-2" />
                Movimentações
              </TabsTrigger>
            </TabsList>

            <TabsContent value="suppliers" className="mt-6">
              <SuppliersTab />
            </TabsContent>

            <TabsContent value="products" className="mt-6">
              <ProductsTab />
            </TabsContent>

            <TabsContent value="inventory" className="mt-6">
              <InventoryTab institutionId={profile.institution_id} />
            </TabsContent>

            <TabsContent value="movements" className="mt-6">
              <StockMovementsTab institutionId={profile.institution_id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default InstitutionSuppliers;

