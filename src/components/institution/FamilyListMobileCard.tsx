import { Edit, Eye, Loader2, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateBrasilia } from "@/utils/dateFormat";
import type { ReactNode } from "react";

interface FamilyListMobileCardProps {
  registrationNumber: string | number;
  contactPerson: string;
  membersCount?: number | string | null;
  statusBadge: ReactNode;
  lastDeliveryDate?: string | null;
  onViewDetails: () => void;
  onEdit: () => void;
  onUnlink?: () => void;
  isUnlinking?: boolean;
}

export function FamilyListMobileCard({
  registrationNumber,
  contactPerson,
  membersCount,
  statusBadge,
  lastDeliveryDate,
  onViewDetails,
  onEdit,
  onUnlink,
  isUnlinking,
}: FamilyListMobileCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-500">Nº {registrationNumber}</p>
            <p className="truncate text-base font-semibold text-gray-900">{contactPerson}</p>
            <p className="text-sm text-gray-600">
              {membersCount ?? "N/A"} membros
            </p>
          </div>
          {statusBadge}
        </div>
        <p className="mb-3 text-sm text-gray-600">
          Última entrega:{" "}
          {lastDeliveryDate ? formatDateBrasilia(lastDeliveryDate) : "Nunca"}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="touch-target" onClick={onViewDetails}>
            <Eye className="mr-1 h-4 w-4" />
            Detalhes
          </Button>
          <Button variant="outline" size="sm" className="touch-target" onClick={onEdit}>
            <Edit className="mr-1 h-4 w-4" />
            Editar
          </Button>
          {onUnlink && (
            <Button
              variant="outline"
              size="sm"
              className="touch-target col-span-2 text-red-600"
              onClick={onUnlink}
              disabled={isUnlinking}
            >
              {isUnlinking ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Unlink className="mr-1 h-4 w-4" />
              )}
              Desvincular
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
