"use client";

import { useState } from 'react';
import { signIn, getProviders } from 'next-auth/react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Chrome, Shield, Lock, Loader2 } from "lucide-react";
import Iridescence from "@/components/ui/Iridescence";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signIn('google', { 
        callbackUrl: '/',
        redirect: true 
      });
    } catch (error) {
      console.error('Sign in error:', error);
      setIsLoading(false);
    }
  };

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

            {/* Security Notice */}
            <div className="mt-8 p-4 bg-gray-50/80 rounded-xl">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-[#93E1D8] mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">
                    Bảo mật & Quyền riêng tư
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Chúng tôi sử dụng Google OAuth để đảm bảo tài khoản của bạn được bảo mật.
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
            © 2025 Zunhee. Powered by NextAuth.js
          </p>
        </div>
      </div>
    </div>
  );
}