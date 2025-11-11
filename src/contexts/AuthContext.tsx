import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: string | null;
  bdmId: number | null;
  isAdmin: boolean;
  isManager: boolean;
  isUser: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [bdmId, setBdmId] = useState<number | null>(null);

  // Computed role flags
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';
  const isUser = userRole === 'user';

  // Fetch user role and BDM ID
  const fetchUserRoleAndBdm = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, bdm_id')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      if (data) {
        setUserRole(data.role);
        setBdmId(data.bdm_id);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole(null);
      setBdmId(null);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch role and BDM asynchronously using setTimeout
        if (session?.user) {
          setTimeout(() => {
            fetchUserRoleAndBdm(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
          setBdmId(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRoleAndBdm(session.user.id);
      }
      
      setLoading(false);
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
        // Map Supabase errors to user-friendly messages
        if (error.message.includes('Invalid login credentials')) {
          return { error: new Error('Invalid email or password') };
        }
        if (error.message.includes('Email not confirmed')) {
          return { error: new Error('Please confirm your email address') };
        }
        return { error: new Error('Login failed. Please try again.') };
      }
      
      return { error: null };
    } catch (error) {
      return { error: new Error('Network error. Please check your connection.') };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
    setBdmId(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      userRole, 
      bdmId,
      isAdmin,
      isManager,
      isUser,
      signIn, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
