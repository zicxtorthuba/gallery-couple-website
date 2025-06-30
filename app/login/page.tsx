import { signIn } from "@/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail } from "lucide-react"
import Iridescence from "@/components/ui/Iridescence"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#93E1D8]/20 via-white to-[#FFA69E]/20 flex items-center justify-center p-4">
      {/* Iridescence Background */}
      <div className="fixed inset-0 z-0">
        <Iridescence
          color={[0.58, 0.88, 0.85]}
          mouseReact={false}
          amplitude={0.1}
          speed={1.0}
        />
        <div className="absolute inset-0 bg-white/60"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Card className="backdrop-blur-sm bg-white/90 shadow-2xl border-0">
          <CardHeader className="text-center pb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#93E1D8] to-[#FFA69E] rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="font-cormorant text-3xl font-light text-gray-800">
              Đăng nhập
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Sử dụng tài khoản Google để truy cập hệ thống
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Google Sign In Form */}
            <form
              action={async () => {
                "use server"
                await signIn("google")
              }}
            >
              <Button
                type="submit"
                className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-medium py-3 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Đăng nhập với Google
                </div>
              </Button>
            </form>

            {/* Security Notice */}
            <div className="mt-8 p-4 bg-blue-50/80 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Mail className="h-3 w-3 text-blue-600" />
                </div>
                <div className="text-xs text-blue-700">
                  <p className="font-medium mb-1">Bảo mật và riêng tư</p>
                  <p>Chúng tôi sử dụng Google OAuth để đảm bảo tài khoản của bạn được bảo vệ an toàn. Thông tin cá nhân sẽ được mã hóa và bảo mật.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            © 2025 Zunhee. Bảo mật và riêng tư.
          </p>
        </div>
      </div>
    </div>
  );
}