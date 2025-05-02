
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  username: string;
}

const Header = ({ username }: HeaderProps) => {
  return (
    <header className="bg-primary text-white py-4 px-6 shadow-md flex justify-between items-center fixed top-0 left-0 right-0 z-10">
      <h1 className="text-xl font-bold">Controle de Cestas Básicas</h1>
      <div className="flex items-center gap-4">
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
