
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useAuditLog } from '@/hooks/useAuditLog';
import { logger } from '@/utils/logger';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Institution = Tables<'institutions'>;
type InstitutionInsert = TablesInsert<'institutions'>;
type InstitutionUpdate = TablesUpdate<'institutions'>;

// Extended type for creating institution with user data
type InstitutionWithUser = InstitutionInsert & {
  email: string;
  password: string;
  responsible_name: string;
};

export const useInstitutions = () => {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['institutions', profile?.id], // Incluir user ID para separar cache por usuário
    queryFn: async () => {
      if (import.meta.env.DEV) {
        console.log('🏢 Fetching institutions...', { userId: profile?.id, role: profile?.role });
      }
      
      const { data, error } = await supabase
        .from('institutions')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('❌ Error fetching institutions:', error);
        throw error;
      }
      
      if (import.meta.env.DEV) {
        console.log('✅ Institutions fetched:', data?.length || 0, 'records');
      }
      return data as Institution[];
    },
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: !!profile && profile.role === 'admin' // Só executar se for admin
  });
};

export const useCreateInstitution = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const { logAction } = useAuditLog();

  return useMutation({
    mutationFn: async (institutionData: InstitutionWithUser) => {
      // Extract password and user data (don't save password in institutions table)
      const { password, email, responsible_name, ...institutionFields } = institutionData;
      
      // Validate email availability first (check auth.users, profiles, AND institutions)
      const { error: validateError } = await supabase
        .rpc('validate_institution_user_creation', { p_email: email });
      
      if (validateError) {
        throw new Error(validateError.message || 'Email já está em uso');
      }
      
      // Also check if email already exists in institutions table
      const { data: existingInstitution } = await supabase
        .from('institutions')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      
      if (existingInstitution) {
        throw new Error('Este email já está cadastrado em outra instituição. Por favor, use outro email.');
      }
      
      // Create institution first
      const { data: institution, error: institutionError } = await supabase
        .from('institutions')
        .insert({
          ...institutionFields,
          email,
          responsible_name,
        })
        .select()
        .single();
      
      if (institutionError) {
        throw institutionError;
      }
      
      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Rollback: delete institution if no session
        await supabase.from('institutions').delete().eq('id', institution.id);
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }
      
      // Create user via Edge Function (secure backend)
      if (import.meta.env.DEV) {
        console.log('[CREATE_INSTITUTION] Creating user via Edge Function:', { email });
      }
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const { data: functionResponse, error: functionError } = await supabase.functions.invoke(
        'create-institution-user',
        {
          body: {
            email,
            password,
            responsible_name,
            institution_id: institution.id,
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      
      if (functionError) {
        console.error('[CREATE_INSTITUTION] Error calling Edge Function:', {
          error: functionError.message,
        });
        
        // Rollback: delete institution if user creation fails
        try {
          await supabase
            .from('institutions')
            .delete()
            .eq('id', institution.id);
        } catch (rollbackError) {
          console.error('Erro ao fazer rollback da instituição:', rollbackError);
        }
        
        throw new Error(functionError.message || 'Erro ao criar usuário. A instituição foi removida automaticamente.');
      }
      
      if (!functionResponse?.success) {
        console.error('[CREATE_INSTITUTION] Edge Function returned error:', functionResponse);
        
        // Rollback: delete institution if user creation fails
        try {
          await supabase
            .from('institutions')
            .delete()
            .eq('id', institution.id);
        } catch (rollbackError) {
          console.error('Erro ao fazer rollback da instituição:', rollbackError);
        }
        
        throw new Error(functionResponse?.error || 'Erro ao criar usuário: resposta inválida do servidor. A instituição foi removida automaticamente.');
      }
      
      if (import.meta.env.DEV) {
        console.log('[CREATE_INSTITUTION] User created successfully via Edge Function:', {
          user_id: functionResponse.user_id,
          email: functionResponse.email,
        });
      }
      
      // Log de auditoria
      logger.audit('INSTITUTION_CREATE', user?.id || 'unknown', {
        institution_id: institution.id,
        institution_name: institution.name,
        institution_email: institution.email,
      });
      
      await logAction({
        actionType: 'INSTITUTION_CREATE',
        tableName: 'institutions',
        recordId: institution.id,
        description: `Instituição criada: ${institution.name}`,
        severity: 'INFO',
        newData: {
          id: institution.id,
          name: institution.name,
          email: institution.email,
          responsible_name: institution.responsible_name,
        },
      });
      
      return institution;
    },
    onSuccess: () => {
      // Invalidar todas as queries de instituições (para todos os usuários)
      queryClient.invalidateQueries({ queryKey: ['institutions'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] }); // Atualizar estatísticas
      toast({
        title: "Sucesso",
        description: "Instituição e usuário criados com sucesso!",
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || 'Erro desconhecido';
      
      // Invalidate queries to refresh the list (in case institution was created but user wasn't)
      queryClient.invalidateQueries({ queryKey: ['institutions'] });
      
      // Handle specific error cases
      if (errorMessage.includes('VITE_SUPABASE_SERVICE_ROLE_KEY') || errorMessage.includes('Configuração necessária')) {
        toast({
          title: "Configuração Necessária",
          description: errorMessage,
          variant: "destructive",
        });
      } else if (errorMessage.includes('Email já está em uso') || errorMessage.includes('duplicate') || errorMessage.includes('já está cadastrado')) {
        toast({
          title: "Email Indisponível",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao Criar Instituição",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
  });
};

export const useUpdateInstitution = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { reloadProfile, profile: currentProfile, user: currentUser } = useAuth();
  const { logAction } = useAuditLog();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: InstitutionUpdate }) => {
      // Se email foi atualizado, validar disponibilidade antes de atualizar
      if (updates.email !== undefined) {
        // Buscar o email atual da instituição para comparar
        const { data: currentInstitution, error: fetchCurrentError } = await supabase
          .from('institutions')
          .select('email')
          .eq('id', id)
          .single();

        if (fetchCurrentError) {
          console.error('[UPDATE_INSTITUTION] Error fetching current institution:', fetchCurrentError);
          throw new Error('Erro ao buscar dados da instituição: ' + fetchCurrentError.message);
        }

        // Se o email não mudou, não precisa validar
        const emailChanged = currentInstitution?.email !== updates.email;

        if (emailChanged) {
          // Verificar se o email já está em uso por outra instituição
          const { data: existingInstitution, error: checkError } = await supabase
            .from('institutions')
            .select('id')
            .eq('email', updates.email)
            .neq('id', id) // Excluir a própria instituição
            .maybeSingle();

          if (checkError) {
            console.error('[UPDATE_INSTITUTION] Error checking email availability:', checkError);
            throw new Error('Erro ao verificar disponibilidade do email: ' + checkError.message);
          }

          if (existingInstitution) {
            throw new Error('Este email já está cadastrado em outra instituição. Por favor, use outro email.');
          }

          // Validar email usando a função RPC (verifica auth.users e profiles também)
          const { error: validateError } = await supabase
            .rpc('validate_institution_user_creation', { p_email: updates.email });

          if (validateError) {
            // Se a validação falhou, verificar se é porque o email pertence ao próprio usuário da instituição
            const { data: currentProfile } = await supabase
              .from('profiles')
              .select('email')
              .eq('institution_id', id)
              .maybeSingle();

            // Se o email validado não for o email atual do profile, então é duplicado
            if (!currentProfile || currentProfile.email !== updates.email) {
              throw new Error(validateError.message || 'Email já está em uso');
            }
          }
        }
      }

      // Atualizar a instituição
      const { data, error } = await supabase
        .from('institutions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;

      // Buscar o profile associado à instituição (será usado para sincronização)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('institution_id', id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('[UPDATE_INSTITUTION] Error fetching profile:', profileError);
        // Não falhar a atualização se não conseguir buscar o profile
        // mas logar o erro
      } else if (profile && profile.id) {
        // Se responsible_name foi atualizado, sincronizar com profiles.full_name
        if (updates.responsible_name !== undefined) {
          const { error: updateProfileError } = await supabase
            .from('profiles')
            .update({ full_name: updates.responsible_name })
            .eq('id', profile.id);

          if (updateProfileError) {
            console.error('[UPDATE_INSTITUTION] Error updating profile full_name:', updateProfileError);
            // Não falhar a atualização se não conseguir atualizar o profile
            // mas logar o erro
          } else {
            if (import.meta.env.DEV) {
              console.log('[UPDATE_INSTITUTION] Profile full_name synchronized successfully');
            }
          }
        }

        // Se email foi atualizado, sincronizar com profiles.email e auth.users.email
        if (updates.email !== undefined) {
          // Buscar o email atual do profile para verificar se precisa sincronizar
          const { data: currentProfileData } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', profile.id)
            .single();

          // Sincronizar apenas se o email realmente mudou
          const profileEmailChanged = !currentProfileData || currentProfileData.email !== updates.email;

          if (profileEmailChanged) {
            // Atualizar profiles.email
            const { error: updateProfileEmailError } = await supabase
              .from('profiles')
              .update({ email: updates.email })
              .eq('id', profile.id);

            if (updateProfileEmailError) {
              console.error('[UPDATE_INSTITUTION] Error updating profile email:', updateProfileEmailError);
              // Não falhar a atualização se não conseguir atualizar o profile
              // mas logar o erro
            } else {
              if (import.meta.env.DEV) {
                console.log('[UPDATE_INSTITUTION] Profile email synchronized successfully');
              }
            }

            // Atualizar auth.users.email usando Admin API
            // Importar supabaseAdmin dinamicamente (pode não estar disponível no frontend)
            let supabaseAdmin;
            try {
              const { supabaseAdmin: admin } = await import('@/integrations/supabase/admin');
              supabaseAdmin = admin;
            } catch {
              // supabaseAdmin não disponível, continuar sem ele
            }
            
            if (!supabaseAdmin) {
              if (import.meta.env.DEV) {
                console.warn('[UPDATE_INSTITUTION] supabaseAdmin not available, cannot update auth.users.email. Email de login não será atualizado.');
              }
              // Não falhar a atualização, mas avisar que o email de login não foi atualizado
            } else {
              const { error: updateAuthEmailError } = await supabaseAdmin.auth.admin.updateUserById(
                profile.id,
                { email: updates.email }
              );

              if (updateAuthEmailError) {
                console.error('[UPDATE_INSTITUTION] Error updating auth.users.email:', updateAuthEmailError);
                // Não falhar a atualização se não conseguir atualizar o auth.users.email
                // mas logar o erro - o usuário precisará usar o email antigo para login
                if (import.meta.env.DEV) {
                  console.warn('[UPDATE_INSTITUTION] Email da instituição foi atualizado, mas o email de login pode não ter sido atualizado. Verifique os logs ou entre em contato com o administrador.');
                }
              } else {
                if (import.meta.env.DEV) {
                  console.log('[UPDATE_INSTITUTION] Auth users email synchronized successfully');
                }
              }
            }

            // Verificar se o usuário atual pertence à instituição que foi atualizada
            // Buscar o profile associado à instituição para comparar com o usuário atual
            const { data: institutionProfile } = await supabase
              .from('profiles')
              .select('id')
              .eq('institution_id', id)
              .maybeSingle();

            // Se o profile da instituição corresponde ao usuário atual, recarregar o profile
            if (institutionProfile && currentUser && institutionProfile.id === currentUser.id) {
              if (import.meta.env.DEV) {
                console.log('[UPDATE_INSTITUTION] Current user profile matches updated institution, reloading profile...', {
                  profileId: institutionProfile.id,
                  userId: currentUser.id,
                  institutionId: id,
                  newEmail: updates.email
                });
              }
              // Aguardar um pouco para garantir que todas as atualizações foram commitadas
              await new Promise(resolve => setTimeout(resolve, 100));
              await reloadProfile();
              if (import.meta.env.DEV) {
                console.log('[UPDATE_INSTITUTION] Profile reloaded successfully');
              }
            } else {
              if (import.meta.env.DEV) {
                console.log('[UPDATE_INSTITUTION] Profile reload skipped:', {
                  institutionProfileId: institutionProfile?.id,
                  currentUserId: currentUser?.id,
                  matches: institutionProfile?.id === currentUser?.id,
                  hasInstitutionProfile: !!institutionProfile,
                  hasCurrentUser: !!currentUser
                });
              }
            }
          } else {
            if (import.meta.env.DEV) {
              console.log('[UPDATE_INSTITUTION] Email não mudou, pulando sincronização');
            }
          }
        }
      }

      // Log de auditoria
      logger.audit('INSTITUTION_UPDATE', currentUser?.id || 'unknown', {
        institution_id: id,
        updated_fields: Object.keys(updates),
      });
      
      await logAction({
        actionType: 'INSTITUTION_UPDATE',
        tableName: 'institutions',
        recordId: id,
        description: `Instituição atualizada: ${data.name}`,
        severity: 'INFO',
        newData: updates as Record<string, unknown>,
      });

      return data;
    },
    onSuccess: async (data, variables) => {
      // Invalidar queries primeiro
      queryClient.invalidateQueries({ queryKey: ['institutions'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] }); // Invalidar profiles também
      queryClient.invalidateQueries({ queryKey: ['institution-data'] }); // Invalidar dados da instituição
      
      // Se o email foi atualizado, garantir que o profile seja recarregado
      if (variables.updates.email !== undefined && currentUser) {
        // Buscar o profile associado à instituição atualizada
        const { data: institutionProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('institution_id', variables.id)
          .maybeSingle();

        // Se o profile da instituição corresponde ao usuário atual, recarregar
        if (institutionProfile && currentUser && institutionProfile.id === currentUser.id) {
          if (import.meta.env.DEV) {
            console.log('[UPDATE_INSTITUTION] onSuccess: Reloading profile for current user', {
              profileId: institutionProfile.id,
              userId: currentUser.id,
              institutionId: variables.id,
              newEmail: variables.updates.email
            });
          }
          // Aguardar um pouco para garantir que todas as atualizações foram commitadas
          await new Promise(resolve => setTimeout(resolve, 100));
          await reloadProfile();
          if (import.meta.env.DEV) {
            console.log('[UPDATE_INSTITUTION] onSuccess: Profile reloaded successfully');
          }
        } else {
          if (import.meta.env.DEV) {
            console.log('[UPDATE_INSTITUTION] onSuccess: Profile reload skipped', {
              institutionProfileId: institutionProfile?.id,
              currentUserId: currentUser?.id,
              matches: institutionProfile?.id === currentUser?.id
            });
          }
        }
      }
      
      toast({
        title: "Sucesso",
        description: "Instituição atualizada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar instituição: " + error.message,
        variant: "destructive",
      });
    },
  });
};

// Hook para buscar dados completos da instituição usando institution_id do profile
export const useInstitutionData = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['institution-data', profile?.institution_id],
    queryFn: async () => {
      if (!profile?.institution_id) {
        return null;
      }

      const { data, error } = await supabase
        .from('institutions')
        .select('*')
        .eq('id', profile.institution_id)
        .single();

      if (error) {
        console.error('❌ Error fetching institution data:', error);
        throw error;
      }

      return data as Institution;
    },
    enabled: !!profile?.institution_id && profile.role === 'institution',
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

export const useDeleteInstitution = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const { logAction } = useAuditLog();

  return useMutation({
    mutationFn: async (id: string) => {
      // Verificar se há entregas associadas (ON DELETE RESTRICT)
      const { data: deliveries, error: deliveriesError } = await supabase
        .from('deliveries')
        .select('id')
        .eq('institution_id', id)
        .limit(1);
      
      if (deliveriesError) {
        throw new Error('Erro ao verificar entregas: ' + deliveriesError.message);
      }
      
      if (deliveries && deliveries.length > 0) {
        throw new Error('Não é possível excluir a instituição. Existem entregas registradas associadas a ela. Remova as entregas primeiro ou entre em contato com o administrador.');
      }
      
      // Buscar dados da instituição antes de deletar (para log)
      const { data: institutionData } = await supabase
        .from('institutions')
        .select('name, email')
        .eq('id', id)
        .single();
      
      // Buscar o usuário associado à instituição
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('institution_id', id)
        .maybeSingle();
      
      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw new Error('Erro ao buscar usuário associado: ' + profileError.message);
      }
      
      // Se houver usuário associado, deletá-lo via Admin API
      // Nota: supabaseAdmin pode não estar disponível no frontend, mas tentamos usar se disponível
      let supabaseAdmin;
      try {
        const { supabaseAdmin: admin } = await import('@/integrations/supabase/admin');
        supabaseAdmin = admin;
      } catch {
        // supabaseAdmin não disponível, continuar sem ele
      }
      
      if (profile && profile.id && supabaseAdmin) {
        if (import.meta.env.DEV) {
          console.log('[DELETE_INSTITUTION] Deleting associated user:', { user_id: profile.id, email: profile.email });
        }
        
        const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(profile.id);
        
        if (deleteUserError) {
          console.error('[DELETE_INSTITUTION] Error deleting user:', deleteUserError);
          // Continuar mesmo se não conseguir deletar o usuário (pode não existir mais)
          // Mas avisar o usuário
          throw new Error('Erro ao excluir usuário associado: ' + deleteUserError.message + '. A instituição não foi excluída.');
        }
        
        if (import.meta.env.DEV) {
          console.log('[DELETE_INSTITUTION] User deleted successfully');
        }
      } else if (profile && profile.id && !supabaseAdmin) {
        throw new Error('Configuração necessária: VITE_SUPABASE_SERVICE_ROLE_KEY não está configurada. Não é possível excluir o usuário associado.');
      }
      
      // Deletar a instituição (as associações institution_families serão deletadas automaticamente por CASCADE)
      const { error } = await supabase
        .from('institutions')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      // Log de auditoria (CRITICAL pois é uma exclusão)
      logger.audit('INSTITUTION_DELETE', user?.id || 'unknown', {
        institution_id: id,
        institution_name: institutionData?.name,
        institution_email: institutionData?.email,
      });
      
      await logAction({
        actionType: 'INSTITUTION_DELETE',
        tableName: 'institutions',
        recordId: id,
        description: `Instituição excluída: ${institutionData?.name || id}`,
        severity: 'CRITICAL',
        oldData: institutionData ? {
          id,
          name: institutionData.name,
          email: institutionData.email,
        } : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institutions'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: "Sucesso",
        description: "Instituição e usuário associado excluídos com sucesso!",
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || 'Erro desconhecido';
      
      // Tratar erros específicos
      if (errorMessage.includes('entregas registradas')) {
        toast({
          title: "Não é possível excluir",
          description: errorMessage,
          variant: "destructive",
        });
      } else if (errorMessage.includes('VITE_SUPABASE_SERVICE_ROLE_KEY')) {
        toast({
          title: "Configuração Necessária",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao excluir instituição: " + errorMessage,
          variant: "destructive",
        });
      }
    },
  });
};
