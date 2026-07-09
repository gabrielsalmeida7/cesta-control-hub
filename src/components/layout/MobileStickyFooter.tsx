import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MobileStickyFooterProps {
  children: ReactNode;
  className?: string;
}

export function MobileStickyFooter({ children, className }: MobileStickyFooterProps) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 border-t border-gray-200 bg-white/95 p-4 backdrop-blur-sm md:hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}
