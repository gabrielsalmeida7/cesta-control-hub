
import React from 'react';
import { Button } from "@/components/ui/button";
import { LogOut, User, Menu } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const { profile, signOut } = useAuth();

  const handleLogout = async () => {
    if (import.meta.env.DEV) {
      console.log("[HEADER]", "Logout button clicked", {
        timestamp: new Date().toISOString()
      });
    }
    await signOut();
  };

  // Não fazer redirecionamento automático aqui
  // O ProtectedRoute é responsável por verificar autenticação e redirecionar
  // Este componente apenas renderiza o header se houver profile

  if (!profile) {
    return null;
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3 md:py-4">
          <div className="flex items-center space-x-2 md:space-x-4 min-w-0 flex-1">
            <img 
              src="/CestaJustaLogo.svg" 
              alt="Logo" 
              className="h-8 md:h-12 w-auto flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-sm md:text-xl font-semibold text-gray-900 truncate">
                Sistema de Controle de Alimentos
              </h1>
              <p className="hidden sm:block text-xs md:text-sm text-gray-500">
                Banco de Alimentos - Prefeitura Municipal de Araguari
              </p>
            </div>
          </div>
          
          {/* Desktop: Mostrar informações do usuário e botão de logout */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">{profile.full_name}</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {profile.role === 'admin' ? 'Administrador' : 'Instituição'}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </Button>
          </div>

          {/* Mobile: Dropdown menu com informações do usuário */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu do usuário</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">{profile.full_name}</span>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full inline-block w-fit mt-1">
                      {profile.role === 'admin' ? 'Administrador' : 'Instituição'}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
