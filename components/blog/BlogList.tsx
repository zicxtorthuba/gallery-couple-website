"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  Calendar, 
  Clock, 
  User,
  FileText,
  Filter,
  BookOpen,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { BlogPost, getBlogPosts, deleteBlogPost, getBlogTags, updateTagCounts } from '@/lib/blog';
import { getStoredUser } from '@/lib/auth';

interface BlogListProps {
  onCreatePost: () => void;
  onEditPost: (post: BlogPost) => void;
}

export function BlogList({ onCreatePost, onEditPost }: BlogListProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<BlogPost | null>(null);
  const [message, setMessage] = useState('');
  
  const user = getStoredUser();
  const tags = getBlogTags();

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    filterPosts();
  }, [posts, searchTerm, selectedStatus, selectedTag]);

  const loadPosts = () => {
    const allPosts = getBlogPosts();
    setPosts(allPosts);
    updateTagCounts();
  };

  const filterPosts = () => {
    let filtered = posts;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(post => post.status === selectedStatus);
    }

    // Filter by tag
    if (selectedTag !== 'all') {
      filtered = filtered.filter(post => post.tags.includes(selectedTag));
    }

    setFilteredPosts(filtered);
  };

  const handleDeletePost = (post: BlogPost) => {
    setDeleteConfirm(post);
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;

    const success = deleteBlogPost(deleteConfirm.id);
    if (success) {
      loadPosts();
      setMessage('Bài viết đã được xóa thành công!');
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage('Có lỗi xảy ra khi xóa bài viết');
    }
    setDeleteConfirm(null);
  };

  const getStatusBadge = (status: string) => {
    return status === 'published' ? (
      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
        <CheckCircle className="h-3 w-3 mr-1" />
        Đã xuất bản
      </Badge>
    ) : (
      <Badge variant="secondary">
        <FileText className="h-3 w-3 mr-1" />
        Nháp
      </Badge>
    );
  };

  const getPostIcon = (iconName?: string) => {
    const iconMap: Record<string, any> = {
      FileText, Calendar, Clock, User, Eye, BookOpen
    };
    const IconComponent = iconName ? iconMap[iconName] : FileText;
    return IconComponent || FileText;
  };

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {message && (
        <Alert className={message.includes('Lỗi') ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
          {message.includes('Lỗi') ? (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
          <AlertDescription className={message.includes('Lỗi') ? 'text-red-700' : 'text-green-700'}>
            {message}
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-cormorant text-3xl font-light">Quản lý Blog</h1>
          <p className="text-muted-foreground">
            Tạo và quản lý các bài viết của bạn
          </p>
        </div>
        <Button onClick={onCreatePost} className="bg-[#93E1D8] hover:bg-[#93E1D8]/90">
          <Plus className="h-4 w-4 mr-2" />
          Tạo bài viết mới
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm bài viết..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#93E1D8] focus:border-transparent"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="published">Đã xuất bản</option>
          <option value="draft">Nháp</option>
        </select>

        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#93E1D8] focus:border-transparent"
        >
          <option value="all">Tất cả thẻ</option>
          {tags.map(tag => (
            <option key={tag.id} value={tag.name}>
              {tag.name} ({tag.postCount})
            </option>
          ))}
        </select>

        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Filter className="h-4 w-4" />
          {filteredPosts.length} bài viết
        </div>
      </div>

      {/* Posts List */}
      {filteredPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => {
            const IconComponent = getPostIcon(post.customIcon);
            return (
              <Card key={post.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  {/* Featured Image */}
                  {post.featuredImage ? (
                    <div className="relative h-48 overflow-hidden rounded-t-lg">
                      <Image
                        src={post.featuredImage}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-[#93E1D8]/20 to-[#FFA69E]/20 rounded-t-lg flex items-center justify-center">
                      <IconComponent className="h-12 w-12 text-[#93E1D8]" />
                    </div>
                  )}

                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {post.customIcon && (
                          <IconComponent className="h-5 w-5 text-[#93E1D8]" />
                        )}
                        <h3 className="font-cormorant text-xl font-medium line-clamp-2">
                          {post.title}
                        </h3>
                      </div>
                      {getStatusBadge(post.status)}
                    </div>

                    {/* Excerpt */}
                    <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                      {post.excerpt}
                    </p>

                    {/* Tags */}
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {post.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
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

                    {/* Meta */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{post.author}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{post.readTime} phút đọc</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {post.status === 'published' && (
                        <Link href={`/blog/${post.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Eye className="h-3 w-3 mr-1" />
                            Xem
                          </Button>
                        </Link>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditPost(post)}
                        className="flex-1"
                      >
                        <Edit3 className="h-3 w-3 mr-1" />
                        Sửa
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePost(post)}
                        className="text-red-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 bg-[#93E1D8]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="h-12 w-12 text-[#93E1D8]" />
            </div>
            <h3 className="font-cormorant text-2xl font-light mb-2">
              {searchTerm || selectedStatus !== 'all' || selectedTag !== 'all' 
                ? 'Không tìm thấy bài viết nào' 
                : 'Chưa có bài viết nào'
              }
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || selectedStatus !== 'all' || selectedTag !== 'all'
                ? 'Thử thay đổi bộ lọc để tìm thấy bài viết bạn cần'
                : 'Hãy bắt đầu chia sẻ những câu chuyện và kinh nghiệm của bạn'
              }
            </p>
            {!searchTerm && selectedStatus === 'all' && selectedTag === 'all' && (
              <Button onClick={onCreatePost} className="bg-[#93E1D8] hover:bg-[#93E1D8]/90">
                <Plus className="h-4 w-4 mr-2" />
                Tạo bài viết đầu tiên
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Xác nhận xóa bài viết
            </DialogTitle>
          </DialogHeader>
          
          {deleteConfirm && (
            <div className="space-y-4">
              <p>
                Bạn có chắc chắn muốn xóa bài viết <strong>"{deleteConfirm.title}"</strong>?
              </p>
              <p className="text-sm text-muted-foreground">
                Hành động này không thể hoàn tác.
              </p>
              
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                  Hủy
                </Button>
                <Button variant="destructive" onClick={confirmDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa bài viết
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}