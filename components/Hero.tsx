"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronDown, Camera, Heart, Sparkles } from "lucide-react";
import { WavyBackground } from "@/components/ui/wavy-background";

export function Hero() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentText, setCurrentText] = useState(0);
  
  const heroTexts = [
    "Lưu giữ những kỉ niệm",
    "Chia sẻ khoảnh khắc đẹp",
    "Tạo nên câu chuyện riêng"
  ];
  
  useEffect(() => {
    setIsVisible(true);
    
    // Rotate hero text every 4 seconds
    const interval = setInterval(() => {
      setCurrentText((prev) => (prev + 1) % heroTexts.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);

  const scrollToGallery = () => {
    const gallerySection = document.getElementById('gallery-preview');
    if (gallerySection) {
      gallerySection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <WavyBackground 
        className="h-screen"
        containerClassName="h-screen"
        colors={["#93E1D8", "#FFA69E", "#B8E6B8", "#FFD93D", "#6BCF7F"]}
        waveWidth={30}
        backgroundFill="#ffffff"
        blur={8}
        speed="slow"
        waveOpacity={0.3}
      >
        {/* Overlay Content */}
        <div className="relative flex h-full flex-col items-center justify-center px-4 text-center">
          {/* Animated Icons */}
          <div className="absolute top-1/4 left-1/4 animate-bounce delay-1000">
            <Camera className="h-8 w-8 text-[#93E1D8] opacity-60" />
          </div>
          <div className="absolute top-1/3 right-1/4 animate-bounce delay-2000">
            <Heart className="h-6 w-6 text-[#FFA69E] opacity-60" />
          </div>
          <div className="absolute bottom-1/3 left-1/3 animate-bounce delay-3000">
            <Sparkles className="h-7 w-7 text-[#B8E6B8] opacity-60" />
          </div>

          {/* Main Content */}
          <div className="max-w-4xl mx-auto">
            <h1 
              className={`font-cormorant text-4xl font-light sm:text-5xl md:text-6xl lg:text-7xl transition-all duration-1000 ease-out text-gray-800 mb-4 ${
                isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
              }`}
            >
              <span className="block transition-all duration-500 ease-in-out">
                {heroTexts[currentText]}
              </span>
            </h1>
            
            <p 
              className={`mt-6 max-w-2xl mx-auto text-lg text-gray-600 md:text-xl transition-all duration-1000 delay-300 ease-out leading-relaxed ${
                isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
              }`}
            >
              Mỗi khoảnh khắc là một hành trình đặc biệt. Hãy cùng chúng tôi lưu giữ và chia sẻ những 
              kỷ niệm đẹp nhất trong cuộc sống của bạn.
            </p>
            
            <div 
              className={`mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center transition-all duration-1000 delay-500 ease-out ${
                isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
              }`}
            >
              <Link href="/gallery">
                <Button className="bg-[#FFA69E] text-white hover:bg-[#FFA69E]/90 px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 btn-hover">
                  <Camera className="h-5 w-5 mr-2" />
                  Khám phá thư viện
                </Button>
              </Link>
              
              <Link href="/blog">
                <Button 
                  variant="outline" 
                  className="border-2 border-[#93E1D8] text-[#93E1D8] hover:bg-[#93E1D8] hover:text-white px-8 py-6 text-lg rounded-full transition-all duration-300 btn-hover"
                >
                  <Heart className="h-5 w-5 mr-2" />
                  Đọc câu chuyện
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div 
              className={`mt-16 grid grid-cols-3 gap-8 max-w-md mx-auto transition-all duration-1000 delay-700 ease-out ${
                isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
              }`}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-[#93E1D8]">1000+</div>
                <div className="text-sm text-gray-600">Khoảnh khắc</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#FFA69E]">500+</div>
                <div className="text-sm text-gray-600">Câu chuyện</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#B8E6B8]">100+</div>
                <div className="text-sm text-gray-600">Người dùng</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Down Indicator */}
        <button
          onClick={scrollToGallery}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer group"
          aria-label="Cuộn xuống để xem thêm"
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm text-gray-600 opacity-70 group-hover:opacity-100 transition-opacity">
              Khám phá thêm
            </span>
            <ChevronDown className="h-8 w-8 text-gray-600 opacity-70 group-hover:opacity-100 transition-opacity" />
          </div>
        </button>
      </WavyBackground>
    </div>
  );
}