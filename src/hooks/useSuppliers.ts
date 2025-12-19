import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type {
  Tables,
  TablesInsert,
  TablesUpdate
} from "@/integrations/supabase/types";

type Supplier = Tables<"suppliers">;
type SupplierInsert = TablesInsert<"suppliers">;
type SupplierUpdate = TablesUpdate<"suppliers">;

export const useSuppliers = (institutionId?: string) => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["suppliers", institutionId || profile?.institution_id],
    queryFn: async () => {
      let query = supabase
        .from("suppliers")
        .select("*");

      // Se for instituição e não especificou institutionId, retorna apenas os seus
      // Se for admin e não especificou institutionId, retorna todos
      const finalInstitutionId = institutionId || (profile?.role === "institution" ? profile.institution_id : undefined);
      
      if (finalInstitutionId) {
        query = query.eq("institution_id", finalInstitutionId);
      }

      const { data, error } = await query.order("name");

      if (error) throw error;
      return data as Supplier[];
    },
    enabled: !!profile,
  });
};

export const useCreateSupplier = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (supplier: SupplierInsert) => {
      // Garantir que institution_id seja preenchido automaticamente
      const supplierWithInstitution = {
        ...supplier,
        institution_id: supplier.institution_id || profile?.institution_id || undefined,
      };

      if (!supplierWithInstitution.institution_id) {
        throw new Error("É necessário estar vinculado a uma instituição para criar fornecedores.");
      }

      const { data, error } = await supabase
        .from("suppliers")
        .insert(supplierWithInstitution)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      const institutionId = variables.institution_id || profile?.institution_id;
      queryClient.invalidateQueries({ queryKey: ["suppliers", institutionId] });
      toast({
        title: "Sucesso",
        description: "Fornecedor cadastrado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Erro ao cadastrar fornecedor: " + error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: SupplierUpdate & { id: string }) => {
      // Não permitir alterar institution_id se for usuário de instituição
      const finalUpdates = { ...updates };
      if (profile?.role === "institution" && updates.institution_id !== profile.institution_id) {
        delete finalUpdates.institution_id;
      }

      const { data, error } = await supabase
        .from("suppliers")
        .update(finalUpdates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const institutionId = data.institution_id || profile?.institution_id;
      queryClient.invalidateQueries({ queryKey: ["suppliers", institutionId] });
      toast({
        title: "Sucesso",
        description: "Fornecedor atualizado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar fornecedor: " + error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      // Verificar se há movimentações associadas
      const { data: movements, error: checkError } = await supabase
        .from("stock_movements")
        .select("id")
        .eq("supplier_id", id)
        .limit(1);

      if (checkError) throw checkError;

      if (movements && movements.length > 0) {
        throw new Error(
          "Não é possível excluir o fornecedor. Existem movimentações de estoque associadas a ele."
        );
      }

      // Buscar institution_id antes de deletar para invalidar cache
      const { data: supplier } = await supabase
        .from("suppliers")
        .select("institution_id")
        .eq("id", id)
        .single();

      const { error } = await supabase.from("suppliers").delete().eq("id", id);

      if (error) throw error;

      return supplier;
    },
    onSuccess: (supplier) => {
      const institutionId = supplier?.institution_id || profile?.institution_id;
      queryClient.invalidateQueries({ queryKey: ["suppliers", institutionId] });
      toast({
        title: "Sucesso",
        description: "Fornecedor excluído com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir fornecedor.",
        variant: "destructive",
      });
    },
  });
};

