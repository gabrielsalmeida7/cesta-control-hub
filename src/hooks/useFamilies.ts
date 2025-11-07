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
      console.log('👨‍👩‍👧‍👦 Fetching families...');
      
      const { data, error } = await supabase
        .from("families")
        .select(
          `
          *,
          blocked_by_institution:blocked_by_institution_id(name),
          institution_families(institution_id),
          deliveries(delivery_date, blocking_period_days, notes)
        `)
        .order('name');
      
      if (error) {
        console.error('❌ Error fetching families:', error);
        throw error;
      }
      
      console.log('✅ Families fetched:', data?.length || 0, 'records');
      return data;
    },
    retry: 1,
    refetchOnWindowFocus: false
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
          institution_families!inner(institution_id),
          deliveries(delivery_date, blocking_period_days, notes)
        `)
        .eq('institution_families.institution_id', institutionId)
        .order('name');
      
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
    mutationFn: async ({
      family,
      institutionId
    }: {
      family: FamilyInsert;
      institutionId?: string;
    }) => {
      // Criar família
      const { data: createdFamily, error: createError } = await supabase
        .from("families")
        .insert(family)
        .select()
        .single();

      if (createError) throw createError;

      // Se institutionId foi fornecido, vincular automaticamente
      if (institutionId && createdFamily) {
        // Verificar se família já está vinculada (não deveria acontecer, mas por segurança)
        const { data: existingAssociations, error: checkError } = await supabase
          .from("institution_families")
          .select(`
            institution_id,
            institution:institution_id(id, name)
          `)
          .eq("family_id", createdFamily.id);

        if (checkError) {
          // Se houver erro ao verificar, continuar mesmo assim
          console.error("Error checking existing associations:", checkError);
        }

        // Se não tem vínculo, criar
        if (!existingAssociations || existingAssociations.length === 0) {
          const { error: associateError } = await supabase
            .from("institution_families")
            .insert({
              family_id: createdFamily.id,
              institution_id: institutionId
            });

          if (associateError) {
            // Se falhar ao vincular, logar erro mas não falhar a criação da família
            console.error("Error associating family with institution:", associateError);
            toast({
              title: "Aviso",
              description: "Família criada, mas houve erro ao vincular à instituição. Você pode vincular manualmente.",
              variant: "default"
            });
          }
        } else {
          // Se já tem vínculo, mostrar aviso
          const existingInstitution = existingAssociations[0];
          const institutionName = existingInstitution.institution?.name || "outra instituição";
          toast({
            title: "Aviso",
            description: `Família criada, mas já está vinculada a ${institutionName}.`,
            variant: "default"
          });
        }
      }

      return createdFamily;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["families"] });
      queryClient.invalidateQueries({ queryKey: ["institution-families"] });
      
      if (variables.institutionId) {
        toast({
          title: "Sucesso",
          description: "Família criada e vinculada à instituição com sucesso!"
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Família criada com sucesso!"
        });
      }
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
      // NOVA REGRA: Uma família só pode ter UMA instituição
      // Verificar se família já está vinculada a qualquer instituição
      const { data: existingAssociations, error: checkError } = await supabase
        .from("institution_families")
        .select(`
          institution_id,
          institution:institution_id(id, name)
        `)
        .eq("family_id", familyId);

      if (checkError) throw checkError;

      // Se já existe qualquer vínculo
      if (existingAssociations && existingAssociations.length > 0) {
        const existingAssociation = existingAssociations[0];
        const existingInstitutionId = existingAssociation.institution_id;
        const institutionName = existingAssociation.institution?.name || "outra instituição";
        
        // Se já está vinculada à mesma instituição, não fazer nada
        if (existingInstitutionId === institutionId) {
          return { message: "Família já está vinculada a esta instituição" };
        }
        
        // Se está vinculada a outra instituição, retornar erro
        const error = new Error(`FAMILY_ALREADY_ASSOCIATED:${institutionName}`);
        (error as any).institutionName = institutionName;
        (error as any).existingInstitutionId = existingInstitutionId;
        throw error;
      }

      // Se não tem vínculo, criar novo vínculo
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
