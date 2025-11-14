
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import NavigationButtons from '@/components/NavigationButtons';
import DashboardCard from '@/components/DashboardCard';
import DeliveriesChart from '@/components/DeliveriesChart';
import RecentDeliveriesTable from '@/components/RecentDeliveriesTable';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardStats, type AdminStats } from '@/hooks/useDashboardStats';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Building2, Package, AlertTriangle, Loader2 } from 'lucide-react';

const Index = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();

  useEffect(() => {
    // Only redirect institution users, don't redirect admin users automatically
    if (profile?.role === 'institution') {
      navigate('/institution/dashboard');
    }
  }, [user, profile, navigate]);

  // Se user for null, não renderizar nada (ProtectedRoute vai redirecionar)
  if (!user) {
    return null;
  }

  // Se ainda está carregando ou profile ainda não carregou, mostrar loading
  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Se for instituição, não renderizar nada (será redirecionado)
  if (profile.role === 'institution') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <NavigationButtons />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Dashboard - Administrador
            </h2>
            <p className="text-gray-600">
              Bem-vindo(a), {profile.full_name}! Aqui você pode acompanhar as principais métricas do sistema.
            </p>
          </div>

          {/* Cards de estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsLoading ? (
              <>
                <Skeleton className="h-[120px] w-full" />
                <Skeleton className="h-[120px] w-full" />
                <Skeleton className="h-[120px] w-full" />
                <Skeleton className="h-[120px] w-full" />
              </>
            ) : (
              <>
                <DashboardCard
                  title="Total de Famílias"
                  value={(stats as AdminStats)?.totalFamilies || 0}
                  description="Famílias cadastradas"
                  icon={<Users className="h-6 w-6" />}
                />
                
                <DashboardCard
                  title="Instituições Ativas"
                  value={(stats as AdminStats)?.totalInstitutions || 0}
                  description="Instituições cadastradas"
                  icon={<Building2 className="h-6 w-6" />}
                />
                
                <DashboardCard
                  title="Entregas Este Mês"
                  value={(stats as AdminStats)?.totalDeliveries || 0}
                  description="Cestas entregues"
                  icon={<Package className="h-6 w-6" />}
                />
                
                <DashboardCard
                  title="Famílias Bloqueadas"
                  value={(stats as AdminStats)?.blockedFamilies || 0}
                  description="Aguardando liberação"
                  icon={<AlertTriangle className="h-6 w-6" />}
                />
              </>
            )}
          </div>

          {/* Gráfico de entregas */}
          <div className="mb-8">
            <DeliveriesChart />
          </div>

          {/* Tabela de entregas recentes */}
          <RecentDeliveriesTable />
        </div>
      </main>
    </div>
  );
};

export default Index;
