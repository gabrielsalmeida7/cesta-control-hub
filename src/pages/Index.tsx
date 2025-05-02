
import { Package, Users, Building, AlertTriangle } from "lucide-react";
import Header from "@/components/Header";
import DashboardCard from "@/components/DashboardCard";
import DeliveriesChart from "@/components/DeliveriesChart";
import RecentDeliveriesTable from "@/components/RecentDeliveriesTable";
import NavigationButtons from "@/components/NavigationButtons";

const Index = () => {
  // Mock data
  const username = "Admin Silva";
  const monthlyDeliveries = 128;
  const totalInstitutions = 12;
  const familiesServed = 85;
  const blockedFamilies = 7;

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <Header username={username} />
      
      <main className="pt-20 pb-8 px-4 md:px-8 max-w-[1400px] mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Painel de Controle</h2>
          
          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <DashboardCard 
              title="Cestas Entregues no Mês" 
              value={monthlyDeliveries} 
              icon={Package} 
              color="primary"
            />
            <DashboardCard 
              title="Total de Instituições" 
              value={totalInstitutions} 
              icon={Building} 
              color="secondary"
            />
            <DashboardCard 
              title="Famílias Atendidas" 
              value={familiesServed} 
              icon={Users} 
              color="success"
            />
            <DashboardCard 
              title="Famílias Bloqueadas" 
              value={blockedFamilies} 
              icon={AlertTriangle} 
              color="danger"
            />
          </div>
          
          {/* Chart Section */}
          <div className="mb-8">
            <DeliveriesChart />
          </div>
          
          {/* Table Section */}
          <div className="mb-8">
            <RecentDeliveriesTable />
          </div>
          
          {/* Navigation Buttons */}
          <div>
            <NavigationButtons />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
