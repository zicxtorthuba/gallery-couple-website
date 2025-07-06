"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ImageIcon, Upload } from 'lucide-react';
import { getGalleryImages, type GalleryImage } from '@/lib/gallery-supabase';

export function GalleryPreview() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      const galleryImages = await getGalleryImages();
      setImages(galleryImages.slice(0, 6)); // Show only 6 latest images
    } catch (error) {
      console.error('Error loading gallery preview:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="gallery-preview" className="py-24" style={{ backgroundColor: '#FFA69E' }}>
      <div className="container mx-auto px-4">
        <div className="content-container rounded-3xl p-8 shadow-lg">
        <div className="text-center mb-16">
          <h2 className="font-cormorant text-4xl md:text-5xl font-light mb-4 text-gray-800">Bộ sưu tập</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Bộ sưu tập theo chủ đề, từ những khoảnh khắc hấp dẫn đến những kỷ niệm đáng nhớ.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#93E1D8] mx-auto"></div>
          </div>
        ) : images.length > 0 ? (
          <div className="space-y-12">
            {/* Gallery Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((image) => (
                <Link key={image.id} href="/gallery" className="group">
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100">
                    <Image
                      src={image.url}
                      alt={image.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white font-medium text-sm line-clamp-1 drop-shadow-lg">
                        {image.title}
                      </h3>
                      <p className="text-white/80 text-xs drop-shadow-lg">
                        @{image.author}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* View All Button */}
            <div className="text-center">
              <Link href="/gallery">
                <Button variant="outline" className="border-[#93E1D8] text-[#93E1D8] hover:bg-[#93E1D8] hover:text-white px-8 py-3 rounded-full transition-all duration-300">
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
      </div>
    </section>
  );
}