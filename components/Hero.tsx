"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

export function Hero() {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 w-full h-full">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          poster="/images/hero-video-poster.jpg"
        >
          <source src="https://res.cloudinary.com/du9fgslde/video/upload/v1752575522/sldp749u1durj1kbijdl.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {/* Video Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      {/* Overlay Content */}
      <div className="relative flex h-full flex-col items-center justify-center px-4 text-center">
        <h1 
          className={`font-cormorant text-4xl font-light sm:text-5xl md:text-6xl lg:text-7xl transition-all duration-1000 ease-out text-white ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          Lưu giữ những kỉ niệm
        </h1>
        <p 
          className={`mt-4 max-w-md text-lg text-white/90 md:text-xl transition-all duration-1000 delay-300 ease-out ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          Mỗi khoảnh khắc là một hành trình đặc biệt
        </p>
        <Link 
          href="/gallery" 
          className={`mt-8 transition-all duration-1000 delay-500 ease-out ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <Button className="bg-[#FFA69E] text-white hover:bg-[#FFA69E]/90 px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
            Khám phá thư viện
          </Button>
        </Link>
      </div>

      {/* Scroll Down Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="h-10 w-10 text-white opacity-70" />
      </div>
    </div>
  );
}