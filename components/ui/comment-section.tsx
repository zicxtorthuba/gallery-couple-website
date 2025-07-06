"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageCircle, 
  Send, 
  Edit3, 
  Trash2, 
  User,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { getCurrentUser, type AuthUser } from '@/lib/auth';
import {
  getBlogComments,
  getGalleryComments,
  createBlogComment,
  createGalleryComment,
  updateBlogComment,
  updateGalleryComment,
  deleteBlogComment,
  deleteGalleryComment,
  type Comment,
  type BlogComment,
  type GalleryComment
} from '@/lib/favorites-supabase';

interface CommentSectionProps {
  itemId: string;
  itemType: 'gallery' | 'blog';
  className?: string;
}

export function CommentSection({ itemId, itemType, className = '' }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadComments();
    loadUser();
  }, [itemId, itemType]);

  const loadUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  };

  const loadComments = async () => {
    try {
      setLoading(true);
      let commentsData: Comment[] = [];
      
      if (itemType === 'blog') {
        commentsData = await getBlogComments(itemId);
      } else {
        commentsData = await getGalleryComments(itemId);
      }
      
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading comments:', error);
      setMessage('Có lỗi xảy ra khi tải bình luận');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user || submitting) return;

    try {
      setSubmitting(true);
      let newCommentData: Comment | null = null;

      if (itemType === 'blog') {
        newCommentData = await createBlogComment(itemId, newComment);
      } else {
        newCommentData = await createGalleryComment(itemId, newComment);
      }

      if (newCommentData) {
        setComments(prev => [...prev, newCommentData]);
        setNewComment('');
        setMessage('Bình luận đã được thêm!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Có lỗi xảy ra khi thêm bình luận');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      setMessage('Có lỗi xảy ra khi thêm bình luận');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim() || !editingComment) return;

    try {
      let success = false;
      
      if (itemType === 'blog') {
        success = await updateBlogComment(editingComment, editContent);
      } else {
        success = await updateGalleryComment(editingComment, editContent);
      }

      if (success) {
        setComments(prev => prev.map(comment =>
          comment.id === editingComment
            ? { ...comment, content: editContent, updatedAt: new Date().toISOString() }
            : comment
        ));
        setEditingComment(null);
        setEditContent('');
        setMessage('Bình luận đã được cập nhật!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Có lỗi xảy ra khi cập nhật bình luận');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      setMessage('Có lỗi xảy ra khi cập nhật bình luận');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      let success = false;
      
      if (itemType === 'blog') {
        success = await deleteBlogComment(commentId);
      } else {
        success = await deleteGalleryComment(commentId);
      }

      if (success) {
        setComments(prev => prev.filter(comment => comment.id !== commentId));
        setMessage('Bình luận đã được xóa!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Có lỗi xảy ra khi xóa bình luận');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      setMessage('Có lỗi xảy ra khi xóa bình luận');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
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
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-[#93E1D8]" />
        <h3 className="font-cormorant text-xl font-light">
          Bình luận ({comments.length})
        </h3>
      </div>

      {/* Add Comment */}
      {user ? (
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.image} alt={user.name} />
                <AvatarFallback className="bg-[#93E1D8] text-white text-sm">
                  {user.name[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  placeholder="Viết bình luận của bạn..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || submitting}
                    className="bg-[#93E1D8] hover:bg-[#93E1D8]/90"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {submitting ? 'Đang gửi...' : 'Gửi bình luận'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4 text-center">
            <User className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">
              Đăng nhập để viết bình luận
            </p>
          </CardContent>
        </Card>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#93E1D8] mx-auto"></div>
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.userAvatar} alt={comment.userName} />
                    <AvatarFallback className="bg-[#93E1D8] text-white text-sm">
                      {comment.userName[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">{comment.userName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleDateString('vi-VN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {comment.updatedAt !== comment.createdAt && ' (đã chỉnh sửa)'}
                        </p>
                      </div>
                      {user && user.id === comment.userId && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditComment(comment)}
                            className="h-6 w-6 p-0"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="h-6 w-6 p-0 text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {editingComment === comment.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                          className="resize-none"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleSaveEdit}
                            disabled={!editContent.trim()}
                            className="bg-[#93E1D8] hover:bg-[#93E1D8]/90"
                          >
                            Lưu
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingComment(null);
                              setEditContent('');
                            }}
                          >
                            Hủy
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">
              Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}