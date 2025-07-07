"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Images, FolderPlus, Eye } from 'lucide-react';
import { getAlbums, type Album } from '@/lib/albums-supabase';

export function AlbumPreview() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlbums();
  }, []);

  const loadAlbums = async () => {
    try {
      const publicAlbums = await getAlbums(false); // Only public albums
      setAlbums(publicAlbums.slice(0, 6)); // Show only 6 latest albums
    } catch (error) {
      console.error('Error loading album preview:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="album-preview" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-cormorant text-4xl md:text-5xl font-light mb-4">Album</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Khám phá các bộ sưu tập được tổ chức theo chủ đề, từ những khoảnh khắc đặc biệt đến những kỷ niệm đáng nhớ.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#93E1D8] mx-auto"></div>
          </div>
        ) : albums.length > 0 ? (
          <div className="space-y-12">
            {/* Albums Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {albums.map((album) => (
                <Link key={album.id} href={`/albums/${album.id}`} className="group">
                  <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100">
                    {/* Cover Image */}
                    <div className="relative h-48 overflow-hidden">
                      {album.coverImage ? (
                        <Image
                          src={album.coverImage}
                          alt={album.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="h-full bg-gradient-to-br from-[#93E1D8]/20 to-[#FFA69E]/20 flex items-center justify-center">
                          <Images className="h-12 w-12 text-[#93E1D8]" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-white font-medium text-lg line-clamp-1 drop-shadow-lg">
                          {album.name}
                        </h3>
                        <div className="flex items-center justify-between text-white/80 text-sm drop-shadow-lg">
                          <span>@{album.authorName}</span>
                          <span>{album.imageCount} ảnh</span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="font-cormorant text-xl font-medium group-hover:text-[#93E1D8] transition-colors line-clamp-1 mb-2">
                        {album.name}
                      </h3>
                      
                      {album.description && (
                        <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                          {album.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Images className="h-3 w-3" />
                          <span>{album.imageCount} ảnh</span>
                        </div>
                        <span>{new Date(album.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* View All Button */}
            <div className="text-center">
              <Link href="/albums">
                <Button variant="outline" className="border-[#93E1D8] text-[#93E1D8] hover:bg-[#93E1D8]/10 px-8 py-3 rounded-full">
                  <Eye className="h-4 w-4 mr-2" />
                  Xem tất cả album
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-[#93E1D8]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Images className="h-12 w-12 text-[#93E1D8]" />
              </div>
              <h3 className="font-cormorant text-2xl font-light mb-2">
                Chưa có album nào
              </h3>
              <p className="text-muted-foreground mb-6">
                Hãy bắt đầu bằng cách tạo album đầu tiên và tổ chức những bức ảnh đẹp nhất của bạn
              </p>
              <Link href="/gallery">
                <Button className="bg-[#93E1D8] hover:bg-[#93E1D8]/90 text-white px-6 py-3 rounded-full">
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Quản lý album
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}