"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ImageIcon, Upload, Eye, Heart } from 'lucide-react';

interface GalleryImage {
  id: string;
  url: string;
  title: string;
  category: string;
  tags: string[];
  likes: number;
  author: string;
  createdAt: string;
  description?: string;
}

export function GalleryPreview() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = () => {
    try {
      setLoading(true);
      // Load images from localStorage
      const stored = typeof window !== 'undefined' ? localStorage.getItem('galleryImages') : null;
      if (stored) {
        const parsed: GalleryImage[] = JSON.parse(stored);
        setImages(parsed.slice(0, 6)); // Show only 6 latest images
      } else {
        setImages([]);
      }
    } catch (error) {
      console.error('Error loading gallery images:', error);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="gallery-preview" className="py-24 bg-[#DDFFF7]/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-cormorant text-4xl md:text-5xl font-light mb-4">Bộ sưu tập</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Bộ sưu tập theo chủ đề, từ những khoảnh khắc hấp dẫn đến những kỷ niệm đáng nhớ.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#93E1D8]"></div>
          </div>
        ) : images.length > 0 ? (
          <div className="space-y-12">
            {/* Gallery Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((image) => (
                <Link key={image.id} href="/gallery" className="group">
                  <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                    <div className="relative aspect-square overflow-hidden">
                      <Image
                        src={image.url}
                        alt={image.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex gap-2">
                          <div className="bg-white/90 rounded-full p-2">
                            <Eye className="h-4 w-4 text-gray-700" />
                          </div>
                          <div className="bg-white/90 rounded-full p-2">
                            <Heart className="h-4 w-4 text-gray-700" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-medium text-sm mb-1 line-clamp-1 group-hover:text-[#93E1D8] transition-colors">
                        {image.title}
                      </h3>
                      {image.description && (
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {image.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>@{image.author}</span>
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          <span>{image.likes}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* View All Button */}
            <div className="text-center">
              <Link href="/gallery">
                <Button variant="outline" className="border-[#93E1D8] text-[#93E1D8] hover:bg-[#93E1D8]/10 px-8 py-3 rounded-full">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Xem tất cả ảnh
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-[#93E1D8]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <ImageIcon className="h-12 w-12 text-[#93E1D8]" />
              </div>
              <h3 className="font-cormorant text-2xl font-light mb-2">
                Chưa có bộ sưu tập nào
              </h3>
              <p className="text-muted-foreground mb-6">
                Hãy bắt đầu bằng cách tạo bộ sưu tập đầu tiên và tải lên những bức ảnh đẹp nhất của bạn
              </p>
              <Link href="/gallery">
                <Button className="bg-[#93E1D8] hover:bg-[#93E1D8]/90 text-white px-6 py-3 rounded-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Bắt đầu tạo bộ sưu tập
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}