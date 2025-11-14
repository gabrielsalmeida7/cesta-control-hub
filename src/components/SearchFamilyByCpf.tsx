import { useState } from "react";
import { Search, UserPlus, Link, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { searchFamilyByCpf, type FamilySearchResult } from "@/hooks/useFamilies";
import { useAssociateFamilyWithInstitution } from "@/hooks/useFamilies";
import { useAuth } from "@/hooks/useAuth";

interface SearchFamilyByCpfProps {
  onFamilyFound?: (familyId: string, cpf?: string) => void;
  onClose?: () => void;
}

// Função para formatar CPF com máscara
const formatCpf = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
};

const SearchFamilyByCpf = ({ onFamilyFound, onClose }: SearchFamilyByCpfProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBy, setSearchBy] = useState<"cpf" | "name">("cpf");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<FamilySearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { profile } = useAuth();
  const associateMutation = useAssociateFamilyWithInstitution();

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError("Digite um CPF ou nome para buscar.");
      return;
    }

    setIsSearching(true);
    setError(null);
    setSearchResult(null);

    try {
      const result = await searchFamilyByCpf(
        searchTerm,
        profile?.institution_id
      );
      setSearchResult(result);
    } catch (err: any) {
      setError(err.message || "Erro ao buscar família. Tente novamente.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAssociate = async () => {
    if (!searchResult?.family || !profile?.institution_id) return;

    try {
      await associateMutation.mutateAsync({
        familyId: searchResult.family.id,
        institutionId: profile.institution_id
      });
      
      // Chamar callback se fornecido
      if (onFamilyFound) {
        onFamilyFound(searchResult.family.id, searchResult.family.cpf || undefined);
      }
      
      // Limpar busca
      setSearchTerm("");
      setSearchResult(null);
    } catch (err) {
      // Erro já é tratado pelo hook
    }
  };

  const handleCreateNew = () => {
    if (!searchResult?.family) return;
    
    // Chamar callback com CPF preenchido (se houver)
    if (onFamilyFound) {
      onFamilyFound("", searchResult.family.cpf || undefined);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      {/* Campo de busca */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={
                searchBy === "cpf"
                  ? "Digite o CPF (000.000.000-00)"
                  : "Digite o nome da família"
              }
              value={searchTerm}
              onChange={(e) => {
                const value = e.target.value;
                if (searchBy === "cpf") {
                  // Aplicar máscara de CPF
                  const formatted = formatCpf(value);
                  setSearchTerm(formatted);
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

        {/* Toggle entre CPF e Nome */}
        <div className="flex gap-2 text-sm">
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
            Buscar por Nome
          </button>
        </div>
      </div>

      {/* Mensagem de erro */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Resultado da busca */}
      {searchResult && (
        <Card>
          <CardContent className="pt-6">
            {/* Cenário 1: Família encontrada e desvinculada */}
            {searchResult.scenario === 1 && searchResult.family && (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {searchResult.message}
                  </AlertDescription>
                </Alert>
                
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p><strong>Nome:</strong> {searchResult.family.name}</p>
                  <p><strong>Contato:</strong> {searchResult.family.contact_person}</p>
                  {searchResult.family.cpf && (
                    <p><strong>CPF:</strong> {formatCpf(searchResult.family.cpf)}</p>
                  )}
                  {searchResult.family.phone && (
                    <p><strong>Telefone:</strong> {searchResult.family.phone}</p>
                  )}
                  <p><strong>Membros:</strong> {searchResult.family.members_count || 1}</p>
                </div>

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

            {/* Cenário 2: Família já vinculada a outra instituição */}
            {searchResult.scenario === 2 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {searchResult.message}
                </AlertDescription>
              </Alert>
            )}

            {/* Cenário 3: Família não encontrada */}
            {searchResult.scenario === 3 && (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {searchResult.message}
                  </AlertDescription>
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

            {/* Cenário 4: Família já vinculada à própria instituição */}
            {searchResult.scenario === 4 && (
              <Alert>
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  {searchResult.message}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SearchFamilyByCpf;

