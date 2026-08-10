import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAuditLog } from "@/hooks/useAuditLog";
import { logger } from "@/utils/logger";
import {
  enrichDeliveriesWithFamilyDisplay,
  fetchFamiliesDisplayBatch,
} from "@/hooks/familyDisplayBatch";
import type {
  Tables,
  TablesInsert,
  TablesUpdate
} from "@/integrations/supabase/types";

type Delivery = Tables<"deliveries">;
type DeliveryInsert = TablesInsert<"deliveries">;
type DeliveryUpdate = TablesUpdate<"deliveries">;

const deliveryInstitutionSelect = `
  institution:institution_id(
    id,
    name,
    address,
    phone
  )
`;

export const useDeliveries = (institutionId?: string) => {
  return useQuery({
    queryKey: ["deliveries", institutionId],
    queryFn: async () => {
      let query = supabase
        .from("deliveries")
        .select(
          `
          *,
          ${deliveryInstitutionSelect}
        `
        )
        .order("delivery_date", { ascending: false });

      if (institutionId) {
        query = query.eq("institution_id", institutionId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return enrichDeliveriesWithFamilyDisplay(data ?? []);
    },
    enabled: true
  });
};

export const useCreateDelivery = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const { logAction } = useAuditLog();

  return useMutation({
    mutationFn: async (delivery: DeliveryInsert) => {
      const blockingPeriodDays = delivery.blocking_period_days ?? 30;
      if (
        !Number.isInteger(blockingPeriodDays) ||
        blockingPeriodDays <= 0 ||
        blockingPeriodDays > 999
      ) {
        throw new Error('Período de bloqueio inválido. Informe um número inteiro entre 1 e 999 dias.');
      }

      const { data: validationResult, error: validationError } = await supabase
        .rpc('validate_delivery', {
          p_family_id: delivery.family_id,
          p_institution_id: delivery.institution_id,
          p_blocking_justification: (delivery as any).blocking_justification || null,
          p_blocking_period_days: blockingPeriodDays,
        });

      if (validationError) {
        throw validationError;
      }

      if (validationResult && typeof validationResult === 'object') {
        const validation = validationResult as any;
        if (!validation.valid) {
          if (validation.error === 'BLOCKING_JUSTIFICATION_REQUIRED') {
            const error = new Error(validation.message || 'Justificativa obrigatória');
            (error as any).validationError = validation.error;
            (error as any).requiresJustification = true;
            throw error;
          }
          
          const error = new Error(validation.message || 'Validação falhou');
          (error as any).validationError = validation.error;
          (error as any).blockedByInstitutionName = validation.blocked_by_institution_name;
          (error as any).blockedUntil = validation.blocked_until;
          throw error;
        }
      }

      const { data, error } = await supabase
        .from("deliveries")
        .insert(delivery)
        .select(`*, ${deliveryInstitutionSelect}`)
        .single();

      if (error) throw error;

      const familyMap = await fetchFamiliesDisplayBatch([data.family_id]);
      const familyDisplay = familyMap.get(data.family_id) ?? null;

      const deliveryWithFamily = {
        ...data,
        family: familyDisplay,
      };

      logger.audit('DELIVERY_CREATE', user?.id || 'unknown', {
        delivery_id: data.id,
        family_id: data.family_id,
        institution_id: data.institution_id,
      });

      await logAction({
        actionType: 'DELIVERY_CREATE',
        tableName: 'deliveries',
        recordId: data.id,
        description: `Entrega registrada para família ${familyDisplay?.name || data.family_id}`,
        severity: 'INFO',
        newData: {
          id: data.id,
          family_id: data.family_id,
          institution_id: data.institution_id,
          delivery_date: data.delivery_date,
        },
      });

      return deliveryWithFamily;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['institution-deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['admin-recent-deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['deliveries-by-institution'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['families'] });
      queryClient.invalidateQueries({ queryKey: ['institution-families'] });
      toast({
        title: "Sucesso",
        description: "Entrega registrada com sucesso!"
      });
    },
    onError: (error: any) => {
      if (error.validationError === 'FAMILY_BLOCKED') {
        const institutionName = error.blockedByInstitutionName || "outra instituição";
        const blockedUntil = error.blockedUntil ? new Date(error.blockedUntil).toLocaleDateString('pt-BR') : "data não definida";
        toast({
          title: "Família Bloqueada",
          description: `Esta família já foi atendida pela instituição ${institutionName}. Não é possível realizar nova entrega até ${blockedUntil}.`,
          variant: "destructive"
        });
      } else if (error.validationError === 'FAMILY_NOT_ASSOCIATED') {
        toast({
          title: "Família Não Vinculada",
          description: error.message || "Esta família não está vinculada à sua instituição. Por favor, vincule a família primeiro.",
          variant: "destructive"
        });
      } else if (error.validationError === 'FAMILY_NOT_FOUND') {
        toast({
          title: "Família Não Encontrada",
          description: error.message || "Família não encontrada.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erro",
          description: error.message || "Erro ao registrar entrega. Tente novamente.",
          variant: "destructive"
        });
      }
    }
  });
};

export const useUpdateDelivery = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      updates
    }: {
      id: string;
      updates: DeliveryUpdate;
    }) => {
      const { data, error } = await supabase
        .from("deliveries")
        .update(updates)
        .eq("id", id)
        .select(`*, ${deliveryInstitutionSelect}`)
        .single();

      if (error) throw error;

      const familyMap = await fetchFamiliesDisplayBatch([data.family_id]);
      return {
        ...data,
        family: familyMap.get(data.family_id) ?? null,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['institution-deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['admin-recent-deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['deliveries-by-institution'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: "Sucesso",
        description: "Entrega atualizada com sucesso!"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar entrega: " + error.message,
        variant: "destructive"
      });
    }
  });
};

export const useDeleteDelivery = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("deliveries").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['institution-deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['admin-recent-deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['deliveries-by-institution'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: "Sucesso",
        description: "Entrega excluída com sucesso!"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao excluir entrega: " + error.message,
        variant: "destructive"
      });
    }
  });
};
