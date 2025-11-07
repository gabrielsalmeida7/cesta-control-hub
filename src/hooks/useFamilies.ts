import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type {
  Tables,
  TablesInsert,
  TablesUpdate
} from "@/integrations/supabase/types";

type Family = Tables<"families">;
type FamilyInsert = TablesInsert<"families">;
type FamilyUpdate = TablesUpdate<"families">;

export const useFamilies = () => {
  return useQuery({
    queryKey: ["families"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("families")
        .select(
          `
          *,
          blocked_by_institution:blocked_by_institution_id(name),
          institution_families(
            institution_id,
            institution:institution_id(id, name)
          )
        `
        )
        .order("name");

      if (error) throw error;
      return data;
    }
  });
};

export const useInstitutionFamilies = (institutionId?: string) => {
  return useQuery({
    queryKey: ["institution-families", institutionId],
    queryFn: async () => {
      if (!institutionId) return [];

      const { data, error } = await supabase
        .from("families")
        .select(
          `
          *,
          blocked_by_institution:blocked_by_institution_id(name),
          institution_families!inner(institution_id)
        `
        )
        .eq("institution_families.institution_id", institutionId)
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: !!institutionId
  });
};

export const useCreateFamily = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (family: FamilyInsert) => {
      const { data, error } = await supabase
        .from("families")
        .insert(family)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["families"] });
      toast({
        title: "Sucesso",
        description: "Família criada com sucesso!"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao criar família: " + error.message,
        variant: "destructive"
      });
    }
  });
};

export const useUpdateFamily = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      updates
    }: {
      id: string;
      updates: FamilyUpdate;
    }) => {
      const { data, error } = await supabase
        .from("families")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["families"] });
      queryClient.invalidateQueries({ queryKey: ["institution-families"] });
      toast({
        title: "Sucesso",
        description: "Família atualizada com sucesso!"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar família: " + error.message,
        variant: "destructive"
      });
    }
  });
};

export const useDeleteFamily = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("families").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["families"] });
      queryClient.invalidateQueries({ queryKey: ["institution-families"] });
      toast({
        title: "Sucesso",
        description: "Família excluída com sucesso!"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao excluir família: " + error.message,
        variant: "destructive"
      });
    }
  });
};

export const useAssociateFamilyWithInstitution = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      familyId,
      institutionId
    }: {
      familyId: string;
      institutionId: string;
    }) => {
      // Verificar se família já está vinculada a outra instituição
      const { data: existingAssociations, error: checkError } = await supabase
        .from("institution_families")
        .select(`
          institution_id,
          institution:institution_id(id, name)
        `)
        .eq("family_id", familyId);

      if (checkError) throw checkError;

      // Se já existe vínculo com outra instituição
      if (existingAssociations && existingAssociations.length > 0) {
        const existingInstitution = existingAssociations.find(
          (assoc: any) => assoc.institution_id !== institutionId
        );
        
        if (existingInstitution) {
          const institutionName = existingInstitution.institution?.name || "outra instituição";
          const error = new Error(`FAMILY_ALREADY_ASSOCIATED:${institutionName}`);
          (error as any).institutionName = institutionName;
          throw error;
        }
      }

      // Se já está vinculada à mesma instituição, não fazer nada
      const alreadyLinked = existingAssociations?.some(
        (assoc: any) => assoc.institution_id === institutionId
      );
      
      if (alreadyLinked) {
        return { message: "Família já está vinculada a esta instituição" };
      }

      // Criar novo vínculo
      const { data, error } = await supabase
        .from("institution_families")
        .insert({
          family_id: familyId,
          institution_id: institutionId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["families"] });
      queryClient.invalidateQueries({ queryKey: ["institution-families"] });
      queryClient.invalidateQueries({ queryKey: ["institutions"] });
      
      // Só mostrar toast se realmente criou um novo vínculo
      if (data && !data.message) {
        toast({
          title: "Sucesso",
          description: "Família associada à instituição com sucesso!"
        });
      }
    },
    onError: (error: any) => {
      // Verificar se é erro de família já vinculada
      if (error.message?.startsWith("FAMILY_ALREADY_ASSOCIATED:")) {
        const institutionName = error.institutionName || "outra instituição";
        toast({
          title: "Erro",
          description: `Esta família já está sendo atendida por ${institutionName}.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao associar família: " + error.message,
          variant: "destructive"
        });
      }
    }
  });
};

export const useDisassociateFamilyFromInstitution = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      familyId,
      institutionId
    }: {
      familyId: string;
      institutionId: string;
    }) => {
      const { error } = await supabase
        .from("institution_families")
        .delete()
        .eq("family_id", familyId)
        .eq("institution_id", institutionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["families"] });
      queryClient.invalidateQueries({ queryKey: ["institution-families"] });
      queryClient.invalidateQueries({ queryKey: ["institutions"] });
      toast({
        title: "Sucesso",
        description: "Família desvinculada da instituição com sucesso!"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao desassociar família: " + error.message,
        variant: "destructive"
      });
    }
  });
};
