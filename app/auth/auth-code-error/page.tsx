"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import Iridescence from "@/components/ui/Iridescence";

export default function AuthCodeErrorPage() {
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
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="font-cormorant text-2xl font-light text-gray-800">
              Lỗi xác thực
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6 text-center">
            <div>
              <p className="text-muted-foreground mb-4">
                Có lỗi xảy ra trong quá trình xác thực với Google. Điều này có thể do:
              </p>
              <ul className="text-sm text-muted-foreground text-left space-y-2 mb-6">
                <li>• Bạn đã hủy quá trình đăng nhập</li>
                <li>• Kết nối mạng không ổn định</li>
                <li>• Cấu hình OAuth chưa đúng</li>
                <li>• Phiên đăng nhập đã hết hạn</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Link href="/login" className="block">
                <Button className="w-full bg-[#93E1D8] hover:bg-[#93E1D8]/90 text-white">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Thử đăng nhập lại
                </Button>
              </Link>
              
              <Link href="/" className="block">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Về trang chủ
                </Button>
              </Link>
            </div>

            <div className="mt-8 p-4 bg-gray-50/80 rounded-xl">
              <p className="text-xs text-gray-600">
                Nếu vấn đề vẫn tiếp tục, vui lòng liên hệ với chúng tôi để được hỗ trợ.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}