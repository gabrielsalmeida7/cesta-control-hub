import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InstitutionLayout } from '@/components/layout/InstitutionLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Package, Warehouse, ArrowDownUp, Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import SuppliersTab from '@/components/suppliers/SuppliersTab';
import ProductsTab from '@/components/suppliers/ProductsTab';
import InventoryTab from '@/components/suppliers/InventoryTab';
import StockMovementsTab from '@/components/suppliers/StockMovementsTab';
import BeneficiaryInstitutionsTab from '@/components/suppliers/BeneficiaryInstitutionsTab';

const tabOptions = [
  { value: 'suppliers', label: 'Fornecedores', icon: Package },
  { value: 'beneficiary-institutions', label: 'Instituições', icon: Building2 },
  { value: 'products', label: 'Produtos', icon: Package },
  { value: 'inventory', label: 'Estoque', icon: Warehouse },
  { value: 'movements', label: 'Movimentações', icon: ArrowDownUp },
] as const;

type TabValue = (typeof tabOptions)[number]['value'];

const InstitutionSuppliers = () => {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as TabValue | null;
  const [activeTab, setActiveTab] = useState<TabValue>(
    tabFromUrl && tabOptions.some((t) => t.value === tabFromUrl) ? tabFromUrl : 'suppliers',
  );

  useEffect(() => {
    if (tabFromUrl && tabOptions.some((t) => t.value === tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabChange = (value: string) => {
    const tab = value as TabValue;
    setActiveTab(tab);
    if (tab === 'suppliers') {
      setSearchParams({});
    } else {
      setSearchParams({ tab });
    }
  };

  if (!profile) {
    return <div>Carregando...</div>;
  }

  return (
    <InstitutionLayout title="Estoque">
      <PageHeader
        title="Fornecedores e Estoque"
        description="Gerencie fornecedores, produtos e controle de estoque"
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        {isMobile ? (
          <Select value={activeTab} onValueChange={handleTabChange}>
            <SelectTrigger className="touch-target mb-4 w-full">
              <SelectValue placeholder="Selecione a seção" />
            </SelectTrigger>
            <SelectContent>
              {tabOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <TabsList className="grid w-full grid-cols-5">
            {tabOptions.map((option) => {
              const Icon = option.icon;
              return (
                <TabsTrigger key={option.value} value={option.value}>
                  <Icon className="h-4 w-4 mr-2" />
                  {option.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        )}

        <TabsContent value="suppliers" className="mt-6">
          <SuppliersTab institutionId={profile.institution_id} />
        </TabsContent>

        <TabsContent value="beneficiary-institutions" className="mt-6">
          <BeneficiaryInstitutionsTab institutionId={profile.institution_id} />
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          <ProductsTab institutionId={profile.institution_id} />
        </TabsContent>

        <TabsContent value="inventory" className="mt-6">
          <InventoryTab institutionId={profile.institution_id} />
        </TabsContent>

        <TabsContent value="movements" className="mt-6">
          <StockMovementsTab institutionId={profile.institution_id} />
        </TabsContent>
      </Tabs>
    </InstitutionLayout>
  );
};

export default InstitutionSuppliers;
