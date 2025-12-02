
import React from 'react';
import Header from '@/components/Header';
import InstitutionNavigationButtons from '@/components/InstitutionNavigationButtons';
import DashboardCard from '@/components/DashboardCard';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardStats, type InstitutionStats } from '@/hooks/useDashboardStats';
import { useInstitutionData } from '@/hooks/useInstitutions';
import { Users, Package, AlertTriangle, Calendar, BarChart3 } from 'lucide-react';
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
    <div className="min-h-screen bg-gray-50">
      <Header />
      <InstitutionNavigationButtons />
      
      <main className="max-w-7xl mx-auto py-4 md:py-6 px-4 sm:px-6 lg:px-8">
        <div className="py-4 sm:py-6">
          <div className="mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              Dashboard - Instituição
            </h2>
            <p className="text-sm md:text-base text-gray-600">
              Bem-vindo(a), {profile.full_name}! Acompanhe as atividades da sua instituição.
            </p>
          </div>

          {/* Cards de estatísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
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
              title="Famílias Atendidas"
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

          {/* Informações da Instituição */}
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
                    <p className="font-medium">{profile.email}</p>
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

          {/* Ações Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <Package className="h-8 w-8 text-primary mb-2" />
                  <h3 className="font-medium">Registrar Entrega</h3>
                  <p className="text-sm text-gray-600">Registre uma nova entrega de cesta básica</p>
                </div>
                <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <Users className="h-8 w-8 text-primary mb-2" />
                  <h3 className="font-medium">Ver Famílias</h3>
                  <p className="text-sm text-gray-600">Consulte a lista de famílias cadastradas</p>
                </div>
                <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <BarChart3 className="h-8 w-8 text-primary mb-2" />
                  <h3 className="font-medium">Relatórios</h3>
                  <p className="text-sm text-gray-600">Visualize relatórios de entregas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default InstitutionDashboard;
