"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Chrome, Shield, Lock, CheckCircle } from "lucide-react";
import Iridescence from "@/components/ui/Iridescence";

// Mock user data
const mockUsers = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@gmail.com",
    image: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1",
    role: "user"
  },
  {
    id: "2", 
    name: "Jane Smith",
    email: "jane.smith@gmail.com",
    image: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1",
    role: "user"
  },
  {
    id: "3",
    name: "Admin User",
    email: "admin@zunhee.com",
    image: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1",
    role: "admin"
  }
];

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedUser, setSelectedUser] = useState<typeof mockUsers[0] | null>(null);
  const router = useRouter();

  const handleMockLogin = async (user: typeof mockUsers[0]) => {
    setIsLoading(true);
    setSelectedUser(user);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Store user in localStorage (mock session)
    localStorage.setItem('user', JSON.stringify(user));
    
    // Show success message
    setShowSuccess(true);
    setIsLoading(false);

    // Redirect after showing success
    setTimeout(() => {
      router.push('/');
    }, 2000);
  };

  if (showSuccess && selectedUser) {
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

        {/* Success Content */}
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
                Chào mừng {selectedUser.name}
              </p>
              <p className="text-sm text-muted-foreground">
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
              Chọn tài khoản để đăng nhập (Demo)
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {mockUsers.map((user) => (
              <Button
                key={user.id}
                onClick={() => handleMockLogin(user)}
                disabled={isLoading}
                className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-medium py-4 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md justify-start h-auto"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                    <img 
                      src={user.image} 
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                  {user.role === 'admin' && (
                    <div className="text-xs bg-[#93E1D8] text-white px-2 py-1 rounded">
                      Admin
                    </div>
                  )}
                  {isLoading && selectedUser?.id === user.id && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#93E1D8]"></div>
                  )}
                </div>
              </Button>
            ))}

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">hoặc</span>
              </div>
            </div>

            {/* Google Login (Disabled for demo) */}
            <Button
              disabled
              className="w-full bg-gray-100 text-gray-400 border border-gray-200 font-medium py-3 rounded-xl cursor-not-allowed"
            >
              <Chrome className="h-5 w-5 mr-3 text-gray-400" />
              Đăng nhập với Google (Chưa khả dụng)
            </Button>

            {/* Security Notice */}
            <div className="mt-8 p-4 bg-gray-50/80 rounded-xl">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-[#93E1D8] mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">
                    Demo Mode
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Đây là phiên bản demo. Chọn một trong các tài khoản mẫu để trải nghiệm hệ thống.
                    Dữ liệu sẽ được lưu tạm thời trong trình duyệt.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
          <p className="text-sm text-gray-600/80 text-center">
            © 2025 Zunhee. Demo Version.
          </p>
        </div>
      </div>
    </div>
  );
}