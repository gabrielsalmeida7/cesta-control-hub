
import { useState } from "react";
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
import { BarChart2, Eye, EyeOff, Filter } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

// Sample data for the chart
const data = [
  { name: 'Jan', Instituição_A: 40, Instituição_B: 24 },
  { name: 'Fev', Instituição_A: 30, Instituição_B: 28 },
  { name: 'Mar', Instituição_A: 20, Instituição_B: 26 },
  { name: 'Abr', Instituição_A: 27, Instituição_B: 20 },
  { name: 'Mai', Instituição_A: 18, Instituição_B: 19 },
  { name: 'Jun', Instituição_A: 23, Instituição_B: 25 },
];

// Sample list of institutions
const institutions = [
  { id: 1, name: "Instituição A" },
  { id: 2, name: "Instituição B" },
  { id: 3, name: "Instituição C" },
  { id: 4, name: "Instituição D" },
  { id: 5, name: "CRAS Central" },
  { id: 6, name: "CRAS Norte" },
  { id: 7, name: "CRAS Sul" },
  { id: 8, name: "Igreja São Francisco" },
  { id: 9, name: "Associação Comunitária" },
  { id: 10, name: "Centro de Apoio" },
  // Additional institutions to show there are many
  { id: 11, name: "Fundação Esperança" },
  { id: 12, name: "Centro Assistencial Luz" },
  { id: 13, name: "Instituto Apoio Familiar" },
  { id: 14, name: "Núcleo de Amparo" },
  { id: 15, name: "Casa de Acolhida" },
];

const DeliveriesChart = () => {
  const [showChart, setShowChart] = useState<boolean>(true);
  const [selectedInstitution, setSelectedInstitution] = useState<string>("all");

  // Filter data based on selected institution
  const getFilteredData = () => {
    if (selectedInstitution === "all") {
      return data;
    }
    
    // For simplicity in this example, we'll just return a subset of data
    // In a real app, you would filter based on the actual data
    return data.map(item => ({
      name: item.name,
      [selectedInstitution]: item[selectedInstitution === "Instituição_A" ? "Instituição_A" : "Instituição_B"]
    }));
  };

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
                  <SelectItem key={institution.id} value={institution.id === 1 ? "Instituição_A" : "Instituição_B"}>
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
              {selectedInstitution === "all" ? (
                <>
                  <Bar dataKey="Instituição_A" fill="#004E64" />
                  <Bar dataKey="Instituição_B" fill="#007F5F" />
                </>
              ) : (
                <Bar dataKey={selectedInstitution} fill={selectedInstitution === "Instituição_A" ? "#004E64" : "#007F5F"} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};

export default DeliveriesChart;
