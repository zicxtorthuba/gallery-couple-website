"use client";

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Heart, 
  Bookmark, 
  User, 
  Calendar, 
  Star,
  ImageIcon,
  BookOpen,
  Trash2,
  ExternalLink,
  Clock,
  Tag
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AuthGuard } from '@/components/AuthGuard';
import { getCurrentUser, type AuthUser } from '@/lib/auth';
import { getUserFavorites, removeFromFavorites, type UserFavorite } from '@/lib/favorites-supabase';
import { getGalleryImages, type GalleryImage } from '@/lib/gallery-supabase';
import { getBlogPosts, type BlogPost } from '@/lib/blog-supabase';
import { getUserStorageInfo, formatBytes, type StorageInfo } from '@/lib/storage';
import Image from 'next/image';
import Link from 'next/link';

function ProfileContent() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [favorites, setFavorites] = useState<UserFavorite[]>([]);
  const [favoriteGalleryItems, setFavoriteGalleryItems] = useState<GalleryImage[]>([]);
  const [favoriteBlogItems, setFavoriteBlogItems] = useState<BlogPost[]>([]);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Load user info
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      if (currentUser) {
        // Load favorites
        const userFavorites = await getUserFavorites();
        setFavorites(userFavorites);

        // Load storage info
        const storage = await getUserStorageInfo();
        setStorageInfo(storage);

        // Load favorite items details
        await loadFavoriteItems(userFavorites);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFavoriteItems = async (userFavorites: UserFavorite[]) => {
    try {
      // Get gallery favorites
      const galleryFavoriteIds = userFavorites
        .filter(fav => fav.itemType === 'gallery')
        .map(fav => fav.itemId);

      if (galleryFavoriteIds.length > 0) {
        const allGalleryImages = await getGalleryImages();
        const favoriteGallery = allGalleryImages.filter(img => 
          galleryFavoriteIds.includes(img.id)
        );
        setFavoriteGalleryItems(favoriteGallery);
      }

      // Get blog favorites
      const blogFavoriteIds = userFavorites
        .filter(fav => fav.itemType === 'blog')
        .map(fav => fav.itemId);

      if (blogFavoriteIds.length > 0) {
        const allBlogPosts = await getBlogPosts(false); // Only published posts
        const favoriteBlog = allBlogPosts.filter(post => 
          blogFavoriteIds.includes(post.id)
        );
        setFavoriteBlogItems(favoriteBlog);
      }
    } catch (error) {
      console.error('Error loading favorite items:', error);
    }
  };

  const handleRemoveFavorite = async (itemType: 'gallery' | 'blog', itemId: string) => {
    try {
      const success = await removeFromFavorites(itemType, itemId);
      if (success) {
        // Update local state
        setFavorites(prev => prev.filter(fav => 
          !(fav.itemType === itemType && fav.itemId === itemId)
        ));

        if (itemType === 'gallery') {
          setFavoriteGalleryItems(prev => prev.filter(item => item.id !== itemId));
        } else {
          setFavoriteBlogItems(prev => prev.filter(item => item.id !== itemId));
        }
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const getStorageColor = (percentage: number): string => {
    if (percentage >= 90) return 'rgb(239, 68, 68)'; // red-500
    if (percentage >= 75) return 'rgb(245, 158, 11)'; // amber-500
    return 'rgb(34, 197, 94)'; // green-500
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="pt-20 pb-16 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#93E1D8]"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="pt-20 pb-16 text-center">
          <p className="text-muted-foreground">Không thể tải thông tin người dùng</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Profile Header */}
          <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.image} alt={user.name} />
                <AvatarFallback className="bg-[#93E1D8] text-white text-2xl">
                  {user.name[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h1 className="font-cormorant text-3xl font-light mb-2">{user.name}</h1>
                <p className="text-muted-foreground mb-4">{user.email}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-[#93E1D8]" />
                    <span className="text-sm">
                      <strong>{favorites.length}</strong> mục yêu thích
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-[#93E1D8]" />
                    <span className="text-sm">
                      <strong>{favoriteGalleryItems.length}</strong> ảnh yêu thích
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-[#93E1D8]" />
                    <span className="text-sm">
                      <strong>{favoriteBlogItems.length}</strong> blog đã lưu
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Tổng quan</TabsTrigger>
              <TabsTrigger value="gallery">Ảnh yêu thích</TabsTrigger>
              <TabsTrigger value="blog">Blog đã lưu</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Gallery Favorites */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      Ảnh yêu thích gần đây
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {favoriteGalleryItems.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {favoriteGalleryItems.slice(0, 4).map((image) => (
                          <Link key={image.id} href="/gallery" className="group">
                            <div className="relative aspect-square overflow-hidden rounded-lg">
                              <Image
                                src={image.url}
                                alt={image.title}
                                fill
                                sizes="(max-width: 768px) 50vw, 25vw"
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {image.title}
                            </p>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">Chưa có ảnh yêu thích nào</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Blog Favorites */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Blog đã lưu gần đây
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {favoriteBlogItems.length > 0 ? (
                      <div className="space-y-3">
                        {favoriteBlogItems.slice(0, 3).map((post) => (
                          <Link key={post.id} href={`/blog/${post.id}`} className="block group">
                            <div className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                              <h4 className="font-medium text-sm group-hover:text-[#93E1D8] line-clamp-1 break-words">
                                {post.title}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {post.excerpt}
                              </p>
                              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(post.publishedAt).toLocaleDateString('vi-VN')}</span>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">Chưa có blog đã lưu nào</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="gallery">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Ảnh yêu thích ({favoriteGalleryItems.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {favoriteGalleryItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {favoriteGalleryItems.map((image) => (
                        <div key={image.id} className="group">
                          <div className="relative aspect-square overflow-hidden rounded-xl mb-3">
                            <Image
                              src={image.url}
                              alt={image.title}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-2 right-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRemoveFavorite('gallery', image.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <h3 className="font-medium text-sm line-clamp-1">{image.title}</h3>
                            {image.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {image.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <User className="h-3 w-3" />
                                <span>@{image.author}</span>
                              </div>
                              <Link href="/gallery">
                                <Button size="sm" variant="outline" className="h-6 text-xs">
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Xem
                                </Button>
                              </Link>
                            </div>
                            {image.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {image.tags.slice(0, 2).map(tag => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {image.tags.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{image.tags.length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <Star className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-cormorant text-xl font-light mb-2">
                        Chưa có ảnh yêu thích nào
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        Hãy khám phá thư viện và đánh dấu những bức ảnh bạn yêu thích
                      </p>
                      <Link href="/gallery">
                        <Button className="bg-[#93E1D8] hover:bg-[#93E1D8]/90">
                          <ImageIcon className="h-4 w-4 mr-2" />
                          Khám phá thư viện
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="blog">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bookmark className="h-5 w-5" />
                    Blog đã lưu ({favoriteBlogItems.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {favoriteBlogItems.length > 0 ? (
                    <div className="space-y-6">
                      {favoriteBlogItems.map((post) => (
                        <div key={post.id} className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                          <div className="flex flex-col md:flex-row">
                            {post.featuredImage ? (
                              <div className="relative h-48 md:h-32 md:w-48 flex-shrink-0">
                                <Image
                                  src={post.featuredImage}
                                  alt={post.title}
                                  fill
                                  sizes="(max-width: 768px) 100vw, 200px"
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="h-48 md:h-32 md:w-48 bg-gradient-to-br from-[#93E1D8]/20 to-[#FFA69E]/20 flex items-center justify-center flex-shrink-0">
                                <BookOpen className="h-8 w-8 text-[#93E1D8]" />
                              </div>
                            )}
                            
                            <div className="p-6 flex-1">
                              <div className="flex items-start justify-between mb-3">
                                <h3 className="font-cormorant text-xl font-medium line-clamp-2 break-words">
                                  {post.title}
                                </h3>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRemoveFavorite('blog', post.id)}
                                  className="text-red-500 hover:bg-red-50 ml-4"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              
                              <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                                {post.excerpt}
                              </p>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    <span>{post.author}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{new Date(post.publishedAt).toLocaleDateString('vi-VN')}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{post.readTime} phút đọc</span>
                                  </div>
                                </div>
                                
                                <Link href={`/blog/${post.id}`}>
                                  <Button size="sm" variant="outline">
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    Đọc
                                  </Button>
                                </Link>
                              </div>
                              
                              {post.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-3">
                                  {post.tags.slice(0, 3).map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {post.tags.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{post.tags.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <Bookmark className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-cormorant text-xl font-light mb-2">
                        Chưa có blog đã lưu nào
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        Hãy khám phá các bài viết và lưu những bài bạn thích
                      </p>
                      <Link href="/blog">
                        <Button className="bg-[#93E1D8] hover:bg-[#93E1D8]/90">
                          <BookOpen className="h-4 w-4 mr-2" />
                          Khám phá blog
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <Navbar />
      <ProfileContent />
      <Footer />
    </AuthGuard>
  );
}