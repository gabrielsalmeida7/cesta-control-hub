import { Eye, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateBrasilia } from "@/utils/dateFormat";
import type { ReactNode } from "react";

interface DeliveryReportMobileCardProps {
  deliveryDate: string;
  familyName: string;
  contactPerson?: string | null;
  itemsContent: ReactNode;
  blockingPeriodDays: number;
  hasJustification?: boolean;
  justificationPreview?: string;
  observationsPreview?: string;
  onViewDetails: () => void;
}

export function DeliveryReportMobileCard({
  deliveryDate,
  familyName,
  contactPerson,
  itemsContent,
  blockingPeriodDays,
  hasJustification,
  justificationPreview,
  observationsPreview,
  onViewDetails,
}: DeliveryReportMobileCardProps) {
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#004E64]">
              {formatDateBrasilia(deliveryDate)}
            </p>
            <p className="truncate font-semibold text-gray-900">{familyName}</p>
            {contactPerson && (
              <p className="text-sm text-gray-600">{contactPerson}</p>
            )}
          </div>
          <Badge variant="outline">{blockingPeriodDays} dias</Badge>
        </div>
        <div className="flex flex-wrap gap-1">{itemsContent}</div>
        {hasJustification && justificationPreview && (
          <p className="text-xs text-amber-700 line-clamp-2">
            Justificativa: {justificationPreview}
          </p>
        )}
        {observationsPreview && observationsPreview !== "-" && (
          <p className="text-xs text-gray-600 line-clamp-2">
            Obs.: {observationsPreview}
          </p>
        )}
        <Button variant="outline" size="sm" className="touch-target w-full" onClick={onViewDetails}>
          <Eye className="mr-1 h-4 w-4" />
          Ver detalhes
        </Button>
      </CardContent>
    </Card>
  );
}

export function DeliveryReportItemsFallback() {
  return (
    <Badge variant="secondary" className="text-xs">
      <Package className="mr-1 h-3 w-3" />
      Cesta Básica
    </Badge>
  );
}
