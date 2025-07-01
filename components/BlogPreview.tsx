"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusIcon, BookOpenIcon, Calendar, Clock, User, FileText, Eye } from 'lucide-react';
import { getBlogPosts, BlogPost } from '@/lib/blog-supabase';

const iconMap: Record<string, any> = {
  FileText, Calendar, Clock, User, Eye, BookOpenIcon
};

export function BlogPreview() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const publishedPosts = await getBlogPosts(false); // Only published posts
      setPosts(publishedPosts.slice(0, 3)); // Show only 3 latest posts
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPostIcon = (iconName?: string) => {
    if (iconName && iconMap[iconName]) {
      return iconMap[iconName];
    }
    return FileText;
  };

  if (loading) {
    return (
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-cormorant text-4xl md:text-5xl font-light mb-4">Blog</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Lời khuyên, những bức thư và những câu chuyện tâm sự
            </p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#93E1D8]"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-cormorant text-4xl md:text-5xl font-light mb-4">Blog</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Lời khuyên, những bức thư và những câu chuyện tâm sự
          </p>
        </div>

        {posts.length > 0 ? (
          <div className="space-y-12">
            {/* Featured Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => {
                const IconComponent = getPostIcon(post.customIcon);
                return (
                  <Link key={post.id} href={`/blog/${post.id}`} className="group">
                    <article className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100">
                      {/* Featured Image or Icon */}
                      {post.featuredImage ? (
                        <div className="relative h-48 overflow-hidden">
                          <Image
                            src={post.featuredImage}
                            alt={post.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      ) : (
                        <div className="h-48 bg-gradient-to-br from-[#93E1D8]/20 to-[#FFA69E]/20 flex items-center justify-center">
                          <IconComponent className="h-12 w-12 text-[#93E1D8]" />
                        </div>
                      )}

                      <div className="p-6">
                        {/* Title with Icon */}
                        <div className="flex items-start gap-2 mb-3">
                          {post.customIcon && (
                            <IconComponent className="h-5 w-5 text-[#93E1D8] mt-1 flex-shrink-0" />
                          )}
                          <h3 className="font-cormorant text-xl font-medium group-hover:text-[#93E1D8] transition-colors line-clamp-2">
                            {post.title}
                          </h3>
                        </div>

                        {/* Excerpt */}
                        <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                          {post.excerpt}
                        </p>

                        {/* Tags */}
                        {post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {post.tags.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {post.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{post.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Meta */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{post.author}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(post.publishedAt).toLocaleDateString('vi-VN')}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{post.readTime} phút đọc</span>
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>

            {/* View All Button */}
            <div className="text-center">
              <Link href="/blog">
                <Button variant="outline" className="border-[#93E1D8] text-[#93E1D8] hover:bg-[#93E1D8]/10 px-8 py-3 rounded-full">
                  <BookOpenIcon className="h-4 w-4 mr-2" />
                  Xem tất cả bài viết
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-[#93E1D8]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpenIcon className="h-12 w-12 text-[#93E1D8]" />
              </div>
              <h3 className="font-cormorant text-2xl font-light mb-2">
                Chưa có bài viết nào
              </h3>
              <p className="text-muted-foreground mb-6">
                Hãy bắt đầu chia sẻ những câu chuyện và kinh nghiệm của bạn
              </p>
              <Link href="/blog">
                <Button className="bg-[#93E1D8] hover:bg-[#93E1D8]/90 text-white px-6 py-3 rounded-full">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Tạo bài viết đầu tiên
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}