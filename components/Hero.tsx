"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { WavyBackground } from "@/components/ui/wavy-background";

export function Hero() {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden" style={{ backgroundColor: '#FFA69E' }}>
      <WavyBackground 
        className="h-screen"
        containerClassName="h-screen"
        colors={["#93E1D8", "#FFA69E", "#B8E6B8", "#FFD93D", "#6BCF7F"]}
        waveWidth={30}
        backgroundFill="#FFA69E"
        blur={8}
        speed="slow"
        waveOpacity={0.3}
      >
        {/* Overlay Content */}
        <div className="relative flex h-full flex-col items-center justify-center px-4 text-center bg-black/5">
          <h1 
            className={`font-cormorant text-4xl font-light sm:text-5xl md:text-6xl lg:text-7xl transition-all duration-1000 ease-out text-white drop-shadow-lg ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            Lưu giữ những kỉ niệm
          </h1>
          <p 
            className={`mt-4 max-w-md text-lg text-white/90 md:text-xl transition-all duration-1000 delay-300 ease-out drop-shadow ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            Mỗi khoảng khắc là một hành trình đặc biệt
          </p>
          <Link 
            href="/gallery" 
            className={`mt-8 transition-all duration-1000 delay-500 ease-out ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            <Button className="bg-white text-[#FFA69E] hover:bg-white/90 px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 font-medium">
              Khám phá thư viện
            </Button>
          </Link>
        </div>

        {/* Scroll Down Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-10 w-10 text-white/70 drop-shadow" />
        </div>
      </WavyBackground>
    </div>
  );
}