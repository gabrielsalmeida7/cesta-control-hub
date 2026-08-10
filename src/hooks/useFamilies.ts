import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAuditLog } from "@/hooks/useAuditLog";
import { logger } from "@/utils/logger";
import type {
  Tables,
  TablesInsert,
  TablesUpdate
} from "@/integrations/supabase/types";

type Family = Tables<"families">;
type FamilyInsert = TablesInsert<"families">;
type FamilyUpdate = TablesUpdate<"families">;

export const useFamilies = () => {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ["families", profile?.id], // Incluir user ID para separar cache por usuário
    queryFn: async () => {
      if (import.meta.env.DEV) {
        console.log('👨‍👩‍👧‍👦 Fetching families...', { userId: profile?.id, role: profile?.role });
      }
      
      // Desbloquear automaticamente famílias expiradas antes de buscar
      try {
        const { data: unblockedCount, error: unblockError } = await supabase
          .rpc('auto_unblock_expired_families');
        
        if (unblockError) {
          if (import.meta.env.DEV) {
            console.warn('⚠️ Error auto-unblocking families:', unblockError);
          }
        } else if (unblockedCount && unblockedCount > 0) {
          if (import.meta.env.DEV) {
            console.log(`✅ Auto-unblocked ${unblockedCount} expired families`);
          }
        }
      } catch (error) {
        // Se a função não existir ainda (migração não executada), apenas logar warning
        if (import.meta.env.DEV) {
          console.warn('⚠️ Function auto_unblock_expired_families not available:', error);
        }
      }
      
      const { data, error } = await supabase
        .from("families")
        .select(
          `
          *,
          blocked_by_institution:blocked_by_institution_id(name),
          institution_families(
            institution_id,
            institution:institution_id(id, name)
          ),
          deliveries(
            delivery_date, 
            blocking_period_days, 
            notes,
            institution:institution_id(id, name)
          )
        `)
        .order('name');
      
      if (error) {
        console.error('❌ Error fetching families:', error);
        throw error;
      }
      
      // Buscar dados dos usuários que desbloquearam (se houver)
      if (data && data.length > 0) {
        const unblockedUserIds = data
          .filter(f => f.unblocked_by_user_id)
          .map(f => f.unblocked_by_user_id)
          .filter((id, index, self) => self.indexOf(id) === index) as string[];
        
        if (unblockedUserIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .in('id', unblockedUserIds);
          
          // Adicionar dados do usuário às famílias
          if (profiles) {
            const profilesMap = new Map(profiles.map(p => [p.id, p]));
            data.forEach(family => {
              if (family.unblocked_by_user_id && profilesMap.has(family.unblocked_by_user_id)) {
                (family as any).unblocked_by_user = profilesMap.get(family.unblocked_by_user_id);
              }
            });
          }
        }
      }
      
      if (import.meta.env.DEV) {
        console.log('✅ Families fetched:', data?.length || 0, 'records');
      }
      return data;
    },
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: !!profile && profile.role === 'admin' // Só executar se for admin
  });
};

export const useInstitutionFamilies = (institutionId?: string) => {
  return useQuery({
    queryKey: ["institution-families", institutionId],
    queryFn: async () => {
      if (!institutionId) {
        if (import.meta.env.DEV) {
          console.log('❌ No institutionId provided');
        }
        return [];
      }

      // Desbloquear automaticamente famílias expiradas antes de buscar
      try {
        const { data: unblockedCount, error: unblockError } = await supabase
          .rpc('auto_unblock_expired_families');
        
        if (unblockError) {
          if (import.meta.env.DEV) {
            console.warn('⚠️ Error auto-unblocking families:', unblockError);
          }
        } else if (unblockedCount && unblockedCount > 0) {
          if (import.meta.env.DEV) {
            console.log(`✅ Auto-unblocked ${unblockedCount} expired families`);
          }
        }
      } catch (error) {
        // Se a função não existir ainda (migração não executada), apenas logar warning
        if (import.meta.env.DEV) {
          console.warn('⚠️ Function auto_unblock_expired_families not available:', error);
        }
      }

      if (import.meta.env.DEV) {
        console.log('🔍 Fetching families for institution via RPC:', institutionId);
      }

      const { data, error } = await supabase.rpc('get_families_for_institution', {
        p_institution_id: institutionId,
      });

      if (error) {
        console.error('❌ Error fetching families:', error);
        throw error;
      }

      const families = (Array.isArray(data) ? data : []) as InstitutionFamilyView[];

      if (import.meta.env.DEV) {
        console.log('✅ Families fetched:', families.length, 'records');
      }
      return families;
    },
    enabled: !!institutionId
  });
};

export const useCreateFamily = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const { logAction } = useAuditLog();

  return useMutation({
    mutationFn: async ({
      family,
      institutionId
    }: {
      family: FamilyInsert;
      institutionId?: string;
    }) => {
      const insertPayload: FamilyInsert = institutionId
        ? { ...family, origin_institution_id: institutionId }
        : family;

      const { data: createdFamily, error: createError } = await supabase
        .from("families")
        .insert(insertPayload)
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

      // Log de auditoria
      logger.audit('FAMILY_CREATE', user?.id || 'unknown', {
        family_id: createdFamily.id,
        family_name: createdFamily.name,
        institution_id: institutionId,
      });
      
      await logAction({
        actionType: 'FAMILY_CREATE',
        tableName: 'families',
        recordId: createdFamily.id,
        description: `Família criada: ${createdFamily.name}`,
        severity: 'INFO',
        newData: {
          id: createdFamily.id,
          name: createdFamily.name,
          contact_person: createdFamily.contact_person,
          members_count: createdFamily.members_count,
        },
      });

      return createdFamily;
    },
    onSuccess: (data, variables) => {
      // Invalidar todas as queries de famílias (para todos os usuários)
      queryClient.invalidateQueries({ queryKey: ["families"] });
      queryClient.invalidateQueries({ queryKey: ["institution-families"] });
      queryClient.invalidateQueries({ queryKey: ["institutions"] }); // Também invalidar instituições para atualizar contagem
      
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
    onError: (error: any) => {
      // Verificar se é erro de CPF duplicado
      const errorMessage = error.message || '';
      const isDuplicateCpf = 
        errorMessage.includes('idx_families_cpf_unique') ||
        errorMessage.includes('duplicate key') ||
        (error.code === '23505' && errorMessage.includes('cpf'));
      
      if (isDuplicateCpf) {
        toast({
          title: "Erro",
          description: "Não é possível cadastrar a família. Já existe uma família cadastrada com este CPF.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao criar família: " + error.message,
          variant: "destructive"
        });
      }
    }
  });
};

export const useUpdateFamily = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const { logAction } = useAuditLog();

  return useMutation({
    mutationFn: async ({
      id,
      updates
    }: {
      id: string;
      updates: FamilyUpdate;
    }) => {
      // Log para debug em desenvolvimento
      if (import.meta.env.DEV) {
        console.log('[useUpdateFamily] Atualizando família:', { id, updates });
      }

      const { data, error } = await supabase
        .from("families")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        // Log detalhado do erro em desenvolvimento
        if (import.meta.env.DEV) {
          console.error('[useUpdateFamily] Erro do Supabase:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
        }
        throw error;
      }
      
      // Log de auditoria
      logger.audit('FAMILY_UPDATE', user?.id || 'unknown', {
        family_id: id,
        updated_fields: Object.keys(updates),
      });
      
      await logAction({
        actionType: 'FAMILY_UPDATE',
        tableName: 'families',
        recordId: id,
        description: `Família atualizada: ${data.name || id}`,
        severity: 'INFO',
        newData: updates as Record<string, unknown>,
      });
      
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
    onError: (error: any) => {
      // Mensagem de erro mais detalhada
      let errorMessage = "Erro ao atualizar família";
      if (error?.message) {
        errorMessage += ": " + error.message;
      } else if (error?.details) {
        errorMessage += ": " + error.details;
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
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
      // NOVA REGRA: Famílias podem estar vinculadas a múltiplas instituições
      // Verificar apenas se já está vinculada à MESMA instituição (evitar duplicatas)
      const { data: existingAssociation, error: checkError } = await supabase
        .from("institution_families")
        .select(`
          institution_id,
          institution:institution_id(id, name)
        `)
        .eq("family_id", familyId)
        .eq("institution_id", institutionId)
        .maybeSingle();

      if (checkError) throw checkError;

      // Se já está vinculada à mesma instituição, não fazer nada
      if (existingAssociation) {
        return { message: "Família já está vinculada a esta instituição" };
      }

      // Criar novo vínculo (mesmo que já tenha outros vínculos)
      const { data, error } = await supabase
        .from("institution_families")
        .insert({
          family_id: familyId,
          institution_id: institutionId
        })
        .select()
        .single();

      if (error) {
        // Se for erro de constraint única (duplicata), tratar como sucesso silencioso
        if (error.code === '23505' || error.message?.includes('duplicate')) {
          return { message: "Família já está vinculada a esta instituição" };
        }
        throw error;
      }
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
      toast({
        title: "Erro",
        description: "Erro ao associar família: " + error.message,
        variant: "destructive"
      });
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
      if (import.meta.env.DEV) {
        console.log('[useDisassociateFamilyFromInstitution] Iniciando desvinculação:', {
          familyId,
          institutionId
        });
      }

      // Verificar se o vínculo existe antes de deletar
      const { data: existingLink, error: checkError } = await supabase
        .from("institution_families")
        .select("family_id, institution_id")
        .eq("family_id", familyId)
        .eq("institution_id", institutionId)
        .maybeSingle();

      if (checkError) {
        console.error('[useDisassociateFamilyFromInstitution] Erro ao verificar vínculo:', checkError);
        throw checkError;
      }

      if (!existingLink) {
        const errorMsg = "Vínculo não encontrado entre a família e a instituição";
        if (import.meta.env.DEV) {
          console.warn('[useDisassociateFamilyFromInstitution]', errorMsg);
        }
        throw new Error(errorMsg);
      }

      if (import.meta.env.DEV) {
        console.log('[useDisassociateFamilyFromInstitution] Vínculo encontrado, deletando:', existingLink);
      }

      // Deletar o vínculo
      const { data, error } = await supabase
        .from("institution_families")
        .delete()
        .eq("family_id", familyId)
        .eq("institution_id", institutionId)
        .select();

      if (error) {
        console.error('[useDisassociateFamilyFromInstitution] Erro ao deletar:', error);
        throw error;
      }

      if (import.meta.env.DEV) {
        console.log('[useDisassociateFamilyFromInstitution] Desvinculação bem-sucedida:', data);
      }

      return data;
    },
    onSuccess: (data, variables) => {
      if (import.meta.env.DEV) {
        console.log('[useDisassociateFamilyFromInstitution] onSuccess chamado:', { data, variables });
      }

      // Invalidar queries para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ["families"] });
      queryClient.invalidateQueries({ queryKey: ["institution-families", variables.institutionId] });
      queryClient.invalidateQueries({ queryKey: ["institution-families"] });
      queryClient.invalidateQueries({ queryKey: ["institutions"] });
      
      toast({
        title: "Sucesso",
        description: "Família desvinculada da instituição com sucesso!"
      });
    },
    onError: (error: any) => {
      console.error('[useDisassociateFamilyFromInstitution] Erro na mutation:', error);
      toast({
        title: "Erro",
        description: "Erro ao desassociar família: " + (error?.message || "Erro desconhecido"),
        variant: "destructive"
      });
    }
  });
};

export type InstitutionFamilyDelivery = {
  delivery_date: string;
  blocking_period_days?: number | null;
  notes?: string | null;
  institution_id?: string;
  institution?: { id?: string; name?: string } | null;
};

export type InstitutionFamilyView = Family & {
  view_mode: 'full' | 'limited';
  is_origin: boolean;
  cpf_masked?: string;
  blocked_by_institution?: { name?: string } | null;
  institution_families?: Array<{
    institution_id: string;
    institution?: { id?: string; name?: string } | null;
  }>;
  deliveries?: InstitutionFamilyDelivery[];
};

export const fetchFamilyForInstitution = async (
  familyId: string
): Promise<InstitutionFamilyView | null> => {
  const { data, error } = await supabase.rpc('get_family_for_institution', {
    p_family_id: familyId,
  });

  if (error) {
    throw error;
  }

  return (data as InstitutionFamilyView | null) ?? null;
};

export type FamilyInstitutionLink = {
  institution_id: string;
  institution_name: string;
  created_at: string;
  is_origin: boolean;
};

export const fetchFamilyInstitutionLinks = async (
  familyId: string
): Promise<FamilyInstitutionLink[]> => {
  const { data, error } = await supabase.rpc("get_family_institution_links", {
    p_family_id: familyId,
  });

  if (error) {
    throw error;
  }

  return (data ?? []) as FamilyInstitutionLink[];
};

export const getOriginInstitutionId = (
  links: FamilyInstitutionLink[]
): string | null => {
  return links.find((link) => link.is_origin)?.institution_id ?? null;
};

export const isOriginInstitution = (
  links: FamilyInstitutionLink[],
  institutionId?: string
): boolean => {
  if (!institutionId || links.length <= 1) {
    return true;
  }

  return links.some(
    (link) => link.is_origin && link.institution_id === institutionId
  );
};

export const useFamilyInstitutionLinks = (
  familyId?: string,
  enabled = true
) => {
  return useQuery({
    queryKey: ["family-institution-links", familyId],
    queryFn: () => fetchFamilyInstitutionLinks(familyId!),
    enabled: !!familyId && enabled,
    staleTime: 60_000,
  });
};

export type FamilySearchPreview = {
  id: string;
  name: string;
  contact_person: string;
  cpf_masked: string;
  phone: string | null;
  members_count: number | null;
  is_linked_to_current?: boolean;
};

// Tipo para resultado da busca de família
export type FamilySearchResult = {
  scenario: 1 | 2 | 3 | 4 | 5;
  family: FamilySearchPreview | null;
  families?: FamilySearchPreview[];
  message: string;
  institutionName?: string;
  institutionLinks?: FamilyInstitutionLink[];
};

/**
 * Busca família por CPF, nome da família ou nome da mãe e verifica vínculos
 * Retorna um dos 5 cenários:
 * 1: Família encontrada e desvinculada
 * 2: Família encontrada e já vinculada a outra instituição
 * 3: Família não encontrada
 * 4: Família já vinculada à própria instituição
 * 5: Múltiplas famílias encontradas (apenas para busca por Nome da Mãe)
 */
export const searchFamilyByCpf = async (
  searchTerm: string,
  currentInstitutionId?: string,
  searchBy: "cpf" | "name" | "mother_name" = "cpf"
): Promise<FamilySearchResult> => {
  const trimmedSearch = searchTerm.trim();

  if (searchBy === "cpf") {
    const cleanCpf = searchTerm.replace(/\D/g, "");
    if (cleanCpf.length !== 11) {
      return {
        scenario: 3,
        family: null,
        message: "CPF deve conter 11 dígitos.",
      };
    }
  } else if (trimmedSearch.length === 0) {
    const message =
      searchBy === "name"
        ? "Digite o nome da família para buscar."
        : "Digite o nome da mãe para buscar.";
    return {
      scenario: 3,
      family: null,
      message,
    };
  }

  const { data: families, error } = await supabase.rpc(
    "search_family_for_linking",
    {
      p_search_term: trimmedSearch || searchTerm,
      p_search_by: searchBy,
      p_current_institution_id: currentInstitutionId ?? null,
    }
  );

  if (error) {
    if (error.message.includes("CPF deve conter 11 dígitos")) {
      return {
        scenario: 3,
        family: null,
        message: "CPF deve conter 11 dígitos.",
      };
    }
    if (
      error.message.includes("pgcrypto") ||
      error.details?.includes("pgcrypto")
    ) {
      throw new Error(
        "Busca por CPF temporariamente indisponível. Tente buscar pelo nome da família ou aplique a migration de correção no Supabase."
      );
    }
    throw error;
  }

  const results = (families ?? []) as FamilySearchPreview[];

  if (results.length === 0) {
    let searchTypeText = "";
    if (searchBy === "cpf") {
      searchTypeText = "este CPF";
    } else if (searchBy === "name") {
      searchTypeText = "este nome da família";
    } else {
      searchTypeText = "este nome da mãe";
    }

    return {
      scenario: 3,
      family: null,
      message: `Nenhuma família encontrada com ${searchTypeText}.`,
    };
  }

  if (searchBy === "mother_name" && results.length > 1) {
    return {
      scenario: 5,
      family: null,
      families: results,
      message: `Foram encontradas ${results.length} famílias com este Nome da Mãe.`,
    };
  }

  const family = results[0];
  let institutionLinks: FamilyInstitutionLink[] = [];

  try {
    institutionLinks = await fetchFamilyInstitutionLinks(family.id);
  } catch (linkError) {
    if (import.meta.env.DEV) {
      console.warn(
        "⚠️ get_family_institution_links indisponível durante busca:",
        linkError
      );
    }
  }

  if (family.is_linked_to_current) {
    const currentInstitutionLink = institutionLinks.find(
      (link) => link.institution_id === currentInstitutionId
    );
    const institutionName =
      currentInstitutionLink?.institution_name ?? "sua instituição";

    return {
      scenario: 4,
      family,
      institutionLinks,
      message: `A família '${family.name}' já está na lista de famílias da sua instituição.`,
      institutionName,
    };
  }

  if (institutionLinks.length === 0) {
    return {
      scenario: 1,
      family,
      institutionLinks,
      message: `Família '${family.name}' encontrada e sem vínculo. Deseja vincular esta família à sua instituição?`,
    };
  }

  const otherInstitutions = institutionLinks
    .map((link) => link.institution_name)
    .join(", ");

  return {
    scenario: 2,
    family,
    institutionLinks,
    message: `A família '${family.name}' já está vinculada à(s) instituição(ões): ${otherInstitutions}. Você pode vincular esta família à sua instituição também.`,
    institutionName: otherInstitutions,
  };
};