import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type {
  Tables,
  TablesInsert,
  TablesUpdate
} from "@/integrations/supabase/types";

type Product = Tables<"products">;
type ProductInsert = TablesInsert<"products">;
type ProductUpdate = TablesUpdate<"products">;

export const useProducts = (institutionId?: string) => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["products", institutionId || profile?.institution_id],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*")
        .eq("is_active", true);

      // Se for instituição e não especificou institutionId, retorna apenas os seus
      // Se for admin e não especificou institutionId, retorna todos
      const finalInstitutionId = institutionId || (profile?.role === "institution" ? profile.institution_id : undefined);
      
      if (finalInstitutionId) {
        query = query.eq("institution_id", finalInstitutionId);
      }

      const { data, error } = await query.order("name");

      if (error) throw error;
      return data as Product[];
    },
    enabled: !!profile,
  });
};

export const useAllProducts = (institutionId?: string) => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["products", "all", institutionId || profile?.institution_id],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*");

      // Se for instituição e não especificou institutionId, retorna apenas os seus
      // Se for admin e não especificou institutionId, retorna todos
      const finalInstitutionId = institutionId || (profile?.role === "institution" ? profile.institution_id : undefined);
      
      if (finalInstitutionId) {
        query = query.eq("institution_id", finalInstitutionId);
      }

      const { data, error } = await query.order("name");

      if (error) throw error;
      return data as Product[];
    },
    enabled: !!profile,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (product: ProductInsert) => {
      // Garantir que institution_id seja preenchido automaticamente
      const productWithInstitution = {
        ...product,
        institution_id: product.institution_id || profile?.institution_id || undefined,
      };

      if (!productWithInstitution.institution_id) {
        throw new Error("É necessário estar vinculado a uma instituição para criar produtos.");
      }

      const { data, error } = await supabase
        .from("products")
        .insert(productWithInstitution)
        .select()
        .single();

      if (error) {
        // Verificar se é erro de nome duplicado
        if (error.code === "23505" || error.message?.includes("duplicate")) {
          throw new Error("Já existe um produto cadastrado com este nome nesta instituição.");
        }
        throw error;
      }
      return data;
    },
    onSuccess: (_, variables) => {
      const institutionId = variables.institution_id || profile?.institution_id;
      queryClient.invalidateQueries({ queryKey: ["products", institutionId] });
      queryClient.invalidateQueries({ queryKey: ["products", "all", institutionId] });
      toast({
        title: "Sucesso",
        description: "Produto cadastrado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao cadastrar produto.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: ProductUpdate & { id: string }) => {
      // Não permitir alterar institution_id se for usuário de instituição
      const finalUpdates = { ...updates };
      if (profile?.role === "institution" && updates.institution_id !== profile.institution_id) {
        delete finalUpdates.institution_id;
      }

      const { data, error } = await supabase
        .from("products")
        .update(finalUpdates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const institutionId = data.institution_id || profile?.institution_id;
      queryClient.invalidateQueries({ queryKey: ["products", institutionId] });
      queryClient.invalidateQueries({ queryKey: ["products", "all", institutionId] });
      toast({
        title: "Sucesso",
        description: "Produto atualizado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar produto: " + error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      // Buscar institution_id antes de atualizar para invalidar cache
      const { data: product } = await supabase
        .from("products")
        .select("institution_id")
        .eq("id", id)
        .single();

      // Soft delete: desativar produto ao invés de deletar
      const { error } = await supabase
        .from("products")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;

      return product;
    },
    onSuccess: (product) => {
      const institutionId = product?.institution_id || profile?.institution_id;
      queryClient.invalidateQueries({ queryKey: ["products", institutionId] });
      queryClient.invalidateQueries({ queryKey: ["products", "all", institutionId] });
      toast({
        title: "Sucesso",
        description: "Produto desativado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Erro ao desativar produto: " + error.message,
        variant: "destructive",
      });
    },
  });
};

