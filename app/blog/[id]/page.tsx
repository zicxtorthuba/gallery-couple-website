"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  CalendarIcon, 
  ClockIcon, 
  HeartIcon, 
  MessageCircleIcon, 
  ShareIcon,
  BookmarkIcon,
  ArrowLeftIcon,
  FileText,
  Calendar,
  Clock,
  User,
  Tag,
  Eye,
  Palette
} from 'lucide-react';
import { BlogPost, getBlogPost, getBlogPosts, updateBlogLikes } from '@/lib/blog-supabase';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CommentSection } from '@/components/ui/comment-section';
import { addToFavorites, removeFromFavorites, isFavorite } from '@/lib/favorites-supabase';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const iconMap: Record<string, any> = {
  FileText, Calendar, Clock, User, Tag, Eye, Palette
};

const fontOptions = [
  { value: '', className: 'font-cormorant' },
  { value: 'dancing-script', className: 'font-dancing-script' },
  { value: 'playwrite-vn', className: 'font-playwrite-vn' },
  { value: 'my-soul', className: 'font-my-soul' },
  { value: 'edu-qld', className: 'font-edu-qld' },
  { value: 'amatic-sc', className: 'font-amatic-sc' },
  { value: 'vt323', className: 'font-vt323' },
  { value: 'pinyon-script', className: 'font-pinyon-script' }
];

const getFontClass = (fontValue?: string) => {
  const font = fontOptions.find(f => f.value === fontValue);
  return font ? font.className : 'font-cormorant';
};

export default function BlogPostPage() {
  const params = useParams();
  const postId = params.id as string;
  
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likes, setLikes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadPost();
    loadUser();
  }, [postId]);

  useEffect(() => {
    if (user && post) {
      checkIfSaved();
      checkIfLiked();
    }
  }, [user, post]);

  const loadUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  };

  const checkIfSaved = async () => {
    if (!user || !post) return;
    
    try {
      const saved = await isFavorite('blog', post.id);
      setIsSaved(saved);
    } catch (error) {
      console.error('Error checking save status:', error);
    }
  };
  
  const checkIfLiked = async () => {
    if (!user || !post) return;
    
    try {
      const { data, error } = await supabase
        .from('blog_likes')
        .select('*')
        .eq('user_id', user.id)
        .eq('post_id', post.id);
        
      // If data exists and has at least one record, the user has liked the post
      setIsLiked(Boolean(data && data.length > 0));
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const loadPost = async () => {
    try {
      setLoading(true);
      const foundPost = await getBlogPost(postId);
      
      if (foundPost && foundPost.status === 'published') {
        setPost(foundPost);
        setLikes(foundPost.likes);
        
        // Check if user has liked this post
        if (user) {
          const { data, error } = await supabase
            .from('blog_likes')
            .select('*')
            .eq('user_id', user.id)
            .eq('post_id', foundPost.id);
            
          setIsLiked(Boolean(data && data.length > 0));
        }
        
        // Get related posts (same tags, excluding current post)
        const allPosts = await getBlogPosts(false); // Only published posts
        const related = allPosts
          .filter(p => 
            p.id !== postId && 
            p.tags.some(tag => foundPost.tags.includes(tag))
          )
          .slice(0, 2);
        setRelatedPosts(related);
      }
    } catch (error) {
      console.error('Error loading post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    // Don't allow liking if not logged in or if post is null
    if (!user || !post) {
      console.log('Cannot like: user or post is null', { user: !!user, post: !!post });
      return;
    }
    
    try {
      console.log('Attempting to like/unlike post', { 
        postId: post.id, 
        userId: user.id,
        currentLikeStatus: isLiked 
      });
      
      const newIsLiked = !isLiked;
      const success = await updateBlogLikes(post.id, newIsLiked);
      
      console.log('Like update result:', { success, newIsLiked });
      
      if (success) {
        setIsLiked(newIsLiked);
        setLikes(prev => newIsLiked ? prev + 1 : prev - 1);
        console.log('Updated UI state:', { isLiked: newIsLiked, likes });
      } else {
        console.log('Failed to update like status');
      }
    } catch (error) {
      console.error('Error updating like status:', error);
    }
  };

  const handleSave = async () => {
    if (!user || !post) return;
    
    try {
      if (isSaved) {
        const success = await removeFromFavorites('blog', post.id);
        if (success) {
          setIsSaved(false);
        }
      } else {
        const success = await addToFavorites('blog', post.id);
        if (success) {
          setIsSaved(true);
        }
      }
    } catch (error) {
      console.error('Error toggling save status:', error);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title,
        text: post?.excerpt,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const getPostIcon = () => {
    if (post?.customIcon && iconMap[post.customIcon]) {
      return iconMap[post.customIcon];
    }
    return FileText;
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

  if (!post) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-20 pb-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold mb-4">Bài viết không tồn tại</h1>
            <Link href="/blog">
              <Button variant="outline">Quay lại Blog</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const PostIcon = getPostIcon();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back Button */}
          <Link href="/blog" className="inline-flex items-center gap-2 text-muted-foreground hover:text-[#93E1D8] transition-colors mb-8">
            <ArrowLeftIcon className="h-4 w-4" />
            Quay lại Blog
          </Link>

          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              {post.customIcon && (
                <PostIcon className="h-8 w-8 text-[#93E1D8]" />
              )}
              <h1 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light leading-tight break-words hyphens-auto ${getFontClass(post.titleFont)}`}>
                {post.title}
              </h1>
            </div>
            
            {/* Meta */}
            <div className="flex flex-wrap items-center gap-6 mb-6">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={post.authorAvatar} alt={post.author} />
                  <AvatarFallback>{post.author[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{post.author}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4" />
                      <span>{new Date(post.publishedAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ClockIcon className="h-4 w-4" />
                      <span>{post.readTime} phút đọc</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 mb-8">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLike}
                className={`gap-2 ${isLiked ? 'text-red-500 border-red-200' : ''}`}
              >
                <HeartIcon className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                {likes}
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <MessageCircleIcon className="h-4 w-4" />
                {post.comments}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={!user}
                className={`gap-2 ${isSaved ? 'text-blue-500 border-blue-200' : ''}`}
              >
                <BookmarkIcon className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                {!user ? 'Đăng nhập để lưu' : (isSaved ? 'Đã lưu' : 'Lưu')}
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
                <ShareIcon className="h-4 w-4" />
                Chia sẻ
              </Button>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-8">
              {post.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-sm">
                  {tag}
                </Badge>
              ))}
            </div>
          </header>

          {/* Featured Image */}
          {post.featuredImage && (
            <div className="relative h-64 md:h-96 overflow-hidden rounded-xl mb-12">
              <Image
                src={post.featuredImage}
                alt={post.title}
                fill
                sizes="(max-width: 768px) 100vw, 80vw"
                className="object-cover"
              />
            </div>
          )}

          {/* Content */}
          <article className="prose prose-lg max-w-none">
            <div 
              className={`text-gray-700 leading-relaxed space-y-6 ${getFontClass(post.contentFont)}`}
              style={{ 
                fontSize: '1.125rem',
                lineHeight: '1.8'
              }}
              dangerouslySetInnerHTML={{ 
                __html: post.content
                  .replace(/\n\n/g, '</p><p>')
                  .replace(/\n/g, '<br>')
                  .replace(/^/, '<p>')
                  .replace(/$/, '</p>')
                  .replace(/## (.*?)<br>/g, '<h2 style="font-size: 1.5rem; font-weight: 600; margin: 2rem 0 1rem 0; color: #1f2937;">$1</h2>')
                  .replace(/### (.*?)<br>/g, '<h3 style="font-size: 1.25rem; font-weight: 600; margin: 1.5rem 0 0.75rem 0; color: #1f2937;">$1</h3>')
              }}
            />
          </article>

          {/* Footer Actions */}
          <Separator className="my-12" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={handleLike}
                className={`gap-2 ${isLiked ? 'text-red-500 border-red-200' : ''}`}
              >
                <HeartIcon className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                {isLiked ? 'Đã thích' : 'Thích bài viết'}
              </Button>
              <Button variant="outline" onClick={handleShare} className="gap-2">
                <ShareIcon className="h-4 w-4" />
                Chia sẻ
              </Button>
            </div>
            
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.authorAvatar} alt={post.author} />
                <AvatarFallback>{post.author[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <p className="font-medium">Viết bởi {post.author}</p>
                <p className="text-muted-foreground">{new Date(post.publishedAt).toLocaleDateString('vi-VN')}</p>
              </div>
            </div>
          </div>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <>
              <Separator className="my-12" />
              
              <div>
                <h3 className="font-cormorant text-2xl font-light mb-6">Bài viết liên quan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {relatedPosts.map(relatedPost => {
                    const RelatedIcon = relatedPost.customIcon && iconMap[relatedPost.customIcon] 
                      ? iconMap[relatedPost.customIcon] 
                      : FileText;
                    
                    return (
                      <Link key={relatedPost.id} href={`/blog/${relatedPost.id}`} className="group">
                        <div className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                          {relatedPost.featuredImage ? (
                            <div className="relative h-48">
                              <Image
                                src={relatedPost.featuredImage}
                                alt={relatedPost.title}
                                fill
                                sizes="(max-width: 768px) 100vw, 50vw"
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          ) : (
                            <div className="h-48 bg-gradient-to-br from-[#93E1D8]/20 to-[#FFA69E]/20 flex items-center justify-center">
                              <RelatedIcon className="h-12 w-12 text-[#93E1D8]" />
                            </div>
                          )}
                          <div className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              {relatedPost.customIcon && (
                                <RelatedIcon className="h-4 w-4 text-[#93E1D8]" />
                              )}
                              <h4 className="font-cormorant text-xl font-medium group-hover:text-[#93E1D8] transition-colors">
                                {relatedPost.title}
                              </h4>
                            </div>
                            <p className="text-muted-foreground text-sm line-clamp-2">
                              {relatedPost.excerpt}
                            </p>
                            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                              <span>{new Date(relatedPost.publishedAt).toLocaleDateString('vi-VN')}</span>
                              <span>•</span>
                              <span>{relatedPost.readTime} phút đọc</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Comments Section */}
          <Separator className="my-12" />
          <CommentSection 
            itemId={post.id} 
            itemType="blog" 
            className="mt-8"
          />
        </div>
      </div>

      <Footer />
    </div>
  );
}