import { authenticate } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Chrome, Shield, Lock } from "lucide-react";
import Iridescence from "@/components/ui/Iridescence";

export default function LoginPage() {
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
              Sử dụng tài khoản Google để truy cập hệ thống
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <form
              action={async () => {
                "use server"
                await authenticate("google")
              }}
            >
              <Button
                type="submit"
                className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-medium py-3 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Chrome className="h-5 w-5 mr-3 text-blue-500" />
                Đăng nhập với Google
              </Button>
            </form>

            {/* Security Notice */}
            <div className="mt-8 p-4 bg-gray-50/80 rounded-xl">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-[#93E1D8] mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">
                    Bảo mật và riêng tư
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Chúng tôi sử dụng Google OAuth để đảm bảo tài khoản của bạn được bảo vệ an toàn. 
                    Thông tin cá nhân sẽ được mã hóa và bảo mật theo tiêu chuẩn quốc tế.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
          <p className="text-sm text-gray-600/80 text-center">
            © 2025 Zunhee. Bảo mật và riêng tư.
          </p>
        </div>
      </div>
    </div>
  );
}