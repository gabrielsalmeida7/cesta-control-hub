
import { Users, Building, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const NavigationButtons = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Button 
        className="h-auto py-6 bg-primary hover:bg-primary/90 text-white flex flex-col items-center gap-2"
        onClick={() => console.log("Ver famílias")}
      >
        <Users className="h-8 w-8" />
        <span className="text-lg font-semibold">Ver Famílias</span>
      </Button>
      
      <Button 
        className="h-auto py-6 bg-success hover:bg-success/90 text-white flex flex-col items-center gap-2"
        onClick={() => console.log("Ver instituições")}
      >
        <Building className="h-8 w-8" />
        <span className="text-lg font-semibold">Ver Instituições</span>
      </Button>
      
      <Button 
        className="h-auto py-6 bg-danger hover:bg-danger/90 text-white flex flex-col items-center gap-2"
        onClick={() => console.log("Gerar relatórios")}
      >
        <BarChart2 className="h-8 w-8" />
        <span className="text-lg font-semibold">Gerar Relatórios</span>
      </Button>
    </div>
  );
};

export default NavigationButtons;
