
import { Users, Building, BarChart2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const NavigationButtons = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Button 
        className="h-auto py-6 bg-primary hover:bg-primary/90 text-white flex flex-col items-center gap-2"
        onClick={() => navigate("/families")}
      >
        <Users className="h-8 w-8" />
        <span className="text-lg font-semibold">Ver Famílias</span>
      </Button>
      
      <Button 
        className="h-auto py-6 bg-success hover:bg-success/90 text-white flex flex-col items-center gap-2"
        onClick={() => navigate("/institutions")}
      >
        <Building className="h-8 w-8" />
        <span className="text-lg font-semibold">Ver Instituições</span>
      </Button>
      
      <Button 
        className="h-auto py-6 bg-primary hover:bg-primary/90 text-white flex flex-col items-center gap-2"
        onClick={() => navigate("/delivery")}
      >
        <Package className="h-8 w-8" />
        <span className="text-lg font-semibold">Gerenciar Entregas</span>
      </Button>
      
      <Button 
        className="h-auto py-6 bg-danger hover:bg-danger/90 text-white flex flex-col items-center gap-2"
        onClick={() => navigate("/reports")}
      >
        <BarChart2 className="h-8 w-8" />
        <span className="text-lg font-semibold">Gerar Relatórios</span>
      </Button>
    </div>
  );
};

export default NavigationButtons;
