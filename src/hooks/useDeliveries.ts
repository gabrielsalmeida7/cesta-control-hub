import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type {
  Tables,
  TablesInsert,
  TablesUpdate
} from "@/integrations/supabase/types";

type Delivery = Tables<"deliveries">;
type DeliveryInsert = TablesInsert<"deliveries">;
type DeliveryUpdate = TablesUpdate<"deliveries">;

export const useDeliveries = (institutionId?: string) => {
  return useQuery({
    queryKey: ["deliveries", institutionId],
    queryFn: async () => {
      let query = supabase
        .from("deliveries")
        .select(
          `
          *,
          family:family_id(
            id,
            name,
            contact_person,
            members_count,
            is_blocked,
            blocked_until,
            block_reason,
            blocked_by_institution:blocked_by_institution_id(name)
          ),
          institution:institution_id(
            id,
            name,
            address,
            phone
          )
        `
        )
        .order("delivery_date", { ascending: false });

      if (institutionId) {
        query = query.eq("institution_id", institutionId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
    enabled: true
  });
};

export const useCreateDelivery = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (delivery: DeliveryInsert) => {
      const { data, error } = await supabase
        .from("deliveries")
        .insert(delivery)
        .select(
          `
          *,
          family:family_id(
            id,
            name,
            contact_person,
            members_count,
            is_blocked,
            blocked_until,
            block_reason,
            blocked_by_institution:blocked_by_institution_id(name)
          ),
          institution:institution_id(
            id,
            name,
            address,
            phone
          )
        `
        )
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["families"] });
      queryClient.invalidateQueries({ queryKey: ["institution-families"] });
      toast({
        title: "Sucesso",
        description: "Entrega registrada com sucesso!"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao registrar entrega: " + error.message,
        variant: "destructive"
      });
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
        .select(
          `
          *,
          family:family_id(
            id,
            name,
            contact_person,
            members_count,
            is_blocked,
            blocked_until,
            block_reason,
            blocked_by_institution:blocked_by_institution_id(name)
          ),
          institution:institution_id(
            id,
            name,
            address,
            phone
          )
        `
        )
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["families"] });
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
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["families"] });
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
