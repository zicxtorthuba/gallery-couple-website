"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Settings, Heart } from "lucide-react";
import { getStoredUser, logout, type User as UserType } from "@/lib/auth";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    const checkAuth = () => {
      setUser(getStoredUser());
    };

    window.addEventListener("scroll", handleScroll);
    checkAuth();

    // Listen for storage changes (login/logout from other tabs)
    window.addEventListener("storage", checkAuth);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("storage", checkAuth);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out",
        isScrolled
          ? "bg-white/80 backdrop-blur-md py-3 shadow-sm"
          : "bg-transparent py-5"
      )}
    >
      <div className="container mx-auto flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-cormorant text-2xl font-semibold tracking-tight text-[#93E1D8]">
            Zunhee
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <NavLink href="/gallery">Thư viện</NavLink>
          <NavLink href="/blog">Blog</NavLink>
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    {user.image ? (
                      <AvatarImage src={user.image} alt={user.name} />
                    ) : (
                      <AvatarFallback className="bg-[#93E1D8] text-white">
                        {user.name[0].toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.name}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/personal" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Trang cá nhân</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/favorites" className="cursor-pointer">
                    <Heart className="mr-2 h-4 w-4" />
                    <span>Yêu thích</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Cài đặt</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button 
                variant="outline" 
                className="border-[#93E1D8] text-[#93E1D8] hover:bg-[#93E1D8]/10 rounded-full px-6"
              >
                <User className="h-4 w-4 mr-2" />
                Đăng nhập
              </Button>
            </Link>
          )}
          <MobileMenu user={user} onLogout={handleLogout} />
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="relative font-medium text-[#93E1D8] transition-colors hover:text-[#FFA69E] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-[#93E1D8] after:transition-all hover:after:w-full"
    >
      {children}
    </Link>
  );
}

function MobileMenu({ user, onLogout }: { user: UserType | null; onLogout: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {isOpen ? (
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <path
              d="M4 6H20M4 12H20M4 18H20"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm">
          <div className="container mx-auto p-4">
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                aria-label="Close menu"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18 6L6 18M6 6L18 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Button>
            </div>

            <div className="mt-20 flex flex-col items-center gap-10 text-2xl">
              <Link
                href="/gallery"
                onClick={() => setIsOpen(false)}
                className="font-cormorant transition-colors text-[#93E1D8] hover:text-[#FFA69E]"
              >
                Thư viện
              </Link>
              <Link
                href="/blog"
                onClick={() => setIsOpen(false)}
                className="font-cormorant transition-colors text-[#93E1D8] hover:text-[#FFA69E]"
              >
                Blog
              </Link>
              <Link
                href="/contact"
                onClick={() => setIsOpen(false)}
                className="font-cormorant transition-colors text-[#93E1D8] hover:text-[#FFA69E]"
              >
                Liên hệ
              </Link>
              
              {user ? (
                <>
                  <Link
                    href="/personal"
                    onClick={() => setIsOpen(false)}
                    className="font-cormorant transition-colors text-[#93E1D8] hover:text-[#FFA69E]"
                  >
                    Trang cá nhân
                  </Link>
                  <Button
                    onClick={() => {
                      onLogout();
                      setIsOpen(false);
                    }}
                    variant="outline"
                    className="border-[#93E1D8] text-[#93E1D8] hover:bg-[#93E1D8]/10 rounded-full px-6"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Đăng xuất
                  </Button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                >
                  <Button 
                    variant="outline" 
                    className="border-[#93E1D8] text-[#93E1D8] hover:bg-[#93E1D8]/10 rounded-full px-6"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Đăng nhập
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}