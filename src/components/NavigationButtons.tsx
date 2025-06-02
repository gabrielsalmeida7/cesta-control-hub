
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Building2, 
  Users, 
  BarChart3, 
  Package 
} from "lucide-react";
import { useAuth } from '@/hooks/useAuth';

const NavigationButtons = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();

  if (!profile) {
    return null;
  }

  const isActive = (path: string) => location.pathname === path;

  const navigationItems = [
    {
      label: "Dashboard",
      path: "/",
      icon: Home,
      allowedRoles: ['admin', 'institution']
    },
    {
      label: "Instituições",
      path: "/institutions",
      icon: Building2,
      allowedRoles: ['admin']
    },
    {
      label: "Famílias",
      path: "/families",
      icon: Users,
      allowedRoles: ['admin', 'institution']
    },
    {
      label: "Entregas",
      path: "/delivery",
      icon: Package,
      allowedRoles: ['institution']
    },
    {
      label: "Relatórios",
      path: "/reports",
      icon: BarChart3,
      allowedRoles: ['admin', 'institution']
    }
  ];

  const filteredItems = navigationItems.filter(item => 
    item.allowedRoles.includes(profile.role)
  );

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 py-4 overflow-x-auto">
          {filteredItems.map((item) => {
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

export default NavigationButtons;
