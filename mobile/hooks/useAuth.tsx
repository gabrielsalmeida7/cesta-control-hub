import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/utils/logger';
import { env } from '@/utils/env';

const POLICY_ACCEPTED_KEY = 'policy_accepted';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'institution';
  institution_id?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  reloadProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_SEED_EMAIL = env.adminSeedEmail;

const isValidRole = (role: unknown): role is 'admin' | 'institution' =>
  role === 'admin' || role === 'institution';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const maybeBootstrapAdmin = async (email?: string | null) => {
    try {
      if (ADMIN_SEED_EMAIL && email && email.toLowerCase() === ADMIN_SEED_EMAIL.toLowerCase()) {
        await supabase.rpc('bootstrap_admin', { admin_email: email });
      }
    } catch (e) {
      if (__DEV__) {
        console.warn('bootstrap_admin failed or not applicable:', e);
      }
    }
  };

  const reloadProfile = async (userId: string) => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        if (error.code !== 'PGRST301' && (error as { status?: number }).status !== 403 && __DEV__) {
          console.error('[AUTH] Error reloading profile:', error);
        }
        return null;
      }

      if (profileData && isValidRole(profileData.role)) {
        setProfile(profileData as UserProfile);
        return profileData as UserProfile;
      }

      return null;
    } catch (err) {
      if (__DEV__) {
        console.error('[AUTH] Unexpected error reloading profile:', err);
      }
      return null;
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, authSession) => {
      setSession(authSession);
      setUser(authSession?.user ?? null);

      if (authSession?.user) {
        setTimeout(async () => {
          try {
            const { data: profileData, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', authSession.user!.id)
              .maybeSingle();

            if (error) {
              if (error.code !== 'PGRST301' && (error as { status?: number }).status !== 403) {
                console.error('Error fetching profile:', error);
              }
              setProfile(null);
            } else if (profileData && isValidRole(profileData.role)) {
              setProfile(profileData as UserProfile);
              const shouldBootstrap =
                ADMIN_SEED_EMAIL &&
                authSession.user!.email?.toLowerCase() === ADMIN_SEED_EMAIL.toLowerCase();
              if (shouldBootstrap) {
                await maybeBootstrapAdmin(authSession.user!.email);
                await reloadProfile(authSession.user!.id);
              }
            } else {
              await new Promise((resolve) => setTimeout(resolve, 1000));

              const { data: retryProfileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authSession.user!.id)
                .maybeSingle();

              if (retryProfileData && isValidRole(retryProfileData.role)) {
                setProfile(retryProfileData as UserProfile);
                return;
              }

              const userEmail = authSession.user!.email?.toLowerCase() || '';
              const isAdminSeed =
                ADMIN_SEED_EMAIL && userEmail === ADMIN_SEED_EMAIL.toLowerCase();

              if (!isAdminSeed) {
                toast({
                  title: 'Perfil não encontrado',
                  description:
                    'Seu perfil de usuário não foi encontrado. Entre em contato com o administrador.',
                  variant: 'destructive',
                });
                setProfile(null);
                return;
              }

              const insertPayload = {
                id: authSession.user!.id,
                email: authSession.user!.email ?? '',
                full_name:
                  (authSession.user!.user_metadata as { full_name?: string })?.full_name ||
                  'Administrador',
                role: 'admin' as const,
              };

              const { data: inserted, error: insertError } = await supabase
                .from('profiles')
                .insert(insertPayload)
                .select('*')
                .maybeSingle();

              if (insertError) {
                toast({
                  title: 'Erro ao criar perfil',
                  description: insertError.message,
                  variant: 'destructive',
                });
                setProfile(null);
              } else if (inserted && isValidRole(inserted.role)) {
                setProfile(inserted as UserProfile);
              }
            }
          } catch (err) {
            console.error('Error in profile ensure:', err);
          } finally {
            setLoading(false);
          }
        }, 0);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    const initializeAuth = async () => {
      try {
        const { data: { session: authSession } } = await supabase.auth.getSession();
        setSession(authSession);
        setUser(authSession?.user ?? null);

        if (authSession?.user) {
          const { data: fetchedProfile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authSession.user.id)
            .maybeSingle();

          if (error) {
            setProfile(null);
          } else if (fetchedProfile && isValidRole(fetchedProfile.role)) {
            setProfile(fetchedProfile as UserProfile);
            const shouldBootstrap =
              ADMIN_SEED_EMAIL &&
              authSession.user.email?.toLowerCase() === ADMIN_SEED_EMAIL.toLowerCase();
            if (shouldBootstrap) {
              await maybeBootstrapAdmin(authSession.user.email);
              await reloadProfile(authSession.user.id);
            }
          }
        }

        setLoading(false);
      } catch {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        logger.audit('FAILED_LOGIN', 'unknown', {
          email,
          error_message: error.message,
          error_code: error.code,
        });

        try {
          await supabase.rpc('audit_log', {
            p_action_type: 'FAILED_LOGIN',
            p_description: `Tentativa de login falhada: ${email}`,
            p_severity: 'WARNING',
          });
        } catch {
          // ignore
        }

        let errorMessage = error.message;
        if (error.status === 400) {
          if (
            error.message.includes('Invalid login credentials') ||
            error.message.includes('Email not confirmed')
          ) {
            errorMessage = 'Email ou senha incorretos. Verifique suas credenciais.';
          } else if (error.message.includes('Email rate limit')) {
            errorMessage = 'Muitas tentativas de login. Aguarde alguns minutos.';
          }
        }

        toast({
          title: 'Erro no login',
          description: errorMessage,
          variant: 'destructive',
        });
        return { error };
      }

      logger.audit('LOGIN', data?.user?.id || 'unknown', {
        email,
        user_id: data?.user?.id,
      });

      try {
        await supabase.rpc('audit_log', {
          p_action_type: 'LOGIN',
          p_description: `Login bem-sucedido: ${email}`,
          p_severity: 'INFO',
        });
      } catch {
        // ignore
      }

      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro no login',
        description: errorMessage,
        variant: 'destructive',
      });
      return { error: error instanceof Error ? error : new Error(errorMessage) };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const redirectUrl = Linking.createURL('/');
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectUrl },
      });

      if (error) {
        toast({ title: 'Erro no cadastro', description: error.message, variant: 'destructive' });
      } else {
        toast({
          title: 'Verifique seu email',
          description: 'Enviamos um link de confirmação para concluir o cadastro.',
        });
      }

      return { error };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro no cadastro',
        description: errorMessage,
        variant: 'destructive',
      });
      return { error: error instanceof Error ? error : new Error(errorMessage) };
    }
  };

  const signOut = async () => {
    try {
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        toast({
          title: 'Erro ao sair',
          description: signOutError.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Logout realizado',
          description: 'Você foi desconectado com sucesso.',
        });
      }

      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const reloadProfilePublic = async () => {
    if (user?.id) {
      await reloadProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        reloadProfile: reloadProfilePublic,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export async function getPolicyAccepted(): Promise<boolean> {
  const value = await AsyncStorage.getItem(POLICY_ACCEPTED_KEY);
  return value === 'true';
}

export async function setPolicyAccepted(): Promise<void> {
  await AsyncStorage.setItem(POLICY_ACCEPTED_KEY, 'true');
}
