
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
import { BarChart2, Eye, EyeOff } from "lucide-react";

// Sample data for the chart
const data = [
  { name: 'Jan', Instituição_A: 40, Instituição_B: 24 },
  { name: 'Fev', Instituição_A: 30, Instituição_B: 28 },
  { name: 'Mar', Instituição_A: 20, Instituição_B: 26 },
  { name: 'Abr', Instituição_A: 27, Instituição_B: 20 },
  { name: 'Mai', Instituição_A: 18, Instituição_B: 19 },
  { name: 'Jun', Instituição_A: 23, Instituição_B: 25 },
];

const DeliveriesChart = () => {
  const [showChart, setShowChart] = useState<boolean>(true);

  return (
    <Card className="p-6 shadow-md">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Cestas por Instituição</h2>
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

      {showChart && (
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
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
              <Bar dataKey="Instituição_A" fill="#004E64" />
              <Bar dataKey="Instituição_B" fill="#007F5F" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};

export default DeliveriesChart;
