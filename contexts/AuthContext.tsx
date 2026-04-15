
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/integrations/supabase/client';
import { router } from 'expo-router';
import { initializeUserProfile } from '@/utils/profileSupabaseSync';
import { clearUserSpecificData } from '@/utils/userSpecificStorage';
import { clearAllLearningSectionUnlocks } from '@/utils/learningSectionUnlock';
import { applySupabaseSessionFromUrl } from '@/utils/supabaseAuthDeepLink';

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
  /** Avoid re-rendering the whole app on silent token refresh (same user). */
  const lastAuthUserIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      void (async () => {
        try {
          const { error } = await applySupabaseSessionFromUrl(url);
          if (error) {
            console.warn('Supabase session from deep link:', error.message);
          }
        } catch (e) {
          console.warn('Failed to apply auth deep link:', e);
        }
      })();
    });

    void (async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          const { error } = await applySupabaseSessionFromUrl(initialUrl);
          if (error) {
            console.warn('Supabase session from initial URL:', error.message);
          }
        }
      } catch (e) {
        console.warn('Failed to read initial auth URL:', e);
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }

        console.log('Initial session check:', session?.user?.id || 'No session');
        setSession(session);
        setUser(session?.user ?? null);
        lastAuthUserIdRef.current = session?.user?.id;

        if (session?.user) {
          try {
            console.log('🔐 Initial session found, initializing profile...');
            const username =
              session.user.user_metadata?.username || session.user.email?.split('@')[0];
            await initializeUserProfile(session.user.id, username, session.user.email);
          } catch (error) {
            console.error('❌ Error initializing user profile:', error);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Critical error getting session:', error);
        setLoading(false);
        setSession(null);
        setUser(null);
      }
    })();

    // Listen for auth changes with proper error handling
    let subscription: { unsubscribe: () => void } | null = null;
    
    try {
      const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (
          _event === 'TOKEN_REFRESHED' &&
          session?.user &&
          session.user.id === lastAuthUserIdRef.current
        ) {
          return;
        }
        lastAuthUserIdRef.current = session?.user?.id;

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
            // Do not router.replace here: (auth)/_layout and ProtectedRoute already
            // send the user to tabs; a late replace would run after WelcomeMuslimSpaceHost
            // and skip the first-time welcome tour.
          } catch (error) {
            console.error('❌ Error initializing user profile:', error);
            // Continue even if profile initialization fails
          }
        }
        
        // Clear user-specific data and redirect to login on sign out
        if (_event === 'SIGNED_OUT') {
          clearAllLearningSectionUnlocks();
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
      linkingSubscription.remove();
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
      clearAllLearningSectionUnlocks();
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
