
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import NavigationButtons from '@/components/NavigationButtons';
import DashboardCard from '@/components/DashboardCard';
import DeliveriesChart from '@/components/DeliveriesChart';
import RecentDeliveriesTable from '@/components/RecentDeliveriesTable';
import { useAuth } from '@/hooks/useAuth';
import { Users, Building2, Package, AlertTriangle } from 'lucide-react';

const Index = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect institution users, don't redirect admin users automatically
    if (profile?.role === 'institution') {
      navigate('/institution/dashboard');
    }
  }, [profile, navigate]);

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
              value="0"
              description="Famílias cadastradas"
              icon={<Users className="h-6 w-6" />}
            />
            
            <DashboardCard
              title="Instituições Ativas"
              value="0"
              description="Instituições cadastradas"
              icon={<Building2 className="h-6 w-6" />}
            />
            
            <DashboardCard
              title="Entregas Este Mês"
              value="0"
              description="Cestas entregues"
              icon={<Package className="h-6 w-6" />}
            />
            
            <DashboardCard
              title="Famílias Bloqueadas"
              value="0"
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
