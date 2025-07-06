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
  Save, 
  X,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { getCurrentUser, type AuthUser } from '@/lib/auth';
import {
  getBlogComments,
  createBlogComment,
  updateBlogComment,
  deleteBlogComment,
  getGalleryComments,
  createGalleryComment,
  updateGalleryComment,
  deleteGalleryComment,
  type BlogComment,
  type GalleryComment
} from '@/lib/favorites-supabase';

interface CommentSectionProps {
  itemId: string;
  itemType: 'blog' | 'gallery';
  className?: string;
}

type Comment = BlogComment | GalleryComment;

export function CommentSection({ itemId, itemType, className }: CommentSectionProps) {
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
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      setMessage('Có lỗi xảy ra khi thêm bình luận');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim() || !editingComment || submitting) return;

    try {
      setSubmitting(true);
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
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      setMessage('Có lỗi xảy ra khi cập nhật bình luận');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bình luận này?')) return;

    try {
      setSubmitting(true);
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
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      setMessage('Có lỗi xảy ra khi xóa bình luận');
    } finally {
      setSubmitting(false);
    }
  };

  const cancelEdit = () => {
    setEditingComment(null);
    setEditContent('');
  };

  return (
    <div className={className}>
      {/* Success/Error Messages */}
      {message && (
        <Alert className={`mb-4 ${message.includes('Lỗi') ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
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

      {/* Comments Header */}
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="h-5 w-5 text-[#93E1D8]" />
        <h3 className="font-cormorant text-xl font-medium">
          Bình luận ({comments.length})
        </h3>
      </div>

      {/* Add Comment Form */}
      {user ? (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.image} alt={user.name} />
                <AvatarFallback className="bg-[#93E1D8] text-white">
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
        <Card className="mb-6">
          <CardContent className="p-4 text-center">
            <p className="text-muted-foreground">
              Vui lòng đăng nhập để bình luận
            </p>
          </CardContent>
        </Card>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#93E1D8] mx-auto"></div>
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={comment.userAvatar} alt={comment.userName} />
                    <AvatarFallback className="bg-[#93E1D8] text-white">
                      {comment.userName[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-sm">{comment.userName}</h4>
                        <p className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleDateString('vi-VN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {comment.updatedAt !== comment.createdAt && (
                            <span className="ml-2">(đã chỉnh sửa)</span>
                          )}
                        </p>
                      </div>
                      
                      {user && user.id === comment.userId && (
                        <div className="flex gap-1">
                          {editingComment === comment.id ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleSaveEdit}
                                disabled={!editContent.trim() || submitting}
                              >
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEdit}
                                disabled={submitting}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditComment(comment)}
                                disabled={submitting}
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-red-500 hover:bg-red-50"
                                disabled={submitting}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {editingComment === comment.id ? (
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h4 className="font-cormorant text-lg font-light mb-2">
            Chưa có bình luận nào
          </h4>
          <p className="text-muted-foreground">
            Hãy là người đầu tiên bình luận về {itemType === 'blog' ? 'bài viết' : 'bức ảnh'} này
          </p>
        </div>
      )}
    </div>
  );
}