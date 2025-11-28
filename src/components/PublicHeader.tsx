import React from 'react';
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

/**
 * Header público para páginas acessíveis sem login
 * Usado em: Política de Privacidade, Portal do Titular
 */
const PublicHeader = () => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center gap-4">
            <img 
              src="/CestaJustaLogo.svg" 
              alt="Logo Cesta Justa" 
              className="h-12"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Cesta Justa
              </h1>
              <p className="text-sm text-gray-500">
                Sistema de Controle de Alimentos
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/login'}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Ir para Login
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default PublicHeader;

