"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Images, 
  Eye, 
  Calendar, 
  User,
  Lock,
  Globe,
  Filter,
  Grid3X3,
  List
} from 'lucide-react';
import { getAlbums, type Album } from '@/lib/albums-supabase';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { getCurrentUser } from '@/lib/auth';

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [filteredAlbums, setFilteredAlbums] = useState<Album[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'public' | 'private'>('all');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadAlbums();
    loadUser();
  }, []);

  useEffect(() => {
    filterAlbums();
  }, [albums, searchTerm, filterType]);

  const loadUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  };

  const loadAlbums = async () => {
    try {
      setLoading(true);
      // Get all public albums
      const publicAlbums = await getAlbums(false);
      setAlbums(publicAlbums);
    } catch (error) {
      console.error('Error loading albums:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAlbums = () => {
    let filtered = albums;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(album =>
        album.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        album.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        album.authorName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (filterType === 'public') {
      filtered = filtered.filter(album => album.isPublic);
    } else if (filterType === 'private') {
      filtered = filtered.filter(album => !album.isPublic && user && album.authorId === user.id);
    }

    setFilteredAlbums(filtered);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-20 pb-16 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#93E1D8]"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-cormorant text-4xl md:text-5xl font-light mb-4">
              Bộ sưu tập Album
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Khám phá các album ảnh được tổ chức theo chủ đề và khoảnh khắc đặc biệt
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col md:flex-row gap-4 flex-1">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm album..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filter Type */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#93E1D8] focus:border-transparent"
                >
                  <option value="all">Tất cả album</option>
                  <option value="public">Album công khai</option>
                  {user && <option value="private">Album riêng tư của tôi</option>}
                </select>
              </div>

              {/* View Mode */}
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Filter className="h-4 w-4" />
                <span>{filteredAlbums.length} album</span>
              </div>
            </div>
          </div>

          {/* Albums Grid/List */}
          {filteredAlbums.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredAlbums.map((album) => (
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
                        <div className="absolute top-4 right-4">
                          {album.isPublic ? (
                            <Badge className="bg-white/90 text-gray-700">
                              <Globe className="h-3 w-3 mr-1" />
                              Công khai
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-white/90 text-gray-700">
                              <Lock className="h-3 w-3 mr-1" />
                              Riêng tư
                            </Badge>
                          )}
                        </div>
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
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{album.authorName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Images className="h-3 w-3" />
                              <span>{album.imageCount} ảnh</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(album.createdAt).toLocaleDateString('vi-VN')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAlbums.map((album) => (
                  <Link key={album.id} href={`/albums/${album.id}`} className="block group">
                    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 p-6">
                      <div className="flex gap-6">
                        {/* Cover Image */}
                        <div className="relative w-24 h-24 overflow-hidden rounded-lg flex-shrink-0">
                          {album.coverImage ? (
                            <Image
                              src={album.coverImage}
                              alt={album.name}
                              fill
                              sizes="96px"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="h-full bg-gradient-to-br from-[#93E1D8]/20 to-[#FFA69E]/20 flex items-center justify-center">
                              <Images className="h-6 w-6 text-[#93E1D8]" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-cormorant text-xl font-medium group-hover:text-[#93E1D8] transition-colors">
                              {album.name}
                            </h3>
                            <Badge variant={album.isPublic ? "default" : "secondary"}>
                              {album.isPublic ? (
                                <>
                                  <Globe className="h-3 w-3 mr-1" />
                                  Công khai
                                </>
                              ) : (
                                <>
                                  <Lock className="h-3 w-3 mr-1" />
                                  Riêng tư
                                </>
                              )}
                            </Badge>
                          </div>
                          
                          {album.description && (
                            <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                              {album.description}
                            </p>
                          )}

                          <div className="flex items-center gap-6 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{album.authorName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Images className="h-3 w-3" />
                              <span>{album.imageCount} ảnh</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(album.createdAt).toLocaleDateString('vi-VN')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )
          ) : (
            /* Empty State */
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-[#93E1D8]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Images className="h-12 w-12 text-[#93E1D8]" />
                </div>
                <h3 className="font-cormorant text-2xl font-light mb-2">
                  {searchTerm || filterType !== 'all'
                    ? 'Không tìm thấy album nào'
                    : 'Chưa có album nào'
                  }
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm || filterType !== 'all'
                    ? 'Thử thay đổi bộ lọc để tìm thấy album bạn cần'
                    : 'Hãy bắt đầu tạo album đầu tiên để tổ chức ảnh của bạn'
                  }
                </p>
                {!searchTerm && filterType === 'all' && (
                  <Link href="/gallery">
                    <Button className="bg-[#93E1D8] hover:bg-[#93E1D8]/90 text-white px-6 py-3 rounded-full">
                      <Images className="h-4 w-4 mr-2" />
                      Quản lý album
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}