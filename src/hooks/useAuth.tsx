
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
    let isInitialLoad = true;
    let initialLoadComplete = false;

    // Helper function to fetch profile
    const fetchProfile = async (userId: string) => {
      try {
        if (import.meta.env.DEV) {
          console.log("[PROFILE]", "Profile fetch attempt:", {
            userId,
            timestamp: new Date().toISOString()
          });
        }

        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          if (import.meta.env.DEV) {
            console.error("[PROFILE]", "Profile fetch error:", {
              error: error.message,
              code: error.code,
              details: error.details,
              userId,
              timestamp: new Date().toISOString()
            });
          }
          return null;
        }

        if (profileData) {
          if (import.meta.env.DEV) {
            console.log("[PROFILE]", "Profile fetch response:", {
              profileId: profileData?.id,
              email: profileData?.email,
              role: profileData?.role,
              hasInstitutionId: !!profileData?.institution_id,
              timestamp: new Date().toISOString()
            });
          }
          return profileData;
        }

        return null;
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("[PROFILE]", "Unexpected error in profile fetch:", {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString()
          });
        }
        return null;
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, authSession) => {
        if (import.meta.env.DEV) {
          console.log("[SESSION]", "Auth state changed:", {
            event,
            userEmail: authSession?.user?.email,
            hasSession: !!authSession,
            isInitialLoad,
            initialLoadComplete,
            timestamp: new Date().toISOString()
          });
          
          if (event === 'SIGNED_OUT') {
            console.log("[SESSION]", "SIGNED_OUT event detected - user logged out", {
              timestamp: new Date().toISOString()
            });
          }
        }

        // During initial load, let getSession() handle everything
        if (isInitialLoad && !initialLoadComplete) {
          if (import.meta.env.DEV) {
            console.log("[SESSION]", "Ignoring onAuthStateChange during initial load", {
              event,
              timestamp: new Date().toISOString()
            });
          }
          return;
        }

        setSession(authSession);
        setUser(authSession?.user ?? null);
        
        if (authSession?.user) {
          const profileData = await fetchProfile(authSession.user.id);
          setProfile(profileData);
        } else {
          setProfile(null);
        }
        
        // Only set loading to false if not during initial load
        if (!isInitialLoad) {
          setLoading(false);
        }
      }
    );

    // Check for existing session FIRST (initial load)
    const initializeAuth = async () => {
      try {
        if (import.meta.env.DEV) {
          console.log("[SESSION]", "Initial session check started", {
            timestamp: new Date().toISOString()
          });
        }

        const { data: { session: authSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          if (import.meta.env.DEV) {
            console.error("[SESSION]", "Error getting session:", {
              error: error.message,
              timestamp: new Date().toISOString()
            });
          }
          setLoading(false);
          initialLoadComplete = true;
          isInitialLoad = false;
          return;
        }

        if (import.meta.env.DEV) {
          console.log("[SESSION]", "Initial session check result:", {
            hasSession: !!authSession,
            userEmail: authSession?.user?.email,
            timestamp: new Date().toISOString()
          });
        }

        setSession(authSession);
        setUser(authSession?.user ?? null);

        let profileData = null;
        if (authSession?.user) {
          // Fetch profile immediately
          profileData = await fetchProfile(authSession.user.id);
          setProfile(profileData);
        } else {
          setProfile(null);
        }

        // Mark initial load as complete
        initialLoadComplete = true;
        isInitialLoad = false;
        setLoading(false);

        if (import.meta.env.DEV) {
          console.log("[SESSION]", "Initial load complete", {
            hasSession: !!authSession,
            hasUser: !!authSession?.user,
            hasProfile: !!profileData,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("[SESSION]", "Unexpected error during initial load:", {
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString()
          });
        }
        setLoading(false);
        initialLoadComplete = true;
        isInitialLoad = false;
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
