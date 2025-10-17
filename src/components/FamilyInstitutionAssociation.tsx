import { useState } from "react";
import { Building, Link, Unlink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useInstitutions } from "@/hooks/useInstitutions";
import { useAssociateFamilyWithInstitution, useDisassociateFamilyFromInstitution } from "@/hooks/useFamilies";
import type { Tables } from "@/integrations/supabase/types";

type Family = Tables<'families'> & {
  blocked_by_institution?: {
    name: string;
  };
  institution_families?: Array<{
    institution_id: string;
    institution: {
      id: string;
      name: string;
    };
  }>;
};

interface FamilyInstitutionAssociationProps {
  family: Family;
  onAssociationChange?: () => void;
}

const FamilyInstitutionAssociation = ({ family, onAssociationChange }: FamilyInstitutionAssociationProps) => {
  const [isAssociationDialogOpen, setIsAssociationDialogOpen] = useState(false);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>("");

  const { data: institutions = [], isLoading: institutionsLoading } = useInstitutions();
  const associateMutation = useAssociateFamilyWithInstitution();
  const disassociateMutation = useDisassociateFamilyFromInstitution();

  // Get currently associated institutions
  const associatedInstitutions = family.institution_families || [];
  const associatedInstitutionIds = associatedInstitutions.map(assoc => assoc.institution_id);
  
  // Get available institutions (not already associated)
  const availableInstitutions = institutions.filter(inst => !associatedInstitutionIds.includes(inst.id));

  const handleAssociate = () => {
    if (!selectedInstitutionId) return;

    associateMutation.mutate({
      familyId: family.id,
      institutionId: selectedInstitutionId
    }, {
      onSuccess: () => {
        setIsAssociationDialogOpen(false);
        setSelectedInstitutionId("");
        onAssociationChange?.();
      }
    });
  };

  const handleDisassociate = (institutionId: string) => {
    disassociateMutation.mutate({
      familyId: family.id,
      institutionId
    }, {
      onSuccess: () => {
        onAssociationChange?.();
      }
    });
  };

  return (
    <div className="space-y-3">
      {/* Associated Institutions */}
      {associatedInstitutions.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Instituições Associadas:</h4>
          <div className="flex flex-wrap gap-2">
            {associatedInstitutions.map((assoc) => (
              <Badge key={assoc.institution_id} variant="secondary" className="flex items-center gap-1">
                <Building className="h-3 w-3" />
                {assoc.institution.name}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-red-100"
                  onClick={() => handleDisassociate(assoc.institution_id)}
                  disabled={disassociateMutation.isPending}
                >
                  {disassociateMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Unlink className="h-3 w-3 text-red-500" />
                  )}
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Associate Button */}
      {availableInstitutions.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAssociationDialogOpen(true)}
          className="w-full"
        >
          <Link className="mr-2 h-4 w-4" />
          Vincular Instituição
        </Button>
      )}

      {/* Association Dialog */}
      <Dialog open={isAssociationDialogOpen} onOpenChange={setIsAssociationDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Vincular Família à Instituição</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Vincular <strong>{family.name}</strong> a uma instituição:
              </p>
              
              <Select value={selectedInstitutionId} onValueChange={setSelectedInstitutionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma instituição" />
                </SelectTrigger>
                <SelectContent>
                  {institutionsLoading ? (
                    <SelectItem value="" disabled>
                      Carregando instituições...
                    </SelectItem>
                  ) : availableInstitutions.length === 0 ? (
                    <SelectItem value="" disabled>
                      Nenhuma instituição disponível
                    </SelectItem>
                  ) : (
                    availableInstitutions.map((institution) => (
                      <SelectItem key={institution.id} value={institution.id}>
                        {institution.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAssociationDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAssociate}
              disabled={!selectedInstitutionId || associateMutation.isPending}
            >
              {associateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Vinculando...
                </>
              ) : (
                "Vincular"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FamilyInstitutionAssociation;
