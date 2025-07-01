import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  image?: string;
  role?: string;
}

// Retry utility function
const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      console.warn(`Operation failed (attempt ${i + 1}/${maxRetries}):`, error.message);
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError!;
};

// Get current user session with retry logic
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const result = await retryOperation(async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        // If it's a network error, throw to trigger retry
        if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
          throw new Error(`Network error: ${error.message}`);
        }
        console.error('Auth error (non-network):', error);
        return null;
      }
      
      return user;
    }, 3, 1000);
    
    if (!result) return null;
    
    return {
      id: result.id,
      name: result.user_metadata?.full_name || result.user_metadata?.name || result.email?.split('@')[0] || 'User',
      email: result.email || '',
      image: result.user_metadata?.avatar_url || result.user_metadata?.picture,
      role: result.user_metadata?.role || 'user'
    };
  } catch (error: any) {
    console.error('Error getting current user after retries:', error);
    
    // Check if we have cached session data in localStorage as fallback
    if (typeof window !== 'undefined') {
      try {
        const cachedSession = localStorage.getItem('supabase.auth.token');
        if (cachedSession) {
          console.log('Using cached session data as fallback');
          const parsed = JSON.parse(cachedSession);
          if (parsed.user) {
            return {
              id: parsed.user.id,
              name: parsed.user.user_metadata?.full_name || parsed.user.user_metadata?.name || parsed.user.email?.split('@')[0] || 'User',
              email: parsed.user.email || '',
              image: parsed.user.user_metadata?.avatar_url || parsed.user.user_metadata?.picture,
              role: parsed.user.user_metadata?.role || 'user'
            };
          }
        }
      } catch (cacheError) {
        console.warn('Failed to read cached session:', cacheError);
      }
    }
    
    return null;
  }
};

// Alias for backward compatibility
export const getStoredUser = getCurrentUser;

// Sign in with Google with improved error handling
export const signInWithGoogle = async () => {
  try {
    const result = await retryOperation(async () => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/login`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        }
      });
      
      if (error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
          throw new Error(`Network error during Google sign in: ${error.message}`);
        }
        throw error;
      }
      
      return data;
    }, 3, 2000);
    
    return result;
  } catch (error: any) {
    console.error('Error signing in with Google after retries:', error);
    
    // Provide user-friendly error messages
    if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
      throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet và thử lại.');
    } else if (error.message.includes('redirect_uri_mismatch')) {
      throw new Error('Cấu hình OAuth chưa đúng. Vui lòng liên hệ quản trị viên.');
    } else {
      throw new Error(error.message || 'Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại.');
    }
  }
};

// Sign out with improved error handling
export const signOut = async () => {
  try {
    await retryOperation(async () => {
      const { error } = await supabase.auth.signOut();
      if (error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
          throw new Error(`Network error during sign out: ${error.message}`);
        }
        throw error;
      }
    }, 2, 1000);
    
  } catch (error: any) {
    console.warn('Sign out error (continuing with local cleanup):', error);
    // Continue with local cleanup even if server sign out fails
  } finally {
    // Always clear local data regardless of server response
    if (typeof window !== 'undefined') {
      // Clear Supabase cookies
      document.cookie = 'sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      // Clear localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('supabase.auth.')) {
          localStorage.removeItem(key);
        }
      });
      
      // Force reload to clear any cached state
      window.location.href = '/';
    }
  }
};

// Check if user is authenticated with fallback
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    return !!user;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

// Listen to auth state changes with improved error handling
export const onAuthStateChange = (callback: (user: AuthUser | null) => void) => {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth state change:', event, !!session);
    
    try {
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
    } catch (error) {
      console.error('Error in auth state change handler:', error);
      callback(null);
    }
  });
};