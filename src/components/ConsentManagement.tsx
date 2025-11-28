/**
 * Componente para gerenciamento de consentimento LGPD nos formulários
 * 
 * Inclui:
 * - Checkbox de consentimento digital
 * - Botão para gerar termo impresso
 * - Checkbox de confirmação de assinatura
 * - Link para política de privacidade
 */

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FileText, Download, ExternalLink, CheckCircle2 } from "lucide-react";
import { useConsentManagement } from "@/hooks/useConsentManagement";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ConsentManagementProps {
  familyName: string;
  familyCpf?: string;
  contactPerson: string;
  phone?: string;
  address?: string;
  institutionName: string;
  consentGiven: boolean;
  termSigned: boolean;
  onConsentChange: (given: boolean) => void;
  onTermSignedChange: (signed: boolean) => void;
  disabled?: boolean;
  familyId?: string; // Para família já existente
  mode?: 'create' | 'edit'; // Modo: criação ou edição
}

const ConsentManagement = ({
  familyName,
  familyCpf,
  contactPerson,
  phone,
  address,
  institutionName,
  consentGiven,
  termSigned,
  onConsentChange,
  onTermSignedChange,
  disabled = false,
  mode = 'create'
}: ConsentManagementProps) => {
  const {
    generateTerm,
    downloadTerm,
    isGenerating
  } = useConsentManagement();
  
  const [termGenerated, setTermGenerated] = useState(false);
  const [lastGeneratedBlob, setLastGeneratedBlob] = useState<Blob | null>(null);

  const handleGenerateTerm = async () => {
    const result = await generateTerm({
      familyName: familyName || "Família",
      familyCpf,
      contactPerson: contactPerson || "Titular",
      phone,
      address,
      institutionName
    });

    if (result) {
      setTermGenerated(true);
      setLastGeneratedBlob(result.blob);
      
      // Auto-download
      downloadTerm(result.blob, familyName || "Familia", result.termId);
    }
  };

  return (
    <div className="space-y-4 border-t pt-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Consentimento para Tratamento de Dados (LGPD)
        </h4>
        
        <div className="space-y-3">
          {/* Checkbox de consentimento digital */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="digital-consent"
              checked={consentGiven}
              onCheckedChange={(checked) => onConsentChange(checked as boolean)}
              disabled={disabled}
            />
            <label
              htmlFor="digital-consent"
              className="text-sm text-gray-700 cursor-pointer leading-relaxed"
            >
              Declaro que li e aceito a{" "}
              <Link
                to="/politica-privacidade"
                target="_blank"
                className="text-blue-600 underline inline-flex items-center gap-1"
              >
                Política de Privacidade
                <ExternalLink className="h-3 w-3" />
              </Link>
              {" "}e autorizo o tratamento dos meus dados pessoais para as finalidades descritas.
            </label>
          </div>

          {/* Botão para gerar termo impresso */}
          <div className="border-t pt-3">
            <p className="text-xs text-gray-600 mb-2">
              <strong>Recomendado:</strong> Gere o termo de consentimento impresso para coleta de assinatura física
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerateTerm}
              disabled={isGenerating || disabled || !familyName || !contactPerson}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Download className="mr-2 h-4 w-4 animate-pulse" />
                  Gerando PDF...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  {termGenerated ? "Gerar Novamente" : "Gerar Termo de Consentimento (PDF)"}
                </>
              )}
            </Button>
            
            {termGenerated && (
              <Alert className="mt-2 bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-xs text-green-800">
                  Termo gerado com sucesso! Imprima 2 vias para coleta de assinaturas.
                  {lastGeneratedBlob && (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="ml-2 h-auto p-0 text-green-700 underline"
                      onClick={() => {
                        if (lastGeneratedBlob) {
                          downloadTerm(lastGeneratedBlob, familyName || "Familia", "REPRINT");
                        }
                      }}
                    >
                      Baixar novamente
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Checkbox de confirmação de assinatura física */}
          {(termGenerated || mode === 'edit') && (
            <div className="border-t pt-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="term-signed"
                  checked={termSigned}
                  onCheckedChange={(checked) => onTermSignedChange(checked as boolean)}
                  disabled={disabled}
                />
                <label
                  htmlFor="term-signed"
                  className="text-sm text-gray-700 cursor-pointer leading-relaxed"
                >
                  <strong>Confirmo que o termo de consentimento foi impresso, assinado fisicamente pelo titular</strong> e arquivado em 2 vias (1 para titular, 1 para instituição).
                </label>
              </div>
            </div>
          )}

          {/* Avisos */}
          <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
            <p>
              ℹ️ <strong>O consentimento é necessário</strong> para cadastrar a família no sistema.
            </p>
            <p>
              ℹ️ O titular pode revogar o consentimento a qualquer momento entrando em contato com o DPO.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsentManagement;

