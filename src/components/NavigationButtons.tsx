
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Building2, 
  Users, 
  BarChart3, 
  Package,
  Menu
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const NavigationButtons = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);

  if (!profile) {
    return null;
  }

  const isActive = (path: string) => location.pathname === path;

  const isInstitution = profile.role === 'institution';

  type Role = 'admin' | 'institution';
  type NavItem = {
    label: string;
    path: string;
    icon: LucideIcon;
    allowedRoles: Role[];
  };

  const navigationItems: NavItem[] = isInstitution
    ? [
        { label: "Dashboard", path: "/institution/dashboard", icon: Home, allowedRoles: ['institution'] },
        { label: "Famílias", path: "/institution/families", icon: Users, allowedRoles: ['institution'] },
        { label: "Entregas", path: "/institution/delivery", icon: Package, allowedRoles: ['institution'] },
        { label: "Relatórios", path: "/institution/reports", icon: BarChart3, allowedRoles: ['institution'] },
      ]
    : [
        { label: "Dashboard", path: "/", icon: Home, allowedRoles: ['admin'] },
        { label: "Instituições", path: "/institutions", icon: Building2, allowedRoles: ['admin'] },
        { label: "Famílias", path: "/families", icon: Users, allowedRoles: ['admin'] },
        { label: "Relatórios", path: "/reports", icon: BarChart3, allowedRoles: ['admin'] },
      ];

  const filteredItems = navigationItems.filter(item => 
    item.allowedRoles.includes(profile.role)
  );

  const handleNavigation = (path: string) => {
    navigate(path);
    setSheetOpen(false);
  };

  // Mobile: Menu hamburger
  if (isMobile) {
    return (
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-3">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Abrir menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Menu de Navegação</SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col space-y-2">
                  {filteredItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <Button
                        key={item.path}
                        variant={active ? "default" : "ghost"}
                        onClick={() => handleNavigation(item.path)}
                        className="w-full justify-start space-x-3 h-12"
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-base">{item.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    );
  }

  // Desktop: Menu horizontal
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
