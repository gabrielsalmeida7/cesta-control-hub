
import { useState, useMemo } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart2, Eye, EyeOff, Filter } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useDeliveriesByInstitution } from "@/hooks/useDeliveriesByInstitution";
import { useAuth } from "@/hooks/useAuth";

const DeliveriesChart = () => {
  const { profile } = useAuth();
  const { data: deliveriesData, isLoading } = useDeliveriesByInstitution();
  const [showChart, setShowChart] = useState<boolean>(true);
  const [selectedInstitution, setSelectedInstitution] = useState<string>("all");
  
  const { data: deliveries = [], isLoading: deliveriesLoading } = useDeliveries();
  const { data: institutions = [], isLoading: institutionsLoading } = useInstitutions();

  // Process deliveries data to group by month and institution
  const chartData = useMemo(() => {
    if (!deliveries || deliveries.length === 0) {
      return [];
    }

    // Get last 6 months
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho'];
    const now = new Date();
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return {
        month: months[i],
        monthName: monthNames[i],
        monthIndex: date.getMonth(),
        year: date.getFullYear()
      };
    });

    // Initialize data structure
    const dataMap: Record<string, Record<string, number>> = {};
    last6Months.forEach(({ month }) => {
      dataMap[month] = {};
      institutions.forEach(inst => {
        dataMap[month][inst.name] = 0;
      });
    });

    // Count deliveries by month and institution
    deliveries.forEach((delivery: any) => {
      if (!delivery.delivery_date || !delivery.institution) return;
      
      const deliveryDate = new Date(delivery.delivery_date);
      const monthIndex = deliveryDate.getMonth();
      const year = deliveryDate.getFullYear();
      
      const monthData = last6Months.find(m => 
        m.monthIndex === monthIndex && m.year === year
      );
      
      if (monthData && delivery.institution.name) {
        const institutionName = delivery.institution.name;
        if (!dataMap[monthData.month][institutionName]) {
          dataMap[monthData.month][institutionName] = 0;
        }
        dataMap[monthData.month][institutionName]++;
      }
    });

    // Convert to array format for chart
    return last6Months.map(({ month }) => ({
      name: month,
      ...dataMap[month]
    }));
  }, [deliveries, institutions]);

  // Cores para as instituições
  const institutionColors = [
    "#004E64", "#007F5F", "#2D6A4F", "#40916C", "#52B788", 
    "#74C69D", "#95D5B2", "#B7E4C7", "#D8F3DC", "#F1F8E9"
  ];

  const getFilteredData = () => {
    if (!deliveriesData?.chartData) return [];
    
    if (selectedInstitution === "all") {
      return deliveriesData.chartData;
    }
    
    // Filtrar por instituição específica
    return deliveriesData.chartData.map(item => ({
      name: item.name,
      [selectedInstitution]: item[selectedInstitution] || 0
    }));
  };

  const getVisibleInstitutions = () => {
    if (!deliveriesData?.institutions) return [];
    return selectedInstitution === "all" 
      ? deliveriesData.institutions.map(inst => inst.name)
      : [selectedInstitution];
  };

  if (profile?.role !== 'admin') {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="p-6 shadow-md">
        <Skeleton className="h-6 w-48 mb-6" />
        <Skeleton className="h-[300px] w-full" />
      </Card>
    );
  }

  return (
    <Card className="p-6 shadow-md">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Cestas por Instituição</h2>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={selectedInstitution} onValueChange={setSelectedInstitution}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Filtrar por Instituição" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Instituições</SelectItem>
                {deliveriesData?.institutions.map((institution) => (
                  <SelectItem key={institution.name} value={institution.name}>
                    {institution.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setShowChart(!showChart)}
          >
            {showChart ? (
              <>
                <EyeOff className="h-4 w-4" />
                <span>Ocultar gráfico</span>
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                <span>Mostrar gráfico</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {showChart && (
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={getFilteredData()}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {getVisibleInstitutions().map((institutionName, index) => (
                <Bar 
                  key={institutionName}
                  dataKey={institutionName} 
                  fill={institutionColors[index % institutionColors.length]} 
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};

export default DeliveriesChart;
