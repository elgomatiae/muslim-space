
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/app/integrations/supabase/client';
import { router } from 'expo-router';
import { initializeUserProfile } from '@/utils/profileSupabaseSync';
import { clearUserSpecificData } from '@/utils/userSpecificStorage';

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
          console.log('🔐 Initial session found, initializing profile...');
          const username = session.user.user_metadata?.username || session.user.email?.split('@')[0];
          await initializeUserProfile(
            session.user.id,
            username,
            session.user.email
          );
        } catch (error) {
          console.error('❌ Error initializing user profile:', error);
          // Continue even if profile initialization fails
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
          console.log('🔐 User signed in, initializing profile...');
          console.log('📝 User metadata:', session.user.user_metadata);
          console.log('📝 Username from metadata:', session.user.user_metadata?.username);
          
          // Get username from metadata or email
          const username = session.user.user_metadata?.username || session.user.email?.split('@')[0];
          
          await initializeUserProfile(
            session.user.id,
            username, // Use username from metadata or email prefix
            session.user.email
          );
          // Redirect to home after successful sign in
          router.replace('/(tabs)/(home)/');
        } catch (error) {
          console.error('❌ Error initializing user profile:', error);
          // Continue even if profile initialization fails
        }
      }
      
      // Clear user-specific data and redirect to login on sign out
      if (_event === 'SIGNED_OUT') {
        // Clear Iman tracker data for the previous user
        const previousUserId = user?.id;
        if (previousUserId) {
          console.log(`🧹 Clearing user-specific data for user: ${previousUserId}`);
          clearUserSpecificData(previousUserId).catch(err => {
            console.error('Error clearing user data on logout:', err);
          });
        }
        router.replace('/(auth)/login');
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []); // Empty deps - subscription handles user state internally

  const signOut = async () => {
    try {
      console.log('Signing out...');
      const currentUserId = user?.id;
      await supabase.auth.signOut();
      // Clear user-specific data
      if (currentUserId) {
        console.log(`🧹 Clearing user-specific data for user: ${currentUserId}`);
        clearUserSpecificData(currentUserId).catch(err => {
          console.error('Error clearing user data on logout:', err);
        });
      }
      // The router.replace will be handled by the useEffect
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
