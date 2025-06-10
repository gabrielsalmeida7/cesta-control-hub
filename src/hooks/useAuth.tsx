import { useState, useEffect, createContext, useContext, SetStateAction, Dispatch } from 'react';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { db } from '@/integrations/local-db/client'; // Import local DB client
import { useToast } from '@/hooks/use-toast';

const JWT_SECRET = 'your-jwt-secret-key-here'; // Replace with a strong secret, preferably from env variables

// UserProfile remains the primary source of user details
interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'institution';
  institution_id?: string;
  // password_hash is in the DB but shouldn't be part of UserProfile in context
}

type User = UserProfile | null;
type Session = { token: string } | null; // Session will store the JWT

interface AuthContextType {
  user: User;
  session: Session;
  profile: UserProfile | null; // Kept for consistency, essentially same as 'user'
  loading: boolean;
  setProfile: Dispatch<SetStateAction<UserProfile | null>>; // May not be needed if profile is always derived from user
  signIn: (email: string, password: string) => Promise<{ error: { message: string } | null }>;
  signOut: () => Promise<void>;
  signUp: (userData: Omit<UserProfile, 'id'> & { password_raw: string }) => Promise<{ error: { message: string } | null }>; // Placeholder
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User>(null);
  const [session, setSession] = useState<Session>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const bypassUserJson = localStorage.getItem('bypass_user');

    if (bypassUserJson) {
      try {
        const parsedProfile: UserProfile = JSON.parse(bypassUserJson);
        setProfile(parsedProfile);
        setUser(parsedProfile);
        setSession({ token: 'bypass_token' }); // Mock session for bypass
        console.log('Bypass user loaded:', parsedProfile);
      } catch (error) {
        console.error('Error parsing bypass user:', error);
        localStorage.removeItem('bypass_user');
      }
      setLoading(false);
      return;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as UserProfile & { exp: number };

        if (decoded.exp * 1000 < Date.now()) {
          console.log('Token expired');
          localStorage.removeItem('authToken');
          setLoading(false);
          return;
        }
        
        // Fetch full profile from DB to ensure data is fresh
        // This is important if roles or other details can change
        db.query('SELECT id, email, full_name, role, institution_id FROM profiles WHERE id = $1', [decoded.id])
          .then(result => {
            if (result.rows.length > 0) {
              const userProfileFromDb: UserProfile = result.rows[0];
              setUser(userProfileFromDb);
              setProfile(userProfileFromDb);
              setSession({ token });
              console.log('Session restored from token for user:', userProfileFromDb.email);
            } else {
              console.error('User from token not found in DB');
              localStorage.removeItem('authToken');
            }
          })
          .catch(err => {
            console.error('Error fetching profile during session restore:', err);
            localStorage.removeItem('authToken');
          })
          .finally(() => {
            setLoading(false);
          });
      } catch (error) {
        console.error('Invalid token:', error);
        localStorage.removeItem('authToken');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { rows } = await db.query('SELECT id, email, full_name, role, institution_id, password_hash FROM profiles WHERE email = $1', [email]);
      if (rows.length === 0) {
        toast({ title: "Erro no login", description: "Credenciais inválidas.", variant: "destructive" });
        setLoading(false);
        return { error: { message: 'Credenciais inválidas.' } };
      }

      const dbUser = rows[0];
      const passwordMatch = bcrypt.compareSync(password, dbUser.password_hash);

      if (passwordMatch) {
        const userProfile: UserProfile = {
          id: dbUser.id,
          email: dbUser.email,
          full_name: dbUser.full_name,
          role: dbUser.role,
          institution_id: dbUser.institution_id,
        };
        const token = jwt.sign(userProfile, JWT_SECRET, { expiresIn: '1h' }); // Adjust expiration as needed

        localStorage.setItem('authToken', token);
        setUser(userProfile);
        setProfile(userProfile); // profile state is essentially the same as user
        setSession({ token });
        toast({ title: "Login realizado com sucesso!" });
        setLoading(false);
        return { error: null };
      } else {
        toast({ title: "Erro no login", description: "Credenciais inválidas.", variant: "destructive" });
        setLoading(false);
        return { error: { message: 'Credenciais inválidas.' } };
      }
    } catch (error) {
      console.error('Sign in error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido no servidor.';
      toast({ title: "Erro no login", description: errorMessage, variant: "destructive" });
      setLoading(false);
      return { error: { message: errorMessage } };
    }
  };

  const signOut = async () => {
    setLoading(true);
    localStorage.removeItem('authToken');
    localStorage.removeItem('bypass_user'); // Also clear bypass on explicit signout
    setUser(null);
    setSession(null);
    setProfile(null);
    toast({ title: "Logout realizado", description: "Você foi desconectado com sucesso." });
    setLoading(false);
  };

  // Placeholder signUp function
  const signUp = async (userData: Omit<UserProfile, 'id'> & { password_raw: string }) => {
    setLoading(true);
    console.log('Attempting sign up for:', userData.email);
    // 1. Check if user already exists by email
    // 2. Hash the password_raw using bcrypt.hashSync(userData.password_raw, 10)
    // 3. Insert new user into 'profiles' table with the hashed password and other details
    //    (id can be generated using uuid_generate_v4() if not provided or handle in DB)
    // 4. Optionally, sign them in by generating a JWT and setting session state

    // Placeholder logic:
    await new Promise(resolve => setTimeout(resolve, 1000));
    const mockError = { message: "SignUp not implemented yet." };
    // const mockSuccess = { user: { ... }, session: { ... }, profile: { ... } }
    toast({ title: "Erro no cadastro", description: mockError.message, variant: "destructive" });
    setLoading(false);
    return { error: mockError };
  };


  const value = {
    user,
    session,
    profile,
    loading,
    setProfile,
    signIn,
    signOut,
    signUp, // Add signUp to context
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
