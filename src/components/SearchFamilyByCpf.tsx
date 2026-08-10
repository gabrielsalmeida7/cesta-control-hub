import { useState } from "react";
import { Search, UserPlus, Link, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import {
  searchFamilyByCpf,
  type FamilySearchResult,
  type FamilySearchPreview,
} from "@/hooks/useFamilies";
import { FamilyInstitutionLinksBlock } from "@/components/institution/FamilyInstitutionLinksBlock";
import { useAssociateFamilyWithInstitution } from "@/hooks/useFamilies";
import { useAuth } from "@/hooks/useAuth";

interface SearchFamilyByCpfProps {
  onFamilyFound?: (familyId: string, cpf?: string) => void;
  onClose?: () => void;
}

const formatCpf = (value: string): string => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  }
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
};

const renderFamilyPreview = (family: FamilySearchPreview) => (
  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
    <p>
      <strong>Nome:</strong> {family.name}
    </p>
    <p>
      <strong>Titular:</strong> {family.contact_person}
    </p>
    <p>
      <strong>CPF:</strong> {family.cpf_masked}
    </p>
    <p>
      <strong>Membros:</strong> {family.members_count || 1}
    </p>
    {family.phone && (
      <p>
        <strong>Telefone:</strong> {family.phone}
      </p>
    )}
  </div>
);

const SearchFamilyByCpf = ({ onFamilyFound, onClose }: SearchFamilyByCpfProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBy, setSearchBy] = useState<"cpf" | "name" | "mother_name">("cpf");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<FamilySearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { profile } = useAuth();
  const associateMutation = useAssociateFamilyWithInstitution();

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError("Digite um CPF, nome da família ou nome da mãe para buscar.");
      return;
    }

    setIsSearching(true);
    setError(null);
    setSearchResult(null);

    try {
      const result = await searchFamilyByCpf(
        searchTerm,
        profile?.institution_id,
        searchBy
      );
      setSearchResult(result);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro ao buscar família. Tente novamente.";
      setError(message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAssociate = async () => {
    if (!searchResult?.family || !profile?.institution_id) return;

    try {
      await associateMutation.mutateAsync({
        familyId: searchResult.family.id,
        institutionId: profile.institution_id,
      });

      if (onFamilyFound) {
        onFamilyFound(searchResult.family.id);
      }

      setSearchTerm("");
      setSearchResult(null);
    } catch {
      // Erro já é tratado pelo hook
    }
  };

  const handleAssociateMultiple = async (familyId: string) => {
    if (!profile?.institution_id) return;

    try {
      await associateMutation.mutateAsync({
        familyId,
        institutionId: profile.institution_id,
      });

      if (onFamilyFound) {
        onFamilyFound(familyId);
      }

      setSearchTerm("");
      setSearchResult(null);
    } catch {
      // Erro já é tratado pelo hook
    }
  };

  const handleCreateNew = () => {
    if (onFamilyFound) {
      onFamilyFound("", undefined);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={
                searchBy === "cpf"
                  ? "Digite o CPF (000.000.000-00)"
                  : searchBy === "name"
                    ? "Digite o nome da família"
                    : "Digite o nome da mãe"
              }
              value={searchTerm}
              onChange={(e) => {
                const value = e.target.value;
                if (searchBy === "cpf") {
                  setSearchTerm(formatCpf(value));
                } else {
                  setSearchTerm(value);
                }
              }}
              onKeyPress={handleKeyPress}
              className="pl-10"
              maxLength={searchBy === "cpf" ? 14 : undefined}
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={isSearching || !searchTerm.trim()}
            className="bg-primary hover:bg-primary/90"
          >
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </>
            )}
          </Button>
        </div>

        <div className="flex gap-2 text-sm flex-wrap">
          <button
            type="button"
            onClick={() => {
              setSearchBy("cpf");
              setSearchTerm("");
              setSearchResult(null);
              setError(null);
            }}
            className={`px-3 py-1 rounded ${
              searchBy === "cpf"
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Buscar por CPF
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchBy("name");
              setSearchTerm("");
              setSearchResult(null);
              setError(null);
            }}
            className={`px-3 py-1 rounded ${
              searchBy === "name"
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Buscar por Nome da Família
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchBy("mother_name");
              setSearchTerm("");
              setSearchResult(null);
              setError(null);
            }}
            className={`px-3 py-1 rounded ${
              searchBy === "mother_name"
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Buscar por Nome da Mãe
          </button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {searchResult && (
        <Card>
          <CardContent className="pt-6">
            {searchResult.scenario === 1 && searchResult.family && (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {searchResult.message}
                  </AlertDescription>
                </Alert>

                {renderFamilyPreview(searchResult.family)}

                <Button
                  onClick={handleAssociate}
                  disabled={associateMutation.isPending}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {associateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Vinculando...
                    </>
                  ) : (
                    <>
                      <Link className="mr-2 h-4 w-4" />
                      Vincular à Minha Instituição
                    </>
                  )}
                </Button>
              </div>
            )}

            {searchResult.scenario === 2 && searchResult.family && (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    {searchResult.message}
                  </AlertDescription>
                </Alert>

                {renderFamilyPreview(searchResult.family)}

                {searchResult.institutionLinks && (
                  <FamilyInstitutionLinksBlock
                    links={searchResult.institutionLinks}
                    variant="compact"
                  />
                )}

                <Button
                  onClick={handleAssociate}
                  disabled={associateMutation.isPending}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {associateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Vinculando...
                    </>
                  ) : (
                    <>
                      <Link className="mr-2 h-4 w-4" />
                      Vincular à Minha Instituição
                    </>
                  )}
                </Button>
              </div>
            )}

            {searchResult.scenario === 3 && (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{searchResult.message}</AlertDescription>
                </Alert>

                <Button
                  onClick={handleCreateNew}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Cadastrar Nova Família
                </Button>
              </div>
            )}

            {searchResult.scenario === 4 && (
              <Alert>
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  {searchResult.message}
                </AlertDescription>
              </Alert>
            )}

            {searchResult.scenario === 5 && searchResult.families && (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    {searchResult.message} ({searchResult.families.length} encontrada(s))
                  </AlertDescription>
                </Alert>

                <div className="max-h-96 overflow-y-auto space-y-3">
                  {searchResult.families.map((family) => (
                    <Card key={family.id}>
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          {renderFamilyPreview(family)}

                          {family.is_linked_to_current ? (
                            <Alert>
                              <CheckCircle className="h-4 w-4 text-blue-600" />
                              <AlertDescription className="text-blue-800 text-sm">
                                Esta família já está vinculada à sua instituição.
                              </AlertDescription>
                            </Alert>
                          ) : (
                            <Button
                              onClick={() => handleAssociateMultiple(family.id)}
                              disabled={associateMutation.isPending}
                              className="w-full bg-primary hover:bg-primary/90"
                            >
                              {associateMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Vinculando...
                                </>
                              ) : (
                                <>
                                  <Link className="mr-2 h-4 w-4" />
                                  Vincular à Minha Instituição
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SearchFamilyByCpf;
