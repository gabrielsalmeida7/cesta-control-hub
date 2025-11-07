
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import NavigationButtons from '@/components/NavigationButtons';
import DashboardCard from '@/components/DashboardCard';
import DeliveriesChart from '@/components/DeliveriesChart';
import RecentDeliveriesTable from '@/components/RecentDeliveriesTable';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { Users, Building2, Package, AlertTriangle, Loader2 } from 'lucide-react';

const Index = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();

  useEffect(() => {
    // Se user for null (durante logout), não fazer nada - ProtectedRoute vai redirecionar
    if (!user) {
      if (import.meta.env.DEV) {
        console.log("[INDEX]", "User is null, waiting for ProtectedRoute to redirect", {
          hasProfile: !!profile,
          timestamp: new Date().toISOString()
        });
      }
      return;
    }

    // Redirecionar usuários instituição para seu dashboard específico
    if (profile?.role === 'institution') {
      navigate('/institution/dashboard');
    }
  }, [user, profile, navigate]);

  // Se user for null, não renderizar nada (ProtectedRoute vai redirecionar)
  if (!user) {
    return null;
  }

  // Se profile ainda não carregou, mostrar loading ou null
  if (!profile) {
    return null;
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
            <DashboardCard
              title="Total de Famílias"
              value={statsLoading ? "..." : (stats?.totalFamilies || 0).toString()}
              description="Famílias cadastradas"
              icon={<Users className="h-6 w-6" />}
            />
            
            <DashboardCard
              title="Instituições Ativas"
              value={statsLoading ? "..." : (stats?.totalInstitutions || 0).toString()}
              description="Instituições cadastradas"
              icon={<Building2 className="h-6 w-6" />}
            />
            
            <DashboardCard
              title="Entregas Este Mês"
              value={statsLoading ? "..." : (stats?.totalDeliveries || 0).toString()}
              description="Cestas entregues"
              icon={<Package className="h-6 w-6" />}
            />
            
            <DashboardCard
              title="Famílias Bloqueadas"
              value={statsLoading ? "..." : (stats?.blockedFamilies || 0).toString()}
              description="Aguardando liberação"
              icon={<AlertTriangle className="h-6 w-6" />}
            />
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
