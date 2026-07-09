import type { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return actions ? (
      <div className="mb-4 flex flex-col gap-3">
        {description && <p className="text-sm text-gray-600">{description}</p>}
        <div className="flex flex-col gap-2 sm:flex-row">{actions}</div>
      </div>
    ) : description ? (
      <p className="mb-4 text-sm text-gray-600">{description}</p>
    ) : null;
  }

  return (
    <div className="mb-6 flex flex-col gap-4 md:mb-8 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h2 className="mb-2 text-xl font-bold text-gray-900 md:text-2xl">{title}</h2>
        {description && <p className="text-sm text-gray-600 md:text-base">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
