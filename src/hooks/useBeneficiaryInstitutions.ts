import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type {
  Tables,
  TablesInsert,
  TablesUpdate
} from "@/integrations/supabase/types";

type BeneficiaryInstitution = Tables<"beneficiary_institutions">;
type BeneficiaryInstitutionInsert = TablesInsert<"beneficiary_institutions">;
type BeneficiaryInstitutionUpdate = TablesUpdate<"beneficiary_institutions">;

export const useBeneficiaryInstitutions = (institutionId?: string) => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["beneficiary-institutions", institutionId || profile?.institution_id],
    queryFn: async () => {
      const finalInstitutionId =
        institutionId || (profile?.role === "institution" ? profile.institution_id : undefined);

      if (!finalInstitutionId) {
        return [];
      }

      const { data, error } = await supabase
        .from("beneficiary_institutions")
        .select("*")
        .eq("institution_id", finalInstitutionId)
        .order("full_name");

      if (error) throw error;
      return (data ?? []) as BeneficiaryInstitution[];
    },
    enabled: !!profile && !!((institutionId || profile?.institution_id)),
  });
};

export const useCreateBeneficiaryInstitution = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (data: BeneficiaryInstitutionInsert) => {
      const withInstitution = {
        ...data,
        institution_id: data.institution_id || profile?.institution_id!,
      };

      if (!withInstitution.institution_id) {
        throw new Error("É necessário estar vinculado a uma instituição para criar instituição beneficiada.");
      }

      const { data: row, error } = await supabase
        .from("beneficiary_institutions")
        .insert(withInstitution)
        .select()
        .single();

      if (error) throw error;
      return row;
    },
    onSuccess: (_, variables) => {
      const instId = variables.institution_id || profile?.institution_id;
      queryClient.invalidateQueries({ queryKey: ["beneficiary-institutions", instId] });
      toast({
        title: "Sucesso",
        description: "Instituição beneficiada cadastrada com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: "Erro ao cadastrar instituição beneficiada: " + error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateBeneficiaryInstitution = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: BeneficiaryInstitutionUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("beneficiary_institutions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const instId = data.institution_id || profile?.institution_id;
      queryClient.invalidateQueries({ queryKey: ["beneficiary-institutions", instId] });
      toast({
        title: "Sucesso",
        description: "Instituição beneficiada atualizada com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar instituição beneficiada: " + error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteBeneficiaryInstitution = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: row } = await supabase
        .from("beneficiary_institutions")
        .select("institution_id")
        .eq("id", id)
        .single();

      const { error } = await supabase.from("beneficiary_institutions").delete().eq("id", id);

      if (error) throw error;
      return row;
    },
    onSuccess: (row) => {
      const instId = row?.institution_id || profile?.institution_id;
      queryClient.invalidateQueries({ queryKey: ["beneficiary-institutions", instId] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      toast({
        title: "Sucesso",
        description: "Instituição beneficiada excluída com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: "Erro ao excluir instituição beneficiada: " + error.message,
        variant: "destructive",
      });
    },
  });
};
