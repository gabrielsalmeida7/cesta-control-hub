import { useState } from "react";
import { Building, Link, Unlink, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useInstitutions } from "@/hooks/useInstitutions";
import { useAssociateFamilyWithInstitution, useDisassociateFamilyFromInstitution } from "@/hooks/useFamilies";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";

type Family = Tables<'families'> & {
  institution_families?: Array<{
    institution_id: string;
    institution: {
      id: string;
      name: string;
    };
  }>;
};

interface FamilyInstitutionLinkProps {
  family: Family;
  onAssociationChange?: () => void;
}

const FamilyInstitutionLink = ({ family, onAssociationChange }: FamilyInstitutionLinkProps) => {
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [institutionToRemove, setInstitutionToRemove] = useState<{ id: string; name: string } | null>(null);

  const { profile } = useAuth();
  const { data: institutions = [], isLoading: institutionsLoading } = useInstitutions();
  const associateMutation = useAssociateFamilyWithInstitution();
  const disassociateMutation = useDisassociateFamilyFromInstitution();

  // Get currently associated institutions
  const associatedInstitutions = family.institution_families || [];
  const associatedInstitutionIds = associatedInstitutions.map(assoc => assoc.institution_id);
  
  // Get current institution (if any)
  const currentInstitution = associatedInstitutions.length > 0 
    ? associatedInstitutions[0].institution 
    : null;

  // Filter available institutions based on user role
  // NOVA REGRA: Uma família só pode ter UMA instituição
  const availableInstitutions = institutions.filter(inst => {
    // If admin, show all institutions not already associated
    if (profile?.role === 'admin') {
      // Se família já tem instituição vinculada, não mostrar nenhuma
      if (currentInstitution) {
        return false;
      }
      return true; // Admin pode vincular a qualquer instituição se família não tem vínculo
    }
    
    // If institution user, only show their own institution if family has no association
    if (profile?.role === 'institution' && profile?.institution_id) {
      // Se família já tem vínculo, não mostrar nenhuma
      if (currentInstitution) {
        return false;
      }
      // Só mostrar própria instituição se família não tem vínculo
      return inst.id === profile.institution_id;
    }
    
    return false;
  });

  // Check if family is already associated with another institution
  const isAssociatedWithOtherInstitution = currentInstitution && 
    profile?.role === 'institution' && 
    profile?.institution_id !== currentInstitution.id;

  // Check if user can remove association
  const canRemoveAssociation = (institutionId: string) => {
    if (profile?.role === 'admin') {
      return true; // Admin can remove from any institution
    }
    if (profile?.role === 'institution' && profile?.institution_id === institutionId) {
      return true; // Institution can only remove from their own institution
    }
    return false;
  };

  const handleAssociate = async () => {
    if (!selectedInstitutionId) return;

    setErrorMessage("");

    // Check if already associated with another institution
    if (currentInstitution && currentInstitution.id !== selectedInstitutionId) {
      setErrorMessage(`Esta família já está sendo atendida por ${currentInstitution.name}.`);
      return;
    }

    try {
      await associateMutation.mutateAsync({
        familyId: family.id,
        institutionId: selectedInstitutionId
      }, {
        onSuccess: () => {
          setSelectedInstitutionId("");
          setErrorMessage("");
          onAssociationChange?.();
        },
        onError: (error: any) => {
          if (error.message?.startsWith("FAMILY_ALREADY_ASSOCIATED:")) {
            setErrorMessage(`Esta família já está sendo atendida por ${error.institutionName || "outra instituição"}.`);
          } else {
            setErrorMessage(error.message || "Erro ao vincular família à instituição.");
          }
        }
      });
    } catch (error: any) {
      if (error.message?.startsWith("FAMILY_ALREADY_ASSOCIATED:")) {
        setErrorMessage(`Esta família já está sendo atendida por ${error.institutionName || "outra instituição"}.`);
      } else {
        setErrorMessage(error.message || "Erro ao vincular família à instituição.");
      }
    }
  };

  const handleRemoveClick = (institution: { id: string; name: string }) => {
    if (!canRemoveAssociation(institution.id)) {
      setErrorMessage("Você não tem permissão para remover este vínculo.");
      return;
    }
    setInstitutionToRemove(institution);
    setIsRemoveDialogOpen(true);
  };

  const handleConfirmRemove = async () => {
    if (!institutionToRemove) return;

    try {
      await disassociateMutation.mutateAsync({
        familyId: family.id,
        institutionId: institutionToRemove.id
      }, {
        onSuccess: () => {
          setIsRemoveDialogOpen(false);
          setInstitutionToRemove(null);
          setErrorMessage("");
          onAssociationChange?.();
        }
      });
    } catch (error: any) {
      setErrorMessage(error.message || "Erro ao remover vínculo da família.");
    }
  };

  return (
    <div className="space-y-3">
      {/* Current Association */}
      {currentInstitution && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Instituição Atual:</p>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Building className="h-3 w-3" />
              {currentInstitution.name}
            </Badge>
            {canRemoveAssociation(currentInstitution.id) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveClick(currentInstitution)}
                disabled={disassociateMutation.isPending}
                className="h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                {disassociateMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <Unlink className="h-3 w-3 mr-1" />
                    Remover
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Association with other institution warning */}
      {isAssociatedWithOtherInstitution && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Esta família já está sendo atendida por <strong>{currentInstitution.name}</strong>.
          </AlertDescription>
        </Alert>
      )}

      {/* Link Section - Só mostrar se família não tem vínculo */}
      {!currentInstitution && availableInstitutions.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Vincular a Instituição:</p>
          <div className="flex gap-2">
            <Select 
              value={selectedInstitutionId} 
              onValueChange={(value) => {
                setSelectedInstitutionId(value);
                setErrorMessage("");
              }}
              disabled={associateMutation.isPending}
            >
              <SelectTrigger className="flex-1">
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
            <Button 
              onClick={handleAssociate}
              disabled={!selectedInstitutionId || associateMutation.isPending}
              size="sm"
            >
              {associateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Vinculando...
                </>
              ) : (
                <>
                  <Link className="mr-2 h-4 w-4" />
                  Vincular
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Mensagem se família já tem vínculo e não pode vincular outra */}
      {currentInstitution && profile?.role === 'institution' && profile?.institution_id !== currentInstitution.id && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Atenção:</strong> Esta família já está vinculada a outra instituição. Cada família só pode estar vinculada a uma instituição.
          </p>
        </div>
      )}

      {/* No available institutions message */}
      {availableInstitutions.length === 0 && !currentInstitution && !isAssociatedWithOtherInstitution && (
        <p className="text-sm text-gray-500">
          {profile?.role === 'institution' 
            ? "Você não tem permissão para vincular famílias."
            : "Nenhuma instituição disponível para vincular."}
        </p>
      )}

      {/* Remove Confirmation Dialog */}
      <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar Remoção de Vínculo</DialogTitle>
          </DialogHeader>
          
          {institutionToRemove && (
            <div className="py-4">
              <p className="text-sm text-gray-600 mb-2">
                Tem certeza que deseja remover o vínculo da família <strong>{family.name}</strong> com a instituição <strong>{institutionToRemove.name}</strong>?
              </p>
              <p className="text-sm text-gray-500">
                Esta ação não pode ser desfeita.
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsRemoveDialogOpen(false);
                setInstitutionToRemove(null);
              }}
              disabled={disassociateMutation.isPending}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleConfirmRemove}
              disabled={disassociateMutation.isPending}
            >
              {disassociateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removendo...
                </>
              ) : (
                "Confirmar Remoção"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FamilyInstitutionLink;

