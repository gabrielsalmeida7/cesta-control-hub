
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
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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

  // Create a mock session for bypass users with proper JWT simulation
  const createBypassSession = (bypassProfile: UserProfile) => {
    console.log('🔧 Creating bypass session for:', bypassProfile.role, bypassProfile.id);
    
    // Create a proper JWT-like token for Supabase
    const tokenPayload = {
      sub: bypassProfile.id,
      email: bypassProfile.email,
      role: 'authenticated',
      user_metadata: { 
        full_name: bypassProfile.full_name,
        role: bypassProfile.role 
      },
      app_metadata: {},
      aud: 'authenticated',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    };

    // Create base64 encoded "JWT" (não criptografado, apenas para simulação)
    const mockJWT = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify(tokenPayload))}.mock-signature`;
    
    const mockUser = {
      id: bypassProfile.id,
      email: bypassProfile.email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_metadata: { 
        full_name: bypassProfile.full_name,
        role: bypassProfile.role 
      },
      app_metadata: {},
      aud: 'authenticated',
      role: 'authenticated',
      confirmation_sent_at: null,
      recovery_sent_at: null,
      email_change_sent_at: null,
      new_email: null,
      invited_at: null,
      action_link: null,
      email_confirmed_at: new Date().toISOString(),
      phone_confirmed_at: null,
      confirmed_at: new Date().toISOString(),
      email_change: null,
      phone_change: null,
      phone: null,
      factors: null,
      identities: []
    } as User;

    const mockSession = {
      access_token: mockJWT,
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user: mockUser
    } as Session;

    // Inject the session into Supabase client internal state
    try {
      // @ts-ignore - Acesso interno ao estado do Supabase
      if (supabase.auth._currentSession !== mockSession) {
        // @ts-ignore
        supabase.auth._currentSession = mockSession;
        // @ts-ignore
        supabase.auth._currentUser = mockUser;
        
        console.log('✅ Injected session into Supabase client');
      }
    } catch (error) {
      console.warn('⚠️ Could not inject session into Supabase client:', error);
    }

    return { user: mockUser, session: mockSession };
  };

  useEffect(() => {
    console.log('🔐 Auth hook initializing...');
    
    // Check for bypass user first
    const bypassUser = localStorage.getItem('bypass_user');
    if (bypassUser) {
      try {
        const parsedUser = JSON.parse(bypassUser);
        console.log('🚀 Using bypass user:', parsedUser);
        
        // Create mock session for bypass user
        const { user: mockUser, session: mockSession } = createBypassSession(parsedUser);
        
        setProfile(parsedUser);
        setUser(mockUser);
        setSession(mockSession);
        setLoading(false);
        
        // Redirect bypass user based on role
        redirectUserBasedOnRole(parsedUser.role);
        return;
      } catch (error) {
        console.error('❌ Error parsing bypass user:', error);
        localStorage.removeItem('bypass_user');
      }
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile data with better error handling
          try {
            const { data: profileData, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (error) {
              console.error('Error fetching profile:', error);
              setProfile(null);
            } else if (profileData) {
              setProfile(profileData);
              // Redirect based on user role after profile is loaded
              redirectUserBasedOnRole(profileData.role);
            } else {
              console.log('No profile found for user');
              setProfile(null);
            }
          } catch (error) {
            console.error('Error in profile fetch:', error);
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Erro no login",
          description: error.message,
          variant: "destructive",
        });
      }

      return { error };
    } catch (error) {
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
      console.log('🚪 Signing out...');
      
      // Clear bypass user if exists
      localStorage.removeItem('bypass_user');
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Erro ao sair",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Logout realizado",
          description: "Você foi desconectado com sucesso.",
        });
      }
      
      // Reset states
      setUser(null);
      setSession(null);
      setProfile(null);
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
