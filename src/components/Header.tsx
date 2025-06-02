
import React from 'react';
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';

const Header = () => {
  const { profile, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  if (!profile) {
    return null;
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            <img 
              src="/lovable-uploads/CestaJusta.PNG" 
              alt="Logo" 
              className="h-12 w-auto"
            />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Sistema de Controle de Alimentos
              </h1>
              <p className="text-sm text-gray-500">
                Banco de Alimentos - Prefeitura Municipal de Araguari
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
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
        </div>
      </div>
    </header>
  );
};

export default Header;
