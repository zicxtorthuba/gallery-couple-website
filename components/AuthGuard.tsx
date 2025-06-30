"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    setIsAuth(isAuthenticated());
  }, []);

  if (isAuth === null) {
    // Loading state
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#93E1D8]"></div>
      </div>
    );
  }

  if (!isAuth) {
    return fallback || (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center p-8">
            <div className="w-16 h-16 bg-[#93E1D8]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="h-8 w-8 text-[#93E1D8]" />
            </div>
            <h2 className="font-cormorant text-2xl font-light mb-4">
              Yêu cầu đăng nhập
            </h2>
            <p className="text-muted-foreground mb-6">
              Bạn cần đăng nhập để truy cập trang này
            </p>
            <Link href="/login">
              <Button className="bg-[#93E1D8] hover:bg-[#93E1D8]/90 text-white px-6 py-3 rounded-full">
                Đăng nhập ngay
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}