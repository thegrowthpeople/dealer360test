import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Toggle between mock and real Supabase authentication
const MOCK_MODE = true;

interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (MOCK_MODE) {
      // Check for mock auth token in localStorage
      const mockToken = localStorage.getItem('mock_auth_token');
      if (mockToken) {
        setUser({
          id: 'mock-user-id',
          email: 'admin@example.com',
          user_metadata: { full_name: 'Admin User' }
        });
      }
      setLoading(false);
    } else {
      // Real Supabase authentication
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user as User | null);
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user as User | null);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    if (MOCK_MODE) {
      // Mock authentication - accept any email with password "password123"
      if (password === 'password123') {
        const mockUser = {
          id: 'mock-user-id',
          email: email,
          user_metadata: { full_name: email.split('@')[0] }
        };
        setUser(mockUser);
        localStorage.setItem('mock_auth_token', 'mock-token');
        return { error: null };
      } else {
        return { error: new Error('Invalid credentials. Use password: password123') };
      }
    } else {
      // Real Supabase authentication
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    }
  };

  const signOut = async () => {
    if (MOCK_MODE) {
      setUser(null);
      localStorage.removeItem('mock_auth_token');
    } else {
      await supabase.auth.signOut();
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
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
