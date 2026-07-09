import { BarChart3, Home, Package, Users, Warehouse } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { label: "Início", path: "/institution/dashboard", icon: Home },
  { label: "Famílias", path: "/institution/families", icon: Users },
  { label: "Entregas", path: "/institution/delivery", icon: Package, highlight: true },
  { label: "Relatórios", path: "/institution/reports", icon: BarChart3 },
  { label: "Estoque", path: "/institution/suppliers", icon: Warehouse, tab: "inventory" },
] as const;

export function InstitutionBottomNav() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();

  if (!isMobile) {
    return null;
  }

  const isActive = (path: string, tab?: string) => {
    if (location.pathname !== path) {
      return false;
    }
    if (tab) {
      return new URLSearchParams(location.search).get("tab") === tab;
    }
    return true;
  };

  const handleNav = (path: string, tab?: string) => {
    navigate(tab ? `${path}?tab=${tab}` : path);
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white safe-area-bottom"
      aria-label="Navegação principal"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path, "tab" in item ? item.tab : undefined);
          const isHighlight = "highlight" in item && item.highlight;

          return (
            <button
              key={item.path + (item.tab ?? "")}
              type="button"
              onClick={() => handleNav(item.path, "tab" in item ? item.tab : undefined)}
              className={cn(
                "touch-target flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium transition-colors",
                active
                  ? isHighlight
                    ? "text-[#004E64]"
                    : "text-[#004E64]"
                  : "text-gray-500",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full",
                  active && isHighlight && "bg-[#004E64] text-white",
                  active && !isHighlight && "bg-[#004E64]/10",
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="leading-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
