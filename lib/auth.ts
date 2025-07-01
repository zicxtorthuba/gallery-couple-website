import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  image?: string;
  role?: string;
}

// Session management utilities
const SESSION_STORAGE_KEY = 'supabase.auth.session';
const SESSION_CHECK_INTERVAL = 30000; // 30 seconds

// Retry utility function with exponential backoff
const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      console.warn(`Operation failed (attempt ${i + 1}/${maxRetries}):`, error.message);
      
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
};

// Enhanced session validation
const validateSession = async (): Promise<User | null> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session validation error:', error);
      return null;
    }
    
    if (!session || !session.user) {
      return null;
    }
    
    // Check if session is expired
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at < now) {
      console.log('Session expired, attempting refresh...');
      
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !refreshData.session) {
        console.error('Session refresh failed:', refreshError);
        return null;
      }
      
      return refreshData.session.user;
    }
    
    return session.user;
  } catch (error) {
    console.error('Session validation failed:', error);
    return null;
  }
};

// Get current user session with enhanced error handling
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const user = await retryOperation(async () => {
      // First try to validate existing session
      const sessionUser = await validateSession();
      if (sessionUser) {
        return sessionUser;
      }
      
      // If no valid session, try to get user directly
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
          throw new Error(`Network error: ${error.message}`);
        }
        console.error('Auth error (non-network):', error);
        return null;
      }
      
      return user;
    }, 3, 1000);
    
    if (!user) return null;
    
    const authUser: AuthUser = {
      id: user.id,
      name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      email: user.email || '',
      image: user.user_metadata?.avatar_url || user.user_metadata?.picture,
      role: user.user_metadata?.role || 'user'
    };
    
    // Cache the session for faster subsequent access
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
        user: authUser,
        timestamp: Date.now()
      }));
    }
    
    return authUser;
  } catch (error: any) {
    console.error('Error getting current user after retries:', error);
    
    // Check for cached session as fallback (only if recent)
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(SESSION_STORAGE_KEY);
        if (cached) {
          const { user, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;
          
          // Use cached session if less than 5 minutes old
          if (age < 5 * 60 * 1000 && user) {
            console.log('Using cached session data as fallback');
            return user;
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

// Enhanced Google sign in with better error handling
export const signInWithGoogle = async () => {
  try {
    // Clear any existing session data first
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
    
    const result = await retryOperation(async () => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/login`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
          skipBrowserRedirect: false
        }
      });
      
      if (error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
          throw new Error(`Network error during Google sign in: ${error.message}`);
        }
        throw error;
      }
      
      return data;
    }, 2, 2000);
    
    console.log('Google OAuth initiated successfully');
    return result;
  } catch (error: any) {
    console.error('Error signing in with Google after retries:', error);
    
    // Provide user-friendly error messages
    if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
      throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet và thử lại.');
    } else if (error.message.includes('redirect_uri_mismatch')) {
      throw new Error('Cấu hình OAuth chưa đúng. Vui lòng liên hệ quản trị viên.');
    } else if (error.message.includes('popup_blocked')) {
      throw new Error('Trình duyệt đã chặn popup. Vui lòng cho phép popup và thử lại.');
    } else {
      throw new Error(error.message || 'Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại.');
    }
  }
};

// Enhanced sign out with better cleanup
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
      // Clear all Supabase related data
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('supabase.auth.') || key === SESSION_STORAGE_KEY) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear cookies
      document.cookie = 'sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
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

// Enhanced auth state change listener
export const onAuthStateChange = (callback: (user: AuthUser | null) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  const handleAuthChange = async (event: string, session: any) => {
    console.log('Auth state change:', event, !!session);
    
    // Clear any pending timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // Debounce rapid auth state changes
    timeoutId = setTimeout(async () => {
      try {
        if (session?.user) {
          const authUser: AuthUser = {
            id: session.user.id,
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            image: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
            role: session.user.user_metadata?.role || 'user'
          };
          
          // Cache the session
          if (typeof window !== 'undefined') {
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
              user: authUser,
              timestamp: Date.now()
            }));
          }
          
          callback(authUser);
        } else {
          // Clear cached session
          if (typeof window !== 'undefined') {
            localStorage.removeItem(SESSION_STORAGE_KEY);
          }
          callback(null);
        }
      } catch (error) {
        console.error('Error in auth state change handler:', error);
        callback(null);
      }
    }, 100); // 100ms debounce
  };
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);
  
  return {
    data: { subscription: {
      ...subscription,
      unsubscribe: () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        subscription.unsubscribe();
      }
    }}
  };
};

// Utility to check if we're in the middle of an OAuth flow
export const isOAuthCallback = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const hash = window.location.hash;
  const search = window.location.search;
  
  return (
    hash.includes('access_token') ||
    search.includes('code=') ||
    search.includes('error=')
  );
};

// Utility to handle OAuth callback manually
export const handleOAuthCallback = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  
  const hash = window.location.hash;
  
  if (hash && hash.includes('access_token')) {
    try {
      console.log('Processing OAuth callback...');
      
      // Extract tokens from URL fragment
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      
      if (accessToken) {
        // Set the session using the tokens from URL
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        });
        
        if (error) {
          console.error('Error setting session:', error);
          throw error;
        }
        
        if (data.user) {
          console.log('OAuth callback processed successfully');
          
          // Clear the URL hash
          window.history.replaceState({}, document.title, window.location.pathname);
          
          return true;
        }
      }
    } catch (error) {
      console.error('Error processing OAuth callback:', error);
      throw error;
    }
  }
  
  return false;
};