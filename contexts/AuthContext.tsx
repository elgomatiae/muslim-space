
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/integrations/supabase/client';
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
    // Get initial session with proper error handling
    supabase.auth.getSession()
      .then(async ({ data: { session }, error }) => {
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }
        
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
      })
      .catch((error) => {
        console.error('Critical error getting session:', error);
        setLoading(false);
        // Don't crash - show login screen instead
        setSession(null);
        setUser(null);
      });

    // Listen for auth changes with proper error handling
    let subscription: { unsubscribe: () => void } | null = null;
    
    try {
      const { data, error } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (error) {
          console.error('Auth state change error:', error);
          setLoading(false);
          return;
        }
        
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
            try {
              router.replace('/(tabs)/(home)/');
            } catch (navError) {
              console.error('Navigation error after sign in:', navError);
              // Continue - user is still signed in
            }
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
          try {
            router.replace('/(auth)/login');
          } catch (navError) {
            console.error('Navigation error after sign out:', navError);
            // Continue - user is still signed out
          }
        }
        
        setLoading(false);
      });
      
      subscription = data.subscription;
    } catch (error) {
      console.error('Error setting up auth state listener:', error);
      setLoading(false);
    }

    return () => {
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing from auth state:', error);
        }
      }
    };
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
