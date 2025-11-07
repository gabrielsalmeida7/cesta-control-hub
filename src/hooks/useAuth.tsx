
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
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, authSession) => {
        if (import.meta.env.DEV) {
          console.log("[SESSION]", "Auth state changed:", {
            event,
            userEmail: authSession?.user?.email,
            hasSession: !!authSession,
            timestamp: new Date().toISOString()
          });
          
          // Log específico para evento SIGNED_OUT
          if (event === 'SIGNED_OUT') {
            console.log("[SESSION]", "SIGNED_OUT event detected - user logged out", {
              timestamp: new Date().toISOString()
            });
          }
        }
        setSession(authSession);
        setUser(authSession?.user ?? null);
        
        if (authSession?.user) {
          // Fetch user profile data
          try {
            if (import.meta.env.DEV) {
              console.log("[PROFILE]", "Profile fetch attempt:", {
                userId: authSession.user.id,
                timestamp: new Date().toISOString()
              });
            }

            const { data: profileData, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', authSession.user.id)
              .single();

            if (error) {
              if (import.meta.env.DEV) {
                console.error("[PROFILE]", "Profile fetch error:", {
                  error: error.message,
                  code: error.code,
                  details: error.details,
                  userId: authSession.user.id,
                  timestamp: new Date().toISOString()
                });
              }
              // Don't return - continue anyway
            } else if (profileData) {
              if (import.meta.env.DEV) {
                console.log("[PROFILE]", "Profile fetch response:", {
                  profileId: profileData?.id,
                  email: profileData?.email,
                  role: profileData?.role,
                  hasInstitutionId: !!profileData?.institution_id,
                  timestamp: new Date().toISOString()
                });
              }
              setProfile(profileData);
            } else {
              if (import.meta.env.DEV) {
                console.warn("[PROFILE]", "Profile data is null:", {
                  userId: authSession.user.id,
                  timestamp: new Date().toISOString()
                });
              }
            }
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error("[PROFILE]", "Unexpected error in profile fetch:", {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                timestamp: new Date().toISOString()
              });
            }
          }
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: authSession } }) => {
      if (import.meta.env.DEV) {
        console.log("[SESSION]", "Initial session check:", {
          hasSession: !!authSession,
          userEmail: authSession?.user?.email,
          timestamp: new Date().toISOString()
        });
      }
      setSession(authSession);
      setUser(authSession?.user ?? null);
      if (!authSession) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
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
      } else {
        if (import.meta.env.DEV) {
          console.log("[AUTH]", "Supabase auth response: success", {
            email,
            user_id: data?.user?.id,
            session_id: data?.session?.access_token ? "exists" : "null",
            timestamp: new Date().toISOString()
          });
        }

        // Wait for onAuthStateChange listener to process and profile to be fetched
        // This ensures the user, session, and profile states are all set before returning
        let waitTime = 0;
        const maxWait = 5000; // 5 second max wait
        const checkInterval = 100;
        
        while ((!user || !profile) && waitTime < maxWait) {
          if (import.meta.env.DEV && waitTime % 500 === 0) {
            console.log("[AUTH]", "Waiting for profile...", {
              has_user: !!user,
              has_profile: !!profile,
              wait_time: waitTime,
              timestamp: new Date().toISOString()
            });
          }
          await new Promise(resolve => setTimeout(resolve, checkInterval));
          waitTime += checkInterval;
        }

        if (import.meta.env.DEV) {
          console.log("[AUTH]", "Sign in complete:", {
            has_user: !!user,
            has_profile: !!profile,
            user_email: user?.email,
            profile_role: profile?.role,
            wait_time: waitTime,
            timestamp: new Date().toISOString()
          });
        }
      }

      return { error };
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
      return { error };
    }
  };

  const signOut = async () => {
    try {
      if (import.meta.env.DEV) {
        console.log("[AUTH]", "Sign out initiated:", {
          timestamp: new Date().toISOString()
        });
      }

      // 1. Limpar bypass_user do localStorage (se existir)
      localStorage.removeItem("bypass_user");
      if (import.meta.env.DEV) {
        console.log("[AUTH]", "Bypass user cleared from localStorage");
      }

      // 2. Limpar todos os tokens do Supabase do localStorage
      const keys = Object.keys(localStorage);
      let clearedTokens = 0;
      keys.forEach(key => {
        if (key.includes('sb-') && (key.includes('auth-token') || key.includes('auth'))) {
          localStorage.removeItem(key);
          clearedTokens++;
        }
      });
      if (import.meta.env.DEV) {
        console.log("[AUTH]", `Cleared ${clearedTokens} Supabase tokens from localStorage`);
      }
      
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
      if (import.meta.env.DEV) {
        console.error("[AUTH]", "Error during sign out:", {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString()
        });
      }
      
      // Reset states anyway, mesmo se houver erro
      setUser(null);
      setSession(null);
      setProfile(null);
      
      // Tentar limpar localStorage mesmo com erro
      try {
        localStorage.removeItem("bypass_user");
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.includes('sb-') && (key.includes('auth-token') || key.includes('auth'))) {
            localStorage.removeItem(key);
          }
        });
      } catch (localStorageError) {
        if (import.meta.env.DEV) {
          console.error("[AUTH]", "Error clearing localStorage:", localStorageError);
        }
      }
      
      if (import.meta.env.DEV) {
        console.log("[AUTH]", "Sign out error handled - states reset. Navigation will be handled by ProtectedRoute or Header component");
      }
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
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
