
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const ADMIN_SEED_EMAIL = 'admin@teste.com';
  const maybeBootstrapAdmin = async (email?: string | null) => {
    try {
      if (email && email.toLowerCase() === ADMIN_SEED_EMAIL) {
        await (supabase as any).rpc('bootstrap_admin', { admin_email: email });
      }
    } catch (e) {
      console.warn('bootstrap_admin failed or not applicable:', e);
    }
  };

  // Helper function to redirect user based on role
  const redirectUserBasedOnRole = (role: 'admin' | 'institution') => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      
      if (role === 'admin' && !currentPath.startsWith('/institution')) {
        // Admin users go to main dashboard if not already there
        if (currentPath === '/login') {
          window.location.href = '/';
        }
      } else if (role === 'institution') {
        // Institution users go to institution dashboard
        if (!currentPath.startsWith('/institution')) {
          window.location.href = '/institution/dashboard';
        }
      }
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
                console.error('Error fetching profile:', error);
                setProfile(null);
              } else if (profileData) {
                setProfile(profileData);
                await maybeBootstrapAdmin(session.user!.email);
                redirectUserBasedOnRole(profileData.role);
              } else {
              // Ensure profile exists
              const insertPayload = {
                id: session.user!.id,
                email: session.user!.email,
                full_name: (session.user!.user_metadata as any)?.full_name || 'Usuário',
              } as any;

              const { data: inserted, error: insertError } = await supabase
                .from('profiles')
                .insert(insertPayload)
                .select('*')
                .maybeSingle();

                if (insertError) {
                  console.error('Error creating profile:', insertError);
                } else if (inserted) {
                  setProfile(inserted);
                  await maybeBootstrapAdmin(session.user!.email);
                  redirectUserBasedOnRole(inserted.role);
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
            console.error('Error fetching profile:', error);
            setProfile(null);
          } else if (fetchedProfile) {
            profileData = fetchedProfile;
            setProfile(fetchedProfile);
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
        }

        toast({
          title: "Erro no login",
          description: error.message,
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

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
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
