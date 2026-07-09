import { LogOut, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";

export function InstitutionMobileHeader() {
  const { profile, signOut } = useAuth();

  if (!profile) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#004E64]/20 bg-[#004E64] text-white safe-area-top">
      <div className="relative flex h-14 items-center justify-end px-4">
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <img
            src="/CestaJustaLogo.svg"
            alt="Cesta Justa"
            className="h-8 w-auto max-w-[180px] object-contain"
          />
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="touch-target shrink-0 text-white hover:bg-white/10 hover:text-white"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menu do usuário</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px]">
            <SheetHeader>
              <SheetTitle>Conta</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
                <User className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">{profile.full_name}</p>
                  <span className="mt-1 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                    Instituição
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                className="touch-target w-full justify-start"
                onClick={() => void signOut()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
