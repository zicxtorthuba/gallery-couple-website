import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  image?: string;
  role?: string;
}

// Get current user session
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }
    
    if (!user) return null;
    
    return {
      id: user.id,
      name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      email: user.email || '',
      image: user.user_metadata?.avatar_url || user.user_metadata?.picture,
      role: user.user_metadata?.role || 'user'
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Alias for backward compatibility
export const getStoredUser = getCurrentUser;

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/login`, // Redirect back to login page to handle tokens
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      }
    });
    
    if (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

// Sign out
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
      throw error;
    }
    
    // Clear cookies and local storage
    if (typeof window !== 'undefined') {
      // Clear Supabase cookies
      document.cookie = 'sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      // Clear any localStorage items
      localStorage.clear();
      
      // Force reload to clear any cached state
      window.location.href = '/';
    }
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    return !!user;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

// Listen to auth state changes
export const onAuthStateChange = (callback: (user: AuthUser | null) => void) => {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth state change:', event, !!session);
    
    if (session?.user) {
      const authUser: AuthUser = {
        id: session.user.id,
        name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
        email: session.user.email || '',
        image: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
        role: session.user.user_metadata?.role || 'user'
      };
      callback(authUser);
    } else {
      callback(null);
    }
  });
};