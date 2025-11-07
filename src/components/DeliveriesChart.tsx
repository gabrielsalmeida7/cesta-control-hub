
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
import { BarChart2, Eye, EyeOff, Filter, Loader2 } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useDeliveries } from "@/hooks/useDeliveries";
import { useInstitutions } from "@/hooks/useInstitutions";

const DeliveriesChart = () => {
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

  // Filter data based on selected institution
  const getFilteredData = () => {
    if (selectedInstitution === "all") {
      return chartData;
    }
    
    // Filter to show only selected institution
    const selectedInst = institutions.find(inst => inst.id === selectedInstitution);
    if (!selectedInst) return chartData;
    
    return chartData.map(item => ({
      name: item.name,
      [selectedInst.name]: item[selectedInst.name] || 0
    }));
  };

  const isLoading = deliveriesLoading || institutionsLoading;

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
                {institutions.map((institution) => (
                  <SelectItem key={institution.id} value={institution.id}>
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
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Nenhum dado disponível para exibir</p>
            </div>
          ) : (
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
                {selectedInstitution === "all" ? (
                  institutions.map((inst, index) => {
                    const colors = ["#004E64", "#007F5F", "#00A8CC", "#FF6B6B", "#4ECDC4", "#95E1D3"];
                    return (
                      <Bar 
                        key={inst.id} 
                        dataKey={inst.name} 
                        fill={colors[index % colors.length]} 
                      />
                    );
                  })
                ) : (
                  (() => {
                    const selectedInst = institutions.find(inst => inst.id === selectedInstitution);
                    return selectedInst ? (
                      <Bar dataKey={selectedInst.name} fill="#004E64" />
                    ) : null;
                  })()
                )}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </Card>
  );
};

export default DeliveriesChart;
