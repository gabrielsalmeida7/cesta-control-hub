
import { useState } from "react";
import { LogOut, Menu, X, Building, Users, FileText, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface HeaderProps {
  username: string;
}

const Header = ({ username }: HeaderProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="bg-primary text-white py-4 px-6 shadow-md flex justify-between items-center fixed top-0 left-0 right-0 z-10">
      <div className="flex items-center gap-3">
        <Package className="h-6 w-6" />
        <Link to="/" className="hover:text-white/80 transition-colors">
          <h1 className="text-xl font-bold">Controle de Cestas Básicas</h1>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="md:relative">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="text-white hover:text-white hover:bg-primary/80">
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="absolute right-0 top-full mt-2 w-48 bg-white text-gray-800 rounded-md shadow-lg overflow-hidden md:right-auto z-10">
            <nav className="flex flex-col">
              <Link to="/institutions" className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100">
                <Building className="h-5 w-5" />
                <span>Instituições</span>
              </Link>
              <Link to="/families" className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100">
                <Users className="h-5 w-5" />
                <span>Ver Famílias</span>
              </Link>
              <Link to="/reports" className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100">
                <FileText className="h-5 w-5" />
                <span>Gerar Relatórios</span>
              </Link>
            </nav>
          </CollapsibleContent>
        </Collapsible>

        <span className="hidden sm:inline-block">Olá, {username}</span>
        <Button 
          variant="ghost" 
          className="text-white hover:text-white hover:bg-primary/80 flex items-center gap-2"
        >
          <span className="hidden sm:inline-block">Sair</span>
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};

export default Header;
