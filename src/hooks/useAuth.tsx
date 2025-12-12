
import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
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
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  reloadProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const ADMIN_SEED_EMAIL = 'teste@admin.com';
  const maybeBootstrapAdmin = async (email?: string | null) => {
    try {
      if (email && email.toLowerCase() === ADMIN_SEED_EMAIL) {
        await (supabase as any).rpc('bootstrap_admin', { admin_email: email });
      }
    } catch (e) {
      console.warn('bootstrap_admin failed or not applicable:', e);
    }
  };

  // Helper function to validate role
  const isValidRole = (role: any): role is 'admin' | 'institution' => {
    return role === 'admin' || role === 'institution';
  };

  // Helper function to reload profile from database
  const reloadProfile = async (userId: string) => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        // Ignorar erro 403 (Forbidden) quando não há sessão válida - é esperado
        if (error.code !== 'PGRST301' && error.status !== 403) {
          if (import.meta.env.DEV) {
            console.error('[AUTH] Error reloading profile:', error);
          }
        }
        return null;
      }

      if (profileData) {
        setProfile(profileData);
        return profileData;
      }

      return null;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[AUTH] Unexpected error reloading profile:', err);
      }
      return null;
    }
  };


  useEffect(() => {
    console.log('🔐 Auth hook initializing...');
    

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setTimeout(async () => {
          try {
            const { data: profileData, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user!.id)
              .maybeSingle();

              if (error) {
                // Ignorar erro 403 (Forbidden) quando não há sessão válida - é esperado
                if (error.code !== 'PGRST301' && error.status !== 403) {
                  console.error('Error fetching profile:', error);
                }
                setProfile(null);
              } else if (profileData) {
                setProfile(profileData);
                // Bootstrap admin and reload profile if bootstrap was executed
                const shouldBootstrap = session.user!.email?.toLowerCase() === ADMIN_SEED_EMAIL;
                if (shouldBootstrap) {
                  await maybeBootstrapAdmin(session.user!.email);
                  // Reload profile after bootstrap to get updated role
                  await reloadProfile(session.user!.id);
                }
              } else {
              // Profile doesn't exist - wait a bit and check again (in case it's being created by link_institution_user)
              // This prevents race conditions where useAuth tries to create profile before link_institution_user finishes
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Check again if profile was created in the meantime
              const { data: retryProfileData, error: retryError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user!.id)
                .maybeSingle();
              
              if (retryProfileData) {
                // Profile was created, use it
                setProfile(retryProfileData);
                if (import.meta.env.DEV) {
                  console.log('[PROFILE] Profile found after retry:', {
                    role: retryProfileData.role,
                    institution_id: retryProfileData.institution_id,
                    email: retryProfileData.email
                  });
                }
                return;
              }
              
              // If still no profile, only create one if it's the admin seed email
              // For institution users, the profile should be created by link_institution_user
              // If it doesn't exist, something went wrong and we shouldn't create a profile without institution_id
              const userEmail = session.user!.email?.toLowerCase() || '';
              const isAdminSeed = userEmail === ADMIN_SEED_EMAIL;
              
              if (!isAdminSeed) {
                // For non-admin users, if profile doesn't exist, it means link_institution_user wasn't called
                // or failed. Don't create a profile without institution_id as it violates constraints.
                if (import.meta.env.DEV) {
                  console.warn('[PROFILE] Profile not found for institution user. Profile should be created via link_institution_user. Email:', userEmail);
                }
                toast({
                  title: "Perfil não encontrado",
                  description: "Seu perfil de usuário não foi encontrado. Por favor, entre em contato com o administrador.",
                  variant: "destructive",
                });
                setProfile(null);
                return;
              }
              
              // Only create profile for admin seed email
              const insertPayload = {
                id: session.user!.id,
                email: session.user!.email,
                full_name: (session.user!.user_metadata as any)?.full_name || 'Administrador',
                role: 'admin' as const,
              };

              const { data: inserted, error: insertError } = await supabase
                .from('profiles')
                .insert(insertPayload)
                .select('*')
                .maybeSingle();

              if (insertError) {
                // If it's a duplicate, try to fetch existing profile
                if (insertError.code === '23505') {
                  const { data: existingProfile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user!.id)
                    .maybeSingle();
                  
                  if (existingProfile) {
                    setProfile(existingProfile);
                    if (import.meta.env.DEV) {
                      console.log('[PROFILE] Profile found after duplicate error:', existingProfile);
                    }
                    return;
                  }
                }
                
                if (import.meta.env.DEV) {
                  console.error('[PROFILE] Error creating admin profile:', {
                    error: insertError.message,
                    code: insertError.code,
                    timestamp: new Date().toISOString()
                  });
                }
                toast({
                  title: "Erro ao criar perfil",
                  description: insertError.message || 'Erro desconhecido ao criar perfil',
                  variant: "destructive",
                });
                setProfile(null);
              } else if (inserted) {
                setProfile(inserted);
                if (import.meta.env.DEV) {
                  console.log('[PROFILE] Admin profile created:', inserted);
                }
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

    // THEN check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session: authSession } } = await supabase.auth.getSession();
        setSession(authSession);
        setUser(authSession?.user ?? null);
        
        let profileData = null;
        
        if (authSession?.user) {
          const { data: fetchedProfile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authSession.user.id)
            .maybeSingle();

          if (error) {
            // Ignorar erro 403 (Forbidden) quando não há sessão válida - é esperado
            if (error.code !== 'PGRST301' && error.status !== 403) {
              console.error('Error fetching profile:', error);
            }
            setProfile(null);
          } else if (fetchedProfile) {
            profileData = fetchedProfile;
            setProfile(fetchedProfile);
            // Bootstrap admin and reload profile if bootstrap was executed
            const shouldBootstrap = authSession.user.email?.toLowerCase() === ADMIN_SEED_EMAIL;
            if (shouldBootstrap) {
              await maybeBootstrapAdmin(authSession.user.email);
              // Reload profile after bootstrap to get updated role
              await reloadProfile(authSession.user.id);
            }
          } else {
            // Profile doesn't exist, create it (same logic as onAuthStateChange)
            const userEmail = authSession.user.email?.toLowerCase() || '';
            const defaultRole: 'admin' | 'institution' = userEmail === ADMIN_SEED_EMAIL ? 'admin' : 'institution';
            
            const insertPayload = {
              id: authSession.user.id,
              email: authSession.user.email,
              full_name: (authSession.user.user_metadata as any)?.full_name || 'Usuário',
              role: defaultRole,
            } as any;

            const { data: inserted, error: insertError } = await supabase
              .from('profiles')
              .insert(insertPayload)
              .select('*')
              .maybeSingle();

            if (insertError) {
              console.error('Error creating profile in initializeAuth:', insertError);
              setProfile(null);
            } else if (inserted) {
              profileData = inserted;
              setProfile(inserted);
              // Bootstrap admin and reload profile if bootstrap was executed
              const shouldBootstrap = authSession.user.email?.toLowerCase() === ADMIN_SEED_EMAIL;
              if (shouldBootstrap) {
                try {
                  await maybeBootstrapAdmin(authSession.user.email);
                  // Reload profile after bootstrap to get updated role
                  await reloadProfile(authSession.user.id);
                } catch (bootstrapError) {
                  if (import.meta.env.DEV) {
                    console.warn('[PROFILE] Bootstrap admin failed in initializeAuth:', bootstrapError);
                  }
                }
              }
            }
          }
        }

        setLoading(false);

        if (import.meta.env.DEV) {
          console.log("[SESSION]", "Initial load complete", {
            hasSession: !!authSession,
            hasUser: !!authSession?.user,
            hasProfile: !!profileData,
            timestamp: new Date().toISOString()
          });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (import.meta.env.DEV) {
          console.error("[SESSION]", "Unexpected error during initial load:", errorMessage);
        }
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      if (import.meta.env.DEV) {
        console.log("[AUTH]", "Login attempt started:", {
          email,
          timestamp: new Date().toISOString()
        });
      }

      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (import.meta.env.DEV) {
          console.error("[AUTH]", "Supabase auth error:", {
            error: error.message,
            status: error.status,
            code: error.code,
            email,
            timestamp: new Date().toISOString()
          });
          
          // Log mais detalhes para debug
          console.error("[AUTH]", "Error details:", error);
        }

        // Mensagens de erro mais específicas
        let errorMessage = error.message;
        if (error.status === 400) {
          if (error.message.includes('Invalid login credentials') || error.message.includes('Email not confirmed')) {
            errorMessage = 'Email ou senha incorretos. Verifique suas credenciais.';
          } else if (error.message.includes('Email rate limit')) {
            errorMessage = 'Muitas tentativas de login. Aguarde alguns minutos.';
          } else {
            errorMessage = `Erro de autenticação: ${error.message}`;
          }
        }

        toast({
          title: "Erro no login",
          description: errorMessage,
          variant: "destructive",
        });
        return { error };
      }

      if (import.meta.env.DEV) {
        console.log("[AUTH]", "Supabase auth response: success", {
          email,
          user_id: data?.user?.id,
          session_id: data?.session?.access_token ? "exists" : "null",
          timestamp: new Date().toISOString()
        });
      }

      // The onAuthStateChange listener will handle updating user, session, and profile
      // We don't need to wait here - the ProtectedRoute and Login page will handle navigation
      // based on the auth state changes

      return { error: null };
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("[AUTH]", "Unexpected error during sign in:", {
          error: error instanceof Error ? error.message : String(error),
          email,
          timestamp: new Date().toISOString()
        });
      }

      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro no login",
        description: errorMessage,
        variant: "destructive",
      });
      return { error: error instanceof Error ? error : new Error(errorMessage) };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        toast({
          title: 'Erro no cadastro',
          description: error.message,
          variant: 'destructive',
        });
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
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 Signing out...');
      
      
      // 3. Sign out from Supabase (limpa sessão no servidor e localmente)
      const { error: signOutError } = await supabase.auth.signOut();
      
      if (signOutError) {
        const error = signOutError;
        if (import.meta.env.DEV) {
          console.error("[AUTH]", "Supabase signOut error:", {
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
        toast({
          title: "Erro ao sair",
          description: error?.message || "Erro ao limpar sessão",
          variant: "destructive",
        });
      } else {
        if (import.meta.env.DEV) {
          console.log("[AUTH]", "Sign out successful - session and tokens cleared:", {
            timestamp: new Date().toISOString()
          });
        }
        toast({
          title: "Logout realizado",
          description: "Você foi desconectado com sucesso.",
        });
      }
      
      // 5. Resetar todos os states
      // Os states serão atualizados pelo onAuthStateChange quando o evento SIGNED_OUT for disparado
      setUser(null);
      setSession(null);
      setProfile(null);
      
      if (import.meta.env.DEV) {
        console.log("[AUTH]", "Sign out complete - states reset. Navigation will be handled by ProtectedRoute or Header component");
      }
    } catch (error) {
      console.error('❌ Error signing out:', error);
    }
  };

  // Public function to reload profile from database
  const reloadProfilePublic = async () => {
    if (user?.id) {
      if (import.meta.env.DEV) {
        console.log('[AUTH] reloadProfilePublic called for user:', user.id);
      }
      const reloadedProfile = await reloadProfile(user.id);
      if (import.meta.env.DEV) {
        console.log('[AUTH] reloadProfilePublic completed:', {
          success: !!reloadedProfile,
          email: reloadedProfile?.email
        });
      }
    } else {
      if (import.meta.env.DEV) {
        console.warn('[AUTH] reloadProfilePublic called but no user.id available');
      }
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    reloadProfile: reloadProfilePublic,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
