
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/app/integrations/supabase/client';
import { router } from 'expo-router';
import { initializeUserProfile } from '@/utils/profileSupabaseSync';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.id || 'No session');
      setSession(session);
      setUser(session?.user ?? null);
      
      // Initialize user profile if logged in
      if (session?.user) {
        try {
          await initializeUserProfile(
            session.user.id,
            session.user.user_metadata?.username,
            session.user.email
          );
        } catch (error) {
          console.error('Error initializing user profile:', error);
        }
      }
      
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state changed:', _event, session?.user?.id || 'No session');
      setSession(session);
      setUser(session?.user ?? null);
      
      // Initialize user profile on sign in
      if (_event === 'SIGNED_IN' && session?.user) {
        try {
          await initializeUserProfile(
            session.user.id,
            session.user.user_metadata?.username,
            session.user.email
          );
        } catch (error) {
          console.error('Error initializing user profile:', error);
        }
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      console.log('Signing out...');
      await supabase.auth.signOut();
      // The router.replace will be handled by the useEffect in _layout.tsx
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
