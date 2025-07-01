"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Chrome, Shield, Lock, Loader2, CheckCircle, AlertTriangle, RefreshCw, Wifi, WifiOff, Globe } from "lucide-react";
import Iridescence from "@/components/ui/Iridescence";
import { 
  signInWithGoogle, 
  getCurrentUser, 
  onAuthStateChange, 
  isOAuthCallback, 
  handleOAuthCallback 
} from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected' | 'slow'>('checking');
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setMounted(true);
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      console.log('Initializing authentication...');
      
      // Check connection first
      await checkConnection();
      
      // Handle OAuth callback if present
      if (isOAuthCallback()) {
        console.log('OAuth callback detected');
        setIsLoading(true);
        
        try {
          const success = await handleOAuthCallback();
          if (success) {
            setShowSuccess(true);
            setTimeout(() => {
              router.push('/');
            }, 2000);
            return;
          }
        } catch (error: any) {
          console.error('OAuth callback error:', error);
          setError('Lỗi xử lý đăng nhập từ Google. Vui lòng thử lại.');
          setDebugInfo(`Chi tiết: ${error.message}`);
        } finally {
          setIsLoading(false);
        }
      }
      
      // Check for URL error parameters
      const errorParam = searchParams.get('error');
      const errorMessage = searchParams.get('message');
      
      if (errorParam) {
        handleUrlError(errorParam, errorMessage);
        return;
      }
      
      // Check if user is already authenticated
      const user = await getCurrentUser();
      if (user) {
        console.log('User already authenticated:', user.email);
        setShowSuccess(true);
        setTimeout(() => {
          router.push('/');
        }, 1500);
        return;
      }
      
      // Set up auth state listener
      const { data: { subscription } } = onAuthStateChange((user) => {
        if (user && !showSuccess) {
          console.log('User authenticated via state change:', user.email);
          setShowSuccess(true);
          setTimeout(() => {
            router.push('/');
          }, 2000);
        }
      });
      
      // Cleanup function
      return () => {
        subscription?.unsubscribe();
      };
      
    } catch (error: any) {
      console.error('Auth initialization error:', error);
      if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
        setError('Lỗi kết nối mạng khi khởi tạo. Vui lòng thử lại.');
      }
    } finally {
      setAuthInitialized(true);
    }
  };

  const checkConnection = async () => {
    try {
      setConnectionStatus('checking');
      
      // Test basic internet connectivity
      const startTime = Date.now();
      await Promise.race([
        fetch('https://www.google.com/favicon.ico', { 
          method: 'HEAD',
          cache: 'no-cache',
          mode: 'no-cors'
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 8000)
        )
      ]);
      
      const responseTime = Date.now() - startTime;
      
      // Test Supabase connectivity
      try {
        const { error } = await supabase.from('blog_posts').select('id').limit(1);
        setSupabaseConnected(!error);
      } catch (supabaseError) {
        setSupabaseConnected(false);
        console.warn('Supabase connection test failed:', supabaseError);
      }
      
      setIsOnline(true);
      setConnectionStatus(responseTime > 4000 ? 'slow' : 'connected');
      
    } catch (error) {
      console.warn('Connection check failed:', error);
      setIsOnline(false);
      setConnectionStatus('disconnected');
      setSupabaseConnected(false);
    }
  };

  const handleUrlError = (errorParam: string, errorMessage: string | null) => {
    let errorText = '';
    switch (errorParam) {
      case 'auth_callback_error':
        errorText = 'Lỗi xử lý callback từ Google. Vui lòng thử lại.';
        break;
      case 'auth_error':
        errorText = 'Lỗi xác thực. Vui lòng thử lại.';
        break;
      case 'no_code':
        errorText = 'Không nhận được mã xác thực từ Google. Vui lòng thử lại.';
        break;
      case 'no_session':
        errorText = 'Không thể tạo phiên đăng nhập. Vui lòng thử lại.';
        break;
      case 'user_cancelled':
        errorText = 'Bạn đã hủy quá trình đăng nhập.';
        break;
      case 'oauth_error':
        errorText = 'Lỗi OAuth từ Google.';
        break;
      case 'callback_exception':
        errorText = 'Lỗi xử lý callback.';
        break;
      default:
        errorText = 'Có lỗi xảy ra. Vui lòng thử lại.';
    }
    
    if (errorMessage) {
      setDebugInfo(`Chi tiết: ${decodeURIComponent(errorMessage)}`);
    }
    
    setError(errorText);
    
    // Clear error from URL
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('error');
    newUrl.searchParams.delete('message');
    window.history.replaceState({}, '', newUrl.toString());
  };

  const handleGoogleSignIn = async () => {
    if (!isOnline) {
      setError('Không có kết nối internet. Vui lòng kiểm tra kết nối và thử lại.');
      return;
    }

    if (supabaseConnected === false) {
      setError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setDebugInfo('');
      
      console.log('Starting Google sign in...');
      
      // Add a small delay to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await signInWithGoogle();
      
      console.log('Google OAuth initiated, waiting for redirect...');
      
      // The OAuth flow will handle the redirect automatically
      // We don't need to do anything else here
      
    } catch (error: any) {
      console.error('Sign in error:', error);
      setError(error.message || 'Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại.');
      setDebugInfo(`Lỗi: ${error.message || 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
    setDebugInfo('');
  };

  const handleRetry = () => {
    setError(null);
    setDebugInfo('');
    setIsLoading(false);
    
    // Clear any tokens from URL
    if (window.location.hash) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Reinitialize auth
    initializeAuth();
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'slow':
        return <Wifi className="h-4 w-4 text-yellow-500" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      case 'checking':
        return <Globe className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Wifi className="h-4 w-4 text-gray-500" />;
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Kết nối tốt';
      case 'slow':
        return 'Kết nối chậm';
      case 'disconnected':
        return 'Không có kết nối';
      case 'checking':
        return 'Đang kiểm tra kết nối...';
      default:
        return 'Không xác định';
    }
  };

  const canSignIn = isOnline && connectionStatus !== 'disconnected' && supabaseConnected !== false && authInitialized;

  // Show loading while initializing
  if (!mounted || !authInitialized) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Iridescence
            color={[1, 1, 1]}
            mouseReact={false}
            amplitude={0.1}
            speed={1.0}
          />
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md backdrop-blur-sm bg-white/90 shadow-2xl border-0">
            <CardContent className="text-center p-8">
              <div className="w-16 h-16 bg-[#93E1D8]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#93E1D8]"></div>
              </div>
              <h2 className="font-cormorant text-2xl font-light text-gray-800 mb-2">
                Đang khởi tạo...
              </h2>
              <p className="text-muted-foreground">
                Vui lòng chờ trong giây lát
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Iridescence
            color={[1, 1, 1]}
            mouseReact={false}
            amplitude={0.1}
            speed={1.0}
          />
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md backdrop-blur-sm bg-white/90 shadow-2xl border-0">
            <CardContent className="text-center p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="font-cormorant text-2xl font-light text-gray-800 mb-2">
                Đăng nhập thành công!
              </h2>
              <p className="text-muted-foreground mb-4">
                Đang chuyển hướng về trang chủ...
              </p>
              <div className="mt-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#93E1D8] mx-auto"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Iridescence Background */}
      <div className="absolute inset-0 z-0">
        <Iridescence
          color={[1, 1, 1]}
          mouseReact={false}
          amplitude={0.1}
          speed={1.0}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md backdrop-blur-sm bg-white/90 shadow-2xl border-0">
          <CardHeader className="text-center pb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#93E1D8] to-[#FFA69E] rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="font-cormorant text-3xl font-light text-gray-800">
              Đăng nhập
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Đăng nhập để truy cập đầy đủ tính năng
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Connection Status */}
            <Alert className={`${
              connectionStatus === 'disconnected' 
                ? 'border-red-200 bg-red-50' 
                : connectionStatus === 'slow'
                  ? 'border-yellow-200 bg-yellow-50'
                  : connectionStatus === 'connected'
                    ? 'border-green-200 bg-green-50'
                    : 'border-blue-200 bg-blue-50'
            }`}>
              {getConnectionStatusIcon()}
              <AlertDescription className={`${
                connectionStatus === 'disconnected' 
                  ? 'text-red-700' 
                  : connectionStatus === 'slow'
                    ? 'text-yellow-700'
                    : connectionStatus === 'connected'
                      ? 'text-green-700'
                      : 'text-blue-700'
              }`}>
                <div className="flex items-center justify-between">
                  <span>{getConnectionStatusText()}</span>
                  {supabaseConnected !== null && (
                    <span className="text-xs">
                      Server: {supabaseConnected ? '✓' : '✗'}
                    </span>
                  )}
                </div>
              </AlertDescription>
            </Alert>

            {/* Error Alert */}
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-700">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{error}</p>
                      {debugInfo && (
                        <p className="text-xs mt-1 opacity-75">{debugInfo}</p>
                      )}
                      <div className="mt-2 space-y-1 text-xs">
                        <p><strong>Khắc phục:</strong></p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Đảm bảo kết nối internet ổn định</li>
                          <li>Thử tải lại trang</li>
                          <li>Kiểm tra cấu hình Google OAuth</li>
                          <li>Thử xóa cache và cookies của trình duyệt</li>
                        </ul>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearError}
                      className="text-red-500 hover:text-red-700 p-1 h-auto"
                    >
                      ×
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Google Login */}
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading || !canSignIn}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-medium py-4 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md h-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 mr-3 animate-spin" />
              ) : !isOnline ? (
                <WifiOff className="h-5 w-5 mr-3 text-red-500" />
              ) : (
                <Chrome className="h-5 w-5 mr-3 text-blue-500" />
              )}
              {isLoading 
                ? 'Đang đăng nhập...' 
                : !canSignIn 
                  ? 'Không có kết nối' 
                  : 'Đăng nhập với Google'
              }
            </Button>

            {/* Retry Button */}
            {(error || !canSignIn) && (
              <Button
                onClick={handleRetry}
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Thử lại
              </Button>
            )}

            {/* Debug Info */}
            {process.env.NODE_ENV === 'development' && mounted && (
              <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs">
                <p><strong>Debug Info:</strong></p>
                <p>URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
                <p>Origin: {typeof window !== 'undefined' ? window.location.origin : 'N/A'}</p>
                <p>Online: {isOnline ? 'Yes' : 'No'}</p>
                <p>Connection: {connectionStatus}</p>
                <p>Supabase: {supabaseConnected === null ? 'Unknown' : supabaseConnected ? 'Connected' : 'Disconnected'}</p>
                <p>Auth Initialized: {authInitialized ? 'Yes' : 'No'}</p>
                <p>OAuth Callback: {isOAuthCallback() ? 'Yes' : 'No'}</p>
                <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
                {typeof window !== 'undefined' && window.location.hash && (
                  <p>Hash: {window.location.hash.substring(0, 100)}...</p>
                )}
              </div>
            )}

            {/* Security Notice */}
            <div className="mt-8 p-4 bg-gray-50/80 rounded-xl">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-[#93E1D8] mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">
                    Bảo mật & Quyền riêng tư
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Chúng tôi sử dụng Supabase Auth với Google OAuth để đảm bảo tài khoản của bạn được bảo mật.
                    Thông tin cá nhân sẽ được bảo vệ theo chính sách quyền riêng tư.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
          <p className="text-sm text-gray-600/80 text-center">
            © 2025 Zunhee. Powered by Supabase Auth
          </p>
        </div>
      </div>
    </div>
  );
}