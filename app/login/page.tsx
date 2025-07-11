"use client";

// Next.js static export fails when using useSearchParams without suspense.
// Force dynamic rendering for this page.
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Chrome, Shield, Lock, Loader2, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";
import Iridescence from "@/components/ui/Iridescence";
import { signInWithGoogle, getCurrentUser, onAuthStateChange } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Handle OAuth callback with tokens in URL fragment
    const handleOAuthCallback = async () => {
      const hash = window.location.hash;
      
      if (hash && hash.includes('access_token')) {
        setIsLoading(true);
        
        try {
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
              setError('Lỗi xử lý phiên đăng nhập. Vui lòng thử lại.');
            } else if (data.user) {
              // Clear the URL hash
              window.history.replaceState({}, document.title, window.location.pathname);
              
              setShowSuccess(true);
              setTimeout(() => {
                router.push('/');
              }, 2000);
            } else {
              setError('Không thể tạo phiên đăng nhập. Vui lòng thử lại.');
            }
          } else {
            setError('Không nhận được token từ Google. Vui lòng thử lại.');
          }
        } catch (error: any) {
          setError('Lỗi xử lý callback từ Google. Vui lòng thử lại.');
        } finally {
          setIsLoading(false);
        }
        
        return true;
      }
      
      return false;
    };

    // Check for error in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    
    if (errorParam) {
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
      
      setError(errorText);
      
      // Clear error from URL after showing it
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      newUrl.searchParams.delete('message');
      window.history.replaceState({}, '', newUrl.toString());
      return;
    }

    // Handle OAuth callback first
    const handledCallback = handleOAuthCallback();
    
    if (!handledCallback) {
      // Check if user is already authenticated
      const checkAuth = async () => {
        try {
          const user = await getCurrentUser();
          if (user) {
            setShowSuccess(true);
            setTimeout(() => {
              router.push('/');
            }, 2000);
          }
        } catch (error: any) {
          // Silently handle auth check errors
        }
      };
      
      checkAuth();
    }

    // Listen for auth state changes
    const { data: { subscription } } = onAuthStateChange((user) => {
      if (user && !showSuccess) {
        setShowSuccess(true);
        setTimeout(() => {
          router.push('/');
        }, 2000);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [router, showSuccess]);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await signInWithGoogle();
      
    } catch (error: any) {
      setError(error.message || 'Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại.');
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const handleRetry = () => {
    setError(null);
    setIsLoading(false);
    
    // Clear any tokens from URL
    if (window.location.hash) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

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
            {/* Error Alert */}
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-700">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{error}</p>
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
              disabled={isLoading}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-medium py-4 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md h-auto"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 mr-3 animate-spin" />
              ) : (
                <Chrome className="h-5 w-5 mr-3 text-blue-500" />
              )}
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập với Google'}
            </Button>

            {/* Retry Button */}
            {error && (
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