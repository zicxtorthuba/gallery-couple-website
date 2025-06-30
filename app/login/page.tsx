"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Lock, User, AlertCircle, CheckCircle } from "lucide-react";

// Valid login combinations
const VALID_COMBINATIONS = [
  { code: "1234", name: "User", role: "user" },
  { code: "5678", name: "User", role: "user" },
  { code: "9999", name: "Admin", role: "admin"}
];

export default function LoginPage() {
  const [otp, setOtp] = useState(Array(4).fill(""));
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      !/^[0-9]{1}$/.test(e.key) &&
      e.key !== "Backspace" &&
      e.key !== "Delete" &&
      e.key !== "Tab" &&
      !e.metaKey
    ) {
      e.preventDefault();
    }

    if (e.key === "Delete" || e.key === "Backspace") {
      const index = inputRefs.current.indexOf(e.target as HTMLInputElement);
      if (index > 0) {
        setOtp((prevOtp) => [
          ...prevOtp.slice(0, index - 1),
          "",
          ...prevOtp.slice(index),
        ]);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { target } = e;
    const index = inputRefs.current.indexOf(target);
    if (target.value) {
      setOtp((prevOtp) => [
        ...prevOtp.slice(0, index),
        target.value,
        ...prevOtp.slice(index + 1),
      ]);
      if (index < otp.length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
    setError("");
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text");
    if (!new RegExp(`^[0-9]{${otp.length}}$`).test(text)) {
      return;
    }
    const digits = text.split("");
    setOtp(digits);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    
    if (code.length !== 4) {
      setError("Vui lòng nhập đầy đủ 4 chữ số");
      return;
    }

    setIsLoading(true);
    setError("");

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const validUser = VALID_COMBINATIONS.find(combo => combo.code === code);
    
    if (validUser) {
      setSuccess(`Chào mừng ${validUser.name}!`);
      // Store user info in localStorage or context
      localStorage.setItem("user", JSON.stringify(validUser));
      
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } else {
      setError("Mã đăng nhập không đúng. Vui lòng thử lại.");
      setOtp(Array(4).fill(""));
      inputRefs.current[0]?.focus();
    }
    
    setIsLoading(false);
  };

  const handleClear = () => {
    setOtp(Array(4).fill(""));
    setError("");
    setSuccess("");
    inputRefs.current[0]?.focus();
  };

  // Auto-submit when all 4 digits are entered
  useEffect(() => {
    const code = otp.join("");
    if (code.length === 4 && !isLoading) {
      handleSubmit({ preventDefault: () => {} } as React.FormEvent);
    }
  }, [otp, isLoading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#93E1D8]/20 via-white to-[#FFA69E]/20 flex items-center justify-center p-4">
      {/* Background Video */}
      <div className="fixed inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full object-cover opacity-30"
        >
          <source 
            src="/videos/login-background.mp4" 
            type="video/mp4" 
          />
        </video>
        <div className="absolute inset-0 bg-white/60"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Card className="backdrop-blur-sm bg-white/90 shadow-2xl border-0">
          <CardHeader className="text-center pb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#93E1D8] to-[#FFA69E] rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="font-cormorant text-3xl font-light text-gray-800">
              Đăng nhập
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Nhập mã 4 chữ số để truy cập hệ thống
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* OTP Input */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Mã bảo mật
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCode(!showCode)}
                    className="text-[#93E1D8] hover:text-[#93E1D8]/80 p-0 h-auto"
                  >
                    {showCode ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                <div className="flex gap-3 justify-center">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      type={showCode ? "text" : "password"}
                      maxLength={1}
                      value={digit}
                      onChange={handleInput}
                      onKeyDown={handleKeyDown}
                      onFocus={handleFocus}
                      onPaste={handlePaste}
                      ref={(el) => (inputRefs.current[index] = el)}
                      className="w-14 h-14 text-center text-2xl font-semibold border-2 border-gray-200 rounded-xl focus:border-[#93E1D8] focus:ring-2 focus:ring-[#93E1D8]/20 outline-none transition-all duration-200 bg-white/80 backdrop-blur-sm"
                      disabled={isLoading}
                    />
                  ))}
                </div>
                
                <p className="text-xs text-center text-muted-foreground">
                  Nhập từng chữ số một cách riêng biệt
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Success Message */}
              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-700">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  type="submit"
                  disabled={isLoading || otp.join("").length !== 4}
                  className="w-full bg-gradient-to-r from-[#93E1D8] to-[#FFA69E] hover:from-[#93E1D8]/90 hover:to-[#FFA69E]/90 text-white font-medium py-3 rounded-xl transition-all duration-200 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Đang xác thực...
                    </div>
                  ) : (
                    "Đăng nhập"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClear}
                  disabled={isLoading}
                  className="w-full border-gray-200 hover:bg-gray-50 py-3 rounded-xl"
                >
                  Xóa và nhập lại
                </Button>
              </div>
            </form>

            {/* Demo Info */}
            <div className="mt-8 p-4 bg-gray-50/80 rounded-xl">
              <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-2">
                <User className="h-4 w-4" />
                Tài khoản demo
              </h4>
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Admin:</span>
                  <code className="bg-white px-2 py-1 rounded font-mono">1234</code>
                </div>
                <div className="flex justify-between">
                  <span>User:</span>
                  <code className="bg-white px-2 py-1 rounded font-mono">5678</code>
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