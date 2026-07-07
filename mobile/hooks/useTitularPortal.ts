import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';
import { cleanCpf } from '@/utils/validation';
import { formatCpf } from '@/utils/documentFormat';
import { logger } from '@/utils/logger';

export type TitularRequestType =
  | 'access'
  | 'correction'
  | 'portability'
  | 'deletion'
  | 'revoke'
  | 'info';

export const TITULAR_REQUEST_OPTIONS: Array<{ id: TitularRequestType; label: string; detail: string }> =
  [
    {
      id: 'access',
      label: 'Acesso aos Dados',
      detail: 'Solicitar cópia de todos os seus dados pessoais que possuímos',
    },
    {
      id: 'correction',
      label: 'Correção de Dados',
      detail: 'Corrigir informações incompletas, inexatas ou desatualizadas',
    },
    {
      id: 'portability',
      label: 'Portabilidade',
      detail: 'Obter seus dados em formato estruturado (JSON/CSV)',
    },
    {
      id: 'deletion',
      label: 'Eliminação de Dados',
      detail: 'Solicitar a exclusão completa de seus dados pessoais',
    },
    {
      id: 'revoke',
      label: 'Revogar Consentimento',
      detail: 'Retirar seu consentimento para tratamento de dados',
    },
    {
      id: 'info',
      label: 'Informações sobre Tratamento',
      detail: 'Saber com quem compartilhamos seus dados e para quais finalidades',
    },
  ];

interface SubmitTitularRequestInput {
  cpf: string;
  requestType: TitularRequestType;
  message?: string;
}

export function useTitularPortal() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitRequest = useCallback(
    async ({ cpf, requestType, message }: SubmitTitularRequestInput): Promise<boolean> => {
      const cleanedCpf = cleanCpf(cpf);

      if (cleanedCpf.length !== 11) {
        toast({
          title: 'CPF inválido',
          description: 'Informe um CPF válido com 11 dígitos.',
          variant: 'destructive',
        });
        return false;
      }

      const requestLabel =
        TITULAR_REQUEST_OPTIONS.find((option) => option.id === requestType)?.label ?? requestType;

      setIsSubmitting(true);

      try {
        const { error } = await supabase.rpc('audit_log', {
          p_action_type: 'DATA_ACCESS',
          p_table_name: 'lgpd_titular_requests',
          p_description: `Solicitação LGPD via portal mobile: ${requestLabel}`,
          p_severity: 'INFO',
          p_new_data: {
            source: 'mobile_portal',
            cpf: cleanedCpf,
            request_type: requestType,
            message: message?.trim() || null,
            submitted_at: new Date().toISOString(),
          },
        });

        if (error) {
          throw error;
        }

        toast({
          title: 'Solicitação enviada',
          description:
            'Sua solicitação foi registrada e será processada em até 15 dias úteis. Você receberá retorno no email cadastrado.',
        });

        return true;
      } catch (error) {
        logger.error('Falha ao registrar solicitação LGPD', {
          requestType,
          error: error instanceof Error ? error.message : String(error),
        });

        toast({
          title: 'Não foi possível enviar',
          description:
            'Tente novamente ou entre em contato com o DPO em dpo@cestacontrolhub.com.br.',
          variant: 'destructive',
        });

        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [toast]
  );

  const formatCpfInput = useCallback((value: string) => formatCpf(value), []);

  return {
    submitRequest,
    isSubmitting,
    formatCpfInput,
    requestOptions: TITULAR_REQUEST_OPTIONS,
  };
}
