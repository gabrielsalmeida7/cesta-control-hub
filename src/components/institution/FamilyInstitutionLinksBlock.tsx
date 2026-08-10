import { Building } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { FamilyInstitutionLink } from "@/hooks/useFamilies";

interface FamilyInstitutionLinksBlockProps {
  links: FamilyInstitutionLink[];
  variant?: "default" | "compact";
}

const OTHER_INSTITUTIONS_LABEL = "Outras instituições cadastradas";

export function FamilyInstitutionLinksBlock({
  links,
  variant = "default",
}: FamilyInstitutionLinksBlockProps) {
  if (links.length === 0) {
    return null;
  }

  const originLink = links.find((link) => link.is_origin);
  const secondaryLinks = links.filter((link) => !link.is_origin);

  if (variant === "compact") {
    return (
      <div className="bg-white border rounded-lg p-3 space-y-3">
        <p className="text-sm font-medium text-gray-700">Instituições vinculadas</p>

        {originLink && (
          <div className="flex items-center gap-2 flex-wrap">
            <Building className="h-4 w-4 text-gray-500 shrink-0" />
            <span className="text-sm font-medium text-gray-900">
              {originLink.institution_name}
            </span>
            <Badge variant="secondary" className="text-xs">
              Instituição de origem
            </Badge>
          </div>
        )}

        {secondaryLinks.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">
              {OTHER_INSTITUTIONS_LABEL}
            </p>
            <ul className="space-y-1 text-sm text-gray-600">
              {secondaryLinks.map((link) => (
                <li key={link.institution_id} className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-400 shrink-0" />
                  {link.institution_name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h4 className="font-medium text-gray-800 mb-3">Instituições Vinculadas</h4>

      {originLink && (
        <div className="flex items-center gap-2 flex-wrap">
          <Building className="h-4 w-4 text-gray-500 shrink-0" />
          <span className="font-medium text-gray-900">{originLink.institution_name}</span>
          <Badge variant="secondary" className="text-xs">
            Instituição de origem
          </Badge>
        </div>
      )}

      {secondaryLinks.length > 0 && (
        <div className={originLink ? "mt-3" : undefined}>
          <p className="text-xs font-medium text-gray-500 mb-2">
            {OTHER_INSTITUTIONS_LABEL}
          </p>
          <div className="space-y-2 text-sm">
            {secondaryLinks.map((link) => (
              <div key={link.institution_id} className="flex items-center gap-2">
                <Building className="h-4 w-4 text-gray-500 shrink-0" />
                <span className="text-gray-700">{link.institution_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
