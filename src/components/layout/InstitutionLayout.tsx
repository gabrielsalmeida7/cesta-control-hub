import type { ReactNode } from "react";
import Header from "@/components/Header";
import InstitutionNavigationButtons from "@/components/InstitutionNavigationButtons";
import { useIsMobile } from "@/hooks/use-mobile";
import { InstitutionBottomNav } from "./InstitutionBottomNav";
import { InstitutionMobileHeader } from "./InstitutionMobileHeader";

interface InstitutionLayoutProps {
  title: string;
  children: ReactNode;
}

export function InstitutionLayout({ title, children }: InstitutionLayoutProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="institution-mobile-shell min-h-screen bg-gray-50">
        <InstitutionMobileHeader />
        <main className="institution-mobile-main mx-auto max-w-7xl px-4 py-4 pb-24">
          {children}
        </main>
        <InstitutionBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <InstitutionNavigationButtons />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
