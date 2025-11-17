
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/integrations/supabase/admin';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
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
      console.log('🏢 Fetching institutions...', { userId: profile?.id, role: profile?.role });
      
      const { data, error } = await supabase
        .from('institutions')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('❌ Error fetching institutions:', error);
        throw error;
      }
      
      console.log('✅ Institutions fetched:', data?.length || 0, 'records');
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

  return useMutation({
    mutationFn: async (institutionData: InstitutionWithUser) => {
      // Extract password and user data (don't save password in institutions table)
      const { password, email, responsible_name, ...institutionFields } = institutionData;
      
      // Check admin client configuration FIRST (before creating anything)
      if (!supabaseAdmin) {
        throw new Error('Configuração necessária: A variável VITE_SUPABASE_SERVICE_ROLE_KEY não está configurada. Por favor, adicione esta variável no arquivo .env.local e reinicie o servidor. Veja ENV_SETUP.md para mais detalhes.');
      }
      
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
      
      // Create user via Admin API
      console.log('[CREATE_INSTITUTION] Creating user via Admin API:', { email });
      
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: responsible_name,
        }
      });
      
      if (authError) {
        console.error('[CREATE_INSTITUTION] Error creating user:', {
          error: authError.message,
          status: authError.status,
          code: authError.code
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
        
        throw new Error(authError.message || 'Erro ao criar usuário. A instituição foi removida automaticamente.');
      }
      
      if (!authUser?.user) {
        console.error('[CREATE_INSTITUTION] User creation returned null user');
        
        // Rollback: delete institution if user creation fails
        try {
          await supabase
            .from('institutions')
            .delete()
            .eq('id', institution.id);
        } catch (rollbackError) {
          console.error('Erro ao fazer rollback da instituição:', rollbackError);
        }
        
        throw new Error('Erro ao criar usuário: resposta inválida do servidor. A instituição foi removida automaticamente.');
      }
      
      console.log('[CREATE_INSTITUTION] User created successfully:', {
        user_id: authUser.user.id,
        email: authUser.user.email,
        email_confirmed: authUser.user.email_confirmed_at
      });
      
      // Link user to institution via RPC function
      const { error: linkError } = await supabase
        .rpc('link_institution_user', {
          p_user_id: authUser.user.id,
          p_institution_id: institution.id,
          p_responsible_name: responsible_name,
        });
      
      if (linkError) {
        // Rollback: delete user and institution if linking fails
        try {
          await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        } catch (deleteUserError) {
          console.error('Erro ao deletar usuário durante rollback:', deleteUserError);
        }
        
        try {
          await supabase
            .from('institutions')
            .delete()
            .eq('id', institution.id);
        } catch (deleteInstError) {
          console.error('Erro ao deletar instituição durante rollback:', deleteInstError);
        }
        
        throw new Error(linkError.message || 'Erro ao vincular usuário à instituição. Os dados foram removidos automaticamente.');
      }
      
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

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: InstitutionUpdate }) => {
      const { data, error } = await supabase
        .from('institutions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institutions'] });
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

export const useDeleteInstitution = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
      if (profile && profile.id && supabaseAdmin) {
        console.log('[DELETE_INSTITUTION] Deleting associated user:', { user_id: profile.id, email: profile.email });
        
        const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(profile.id);
        
        if (deleteUserError) {
          console.error('[DELETE_INSTITUTION] Error deleting user:', deleteUserError);
          // Continuar mesmo se não conseguir deletar o usuário (pode não existir mais)
          // Mas avisar o usuário
          throw new Error('Erro ao excluir usuário associado: ' + deleteUserError.message + '. A instituição não foi excluída.');
        }
        
        console.log('[DELETE_INSTITUTION] User deleted successfully');
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
