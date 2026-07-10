
import React from 'react';
import DashboardCard from '@/components/DashboardCard';
import { InstitutionLayout } from '@/components/layout/InstitutionLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardStats, type InstitutionStats } from '@/hooks/useDashboardStats';
import { useInstitutionData } from '@/hooks/useInstitutions';
import { Users, Package, AlertTriangle, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const InstitutionDashboard = () => {
  const { profile } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();
  const { data: institutionData, isLoading: isLoadingInstitution } = useInstitutionData();

  if (!profile) {
    return null;
  }

  return (
    <InstitutionLayout title="Início">
      <PageHeader
        title="Dashboard - Instituição"
        description={`Bem-vindo(a), ${profile.full_name}! Acompanhe as atividades da sua instituição.`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4 mb-6 md:mb-8">
        <DashboardCard
          title="Famílias Cadastradas"
          value={isLoading ? "..." : ((stats as InstitutionStats)?.associatedFamilies || 0).toString()}
          description="Total de famílias Cadastradas"
          icon={<Users className="h-6 w-6" />}
        />
        
        <DashboardCard
          title="Entregas Este Mês"
          value={isLoading ? "..." : ((stats as InstitutionStats)?.recentDeliveries || 0).toString()}
          description="Cestas entregues no mês"
          icon={<Package className="h-6 w-6" />}
        />
        
        <DashboardCard
          title="Famílias Bloqueadas"
          value={isLoading ? "..." : ((stats as InstitutionStats)?.blockedByInstitution || 0).toString()}
          description="Bloqueadas por esta instituição"
          icon={<AlertTriangle className="h-6 w-6" />}
        />

        <DashboardCard
          title="Total de Entregas no Ano"
          value={isLoading ? "..." : ((stats as InstitutionStats)?.institutionDeliveriesThisYear || 0).toString()}
          description="Entregas realizadas no ano"
          icon={<Calendar className="h-6 w-6" />}
        />
      </div>

      <Card className="mb-4 md:mb-6">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Informações da Instituição</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingInstitution ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <p className="text-sm text-gray-600">Nome da Instituição</p>
                <p className="font-medium">{institutionData?.name || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Responsável</p>
                <p className="font-medium">{profile.full_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">E-mail</p>
                <p className="font-medium">{institutionData?.email || profile.email || 'Não informado'}</p>
              </div>
              {institutionData?.address && (
                <div>
                  <p className="text-sm text-gray-600">Endereço</p>
                  <p className="font-medium">{institutionData.address}</p>
                </div>
              )}
              {institutionData?.phone && (
                <div>
                  <p className="text-sm text-gray-600">Telefone</p>
                  <p className="font-medium">{institutionData.phone}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </InstitutionLayout>
  );
};

export default InstitutionDashboard;
