/**
 * Hook para gerenciamento de consentimento LGPD
 * 
 * Gerencia coleta, armazenamento e revogação de consentimento
 * para tratamento de dados pessoais conforme LGPD
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  generateConsentTermPDF, 
  generateTermId, 
  type ConsentTermData 
} from "@/utils/consentTermGenerator";

export const useConsentManagement = () => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * Gera termo de consentimento em PDF
   */
  const generateTerm = useCallback(async (
    data: Omit<ConsentTermData, 'termId' | 'generatedAt'>
  ): Promise<{ blob: Blob; termId: string } | null> => {
    setIsGenerating(true);
    
    try {
      const termId = generateTermId();
      const generatedAt = new Date().toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const termData: ConsentTermData = {
        ...data,
        termId,
        generatedAt
      };

      const blob = await generateConsentTermPDF(termData);

      toast({
        title: "Termo Gerado",
        description: "Termo de consentimento gerado com sucesso. Pronto para impressão.",
      });

      return { blob, termId };
    } catch (error) {
      console.error('Erro ao gerar termo:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar termo de consentimento. Tente novamente.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [toast]);

  /**
   * Baixa o PDF do termo gerado
   */
  const downloadTerm = useCallback((blob: Blob, familyName: string, termId: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Termo_Consentimento_${familyName.replace(/\s+/g, '_')}_${termId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  /**
   * Registra consentimento digital no banco de dados
   */
  const recordDigitalConsent = useCallback(async (familyId: string) => {
    try {
      const { error } = await supabase
        .from('families')
        .update({
          consent_given_at: new Date().toISOString()
        })
        .eq('id', familyId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Erro ao registrar consentimento:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar consentimento digital.",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  /**
   * Registra geração do termo no banco de dados
   */
  const recordTermGeneration = useCallback(async (
    familyId: string,
    termId: string
  ) => {
    try {
      const { error } = await supabase
        .from('families')
        .update({
          consent_term_generated_at: new Date().toISOString(),
          consent_term_id: termId
        })
        .eq('id', familyId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Erro ao registrar geração de termo:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar geração do termo.",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  /**
   * Marca termo como assinado fisicamente
   */
  const markAsSigned = useCallback(async (familyId: string) => {
    try {
      const { error } = await supabase
        .from('families')
        .update({
          consent_term_signed: true
        })
        .eq('id', familyId);

      if (error) throw error;

      toast({
        title: "Registrado",
        description: "Termo marcado como assinado com sucesso.",
      });

      return true;
    } catch (error) {
      console.error('Erro ao marcar termo como assinado:', error);
      toast({
        title: "Erro",
        description: "Erro ao marcar termo como assinado.",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  /**
   * Revoga consentimento
   */
  const revokeConsent = useCallback(async (
    familyId: string,
    reason?: string
  ) => {
    try {
      const { error } = await supabase
        .from('families')
        .update({
          consent_revoked_at: new Date().toISOString(),
          consent_revocation_reason: reason || 'Revogação solicitada pelo titular'
        })
        .eq('id', familyId);

      if (error) throw error;

      toast({
        title: "Consentimento Revogado",
        description: "O consentimento foi revogado com sucesso.",
      });

      return true;
    } catch (error) {
      console.error('Erro ao revogar consentimento:', error);
      toast({
        title: "Erro",
        description: "Erro ao revogar consentimento.",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  /**
   * Verifica se família tem consentimento válido
   */
  const hasValidConsent = useCallback((family: any): boolean => {
    // Se consentimento foi revogado, não é válido
    if (family.consent_revoked_at) {
      return false;
    }

    // Deve ter consentimento digital OU termo assinado
    return !!(family.consent_given_at || family.consent_term_signed);
  }, []);

  /**
   * Obtém status do consentimento
   */
  const getConsentStatus = useCallback((family: any): {
    hasDigitalConsent: boolean;
    hasTermGenerated: boolean;
    isTermSigned: boolean;
    isRevoked: boolean;
    isValid: boolean;
  } => {
    return {
      hasDigitalConsent: !!family.consent_given_at,
      hasTermGenerated: !!family.consent_term_generated_at,
      isTermSigned: !!family.consent_term_signed,
      isRevoked: !!family.consent_revoked_at,
      isValid: hasValidConsent(family)
    };
  }, [hasValidConsent]);

  return {
    generateTerm,
    downloadTerm,
    recordDigitalConsent,
    recordTermGeneration,
    markAsSigned,
    revokeConsent,
    hasValidConsent,
    getConsentStatus,
    isGenerating
  };
};

