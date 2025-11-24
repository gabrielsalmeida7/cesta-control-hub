
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Users, 
  BarChart3, 
  Package,
  Truck
} from "lucide-react";

const InstitutionNavigationButtons = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navigationItems = [
    {
      label: "Dashboard",
      path: "/institution/dashboard",
      icon: Home,
    },
    {
      label: "Famílias",
      path: "/institution/families",
      icon: Users,
    },
    {
      label: "Entregas",
      path: "/institution/delivery",
      icon: Package,
    },
    {
      label: "Relatórios",
      path: "/institution/reports",
      icon: BarChart3,
    },
    {
      label: "Fornecedores",
      path: "/institution/suppliers",
      icon: Truck,
    }
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 py-4 overflow-x-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.path}
                variant={isActive(item.path) ? "default" : "ghost"}
                onClick={() => navigate(item.path)}
                className="flex items-center space-x-2 whitespace-nowrap"
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default InstitutionNavigationButtons;
