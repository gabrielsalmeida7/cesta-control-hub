import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type {
  Tables,
  TablesInsert
} from "@/integrations/supabase/types";

type Inventory = Tables<"inventory">;
type StockMovement = Tables<"stock_movements">;
type StockMovementInsert = TablesInsert<"stock_movements">;

interface StockMovementFilters {
  startDate?: string;
  endDate?: string;
  movementType?: "ENTRADA" | "SAIDA";
  productId?: string;
  institutionId?: string;
}

export const useInventory = (institutionId?: string) => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["inventory", institutionId || profile?.institution_id],
    queryFn: async () => {
      let query = supabase
        .from("inventory")
        .select(`
          *,
          product:products(
            id,
            name,
            unit,
            description
          ),
          institution:institutions(
            id,
            name
          )
        `);

      // Se for admin e não especificou institutionId, retorna todos
      // Se for instituição, retorna apenas o seu estoque
      if (profile?.role === "institution" && !institutionId) {
        query = query.eq("institution_id", profile.institution_id!);
      } else if (institutionId) {
        query = query.eq("institution_id", institutionId);
      }

      const { data, error } = await query.order("last_movement_date", {
        ascending: false,
      });

      if (error) throw error;
      return data as (Inventory & {
        product: { id: string; name: string; unit: string; description: string | null };
        institution: { id: string; name: string };
      })[];
    },
    enabled: !!profile,
  });
};

export const useStockMovements = (filters?: StockMovementFilters) => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["stock-movements", filters, profile?.institution_id],
    queryFn: async () => {
      let query = supabase
        .from("stock_movements")
        .select(`
          *,
          product:products(
            id,
            name,
            unit
          ),
          supplier:suppliers(
            id,
            name
          ),
          institution:institutions!stock_movements_institution_id_fkey(
            id,
            name
          ),
          delivery:deliveries(
            id,
            delivery_date,
            family:families(
              id,
              name
            )
          )
        `);

      // Se for instituição, filtrar apenas suas movimentações
      if (profile?.role === "institution" && !filters?.institutionId) {
        query = query.eq("institution_id", profile.institution_id!);
      } else if (filters?.institutionId) {
        query = query.eq("institution_id", filters.institutionId);
      }

      if (filters?.startDate) {
        query = query.gte("movement_date", filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte("movement_date", filters.endDate);
      }

      if (filters?.movementType) {
        query = query.eq("movement_type", filters.movementType);
      }

      if (filters?.productId) {
        query = query.eq("product_id", filters.productId);
      }

      const { data, error } = await query.order("movement_date", {
        ascending: false,
      });

      if (error) {
        console.error('❌ Erro ao buscar movimentações:', error);
        throw error;
      }

      console.log('✅ Movimentações encontradas:', (data || []).length);
      return data as (StockMovement & {
        product: { id: string; name: string; unit: string };
        supplier: { id: string; name: string } | null;
        institution: { id: string; name: string };
        delivery: {
          id: string;
          delivery_date: string | null;
          family: { id: string; name: string } | null;
        } | null;
      })[];
    },
    enabled: !!profile,
  });
};

export const useCreateStockMovement = () => {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (movement: StockMovementInsert) => {
      // Validar estoque suficiente para saídas
      if (movement.movement_type === "SAIDA") {
        const { data: inventory, error: inventoryError } = await supabase
          .from("inventory")
          .select("quantity")
          .eq("institution_id", movement.institution_id)
          .eq("product_id", movement.product_id)
          .single();

        if (inventoryError && inventoryError.code !== "PGRST116") {
          throw inventoryError;
        }

        const currentQuantity = inventory?.quantity || 0;
        if (currentQuantity < movement.quantity) {
          throw new Error(
            `Estoque insuficiente. Quantidade disponível: ${currentQuantity}, quantidade solicitada: ${movement.quantity}`
          );
        }
      }

      // Movimentação normal
      const { data, error } = await supabase
        .from("stock_movements")
        .insert({
          ...movement,
          created_by_user_id: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast({
        title: "Sucesso",
        description: "Movimentação registrada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao registrar movimentação.",
        variant: "destructive",
      });
    },
  });
};

