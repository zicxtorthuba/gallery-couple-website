"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Tag, 
  Palette,
  Save,
  X,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { BlogTag, getBlogTags, createBlogTag, updateBlogTag, deleteBlogTag } from '@/lib/blog-supabase';

export function TagManager() {
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [editingTag, setEditingTag] = useState<BlogTag | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<BlogTag | null>(null);
  const [newTag, setNewTag] = useState({ name: '', color: '#93E1D8', category: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      const allTags = await getBlogTags();
      setTags(allTags);
    } catch (error) {
      console.error('Error loading tags:', error);
      setMessage('Có lỗi xảy ra khi tải thẻ');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async () => {
    if (!newTag.name.trim()) return;

    const existingTag = tags.find(tag => tag.name.toLowerCase() === newTag.name.toLowerCase());
    if (existingTag) {
      setMessage('Thẻ này đã tồn tại!');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      const createdTag = await createBlogTag(newTag.name, newTag.color, newTag.category || undefined);
      if (createdTag) {
        setNewTag({ name: '', color: '#93E1D8', category: '' });
        await loadTags();
        setMessage('Thẻ đã được tạo thành công!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Có lỗi xảy ra khi tạo thẻ');
      }
    } catch (error) {
      console.error('Error creating tag:', error);
      setMessage('Có lỗi xảy ra khi tạo thẻ');
    }
  };

  const handleEditTag = (tag: BlogTag) => {
    setEditingTag({ ...tag });
  };

  const handleSaveEdit = async () => {
    if (!editingTag) return;

    try {
      const updatedTag = await updateBlogTag(editingTag.id, {
        name: editingTag.name,
        color: editingTag.color,
        category: editingTag.category
      });

      if (updatedTag) {
        setEditingTag(null);
        await loadTags();
        setMessage('Thẻ đã được cập nhật!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Có lỗi xảy ra khi cập nhật thẻ');
      }
    } catch (error) {
      console.error('Error updating tag:', error);
      setMessage('Có lỗi xảy ra khi cập nhật thẻ');
    }
  };

  const handleDeleteTag = (tag: BlogTag) => {
    if (tag.postCount > 0) {
      setMessage('Không thể xóa thẻ đang được sử dụng!');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    setDeleteConfirm(tag);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      const success = await deleteBlogTag(deleteConfirm.id);
      if (success) {
        setDeleteConfirm(null);
        await loadTags();
        setMessage('Thẻ đã được xóa!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Có lỗi xảy ra khi xóa thẻ');
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
      setMessage('Có lỗi xảy ra khi xóa thẻ');
    }
  };

  const tagCategories = Array.from(new Set(tags.map(tag => tag.category).filter(Boolean)));

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#93E1D8]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5DC] py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
      {/* Success/Error Messages */}
      {message && (
        <Alert className={message.includes('Lỗi') || message.includes('không thể') ? 'border-red-200 bg-red-50/90' : 'border-green-200 bg-green-50/90'}>
          {message.includes('Lỗi') || message.includes('không thể') ? (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
          <AlertDescription className={message.includes('Lỗi') || message.includes('không thể') ? 'text-red-700' : 'text-green-700'}>
            {message}
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div>
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border-white/50 mb-6">
          <h2 className="font-cormorant text-2xl font-light mb-2">Quản lý thẻ</h2>
        <p className="text-muted-foreground">
          Tạo và quản lý các thẻ cho bài viết
        </p>
        </div>
      </div>

      {/* Create New Tag */}
      <Card className="bg-white/95 backdrop-blur-sm border-white/50 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Tạo thẻ mới</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="tag-name">Tên thẻ</Label>
              <Input
                id="tag-name"
                placeholder="Nhập tên thẻ..."
                value={newTag.name}
                onChange={(e) => setNewTag(prev => ({ ...prev, name: e.target.value }))}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateTag()}
              />
            </div>
            <div>
              <Label htmlFor="tag-color">Màu sắc</Label>
              <div className="flex gap-2">
                <input
                  id="tag-color"
                  type="color"
                  value={newTag.color}
                  onChange={(e) => setNewTag(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full h-10 rounded border"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="tag-category">Danh mục (tùy chọn)</Label>
              <Input
                id="tag-category"
                placeholder="Danh mục..."
                value={newTag.category}
                onChange={(e) => setNewTag(prev => ({ ...prev, category: e.target.value }))}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleCreateTag}
                disabled={!newTag.name.trim()}
                className="w-full bg-[#93E1D8] hover:bg-[#93E1D8]/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tạo thẻ
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tags List */}
      <div className="space-y-6">
        {tagCategories.length > 0 && (
          <>
            {tagCategories.map(category => (
              <Card key={category} className="bg-white/95 backdrop-blur-sm border-white/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg capitalize">{category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tags.filter(tag => tag.category === category).map(tag => (
                      <div key={tag.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          <div>
                            <span className="font-medium">{tag.name}</span>
                            <p className="text-xs text-muted-foreground">
                              {tag.postCount} bài viết
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditTag(tag)}
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteTag(tag)}
                            className="text-red-500 hover:bg-red-50"
                            disabled={tag.postCount > 0}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}

        {/* Uncategorized Tags */}
        {tags.filter(tag => !tag.category).length > 0 && (
          <Card className="bg-white/95 backdrop-blur-sm border-white/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Thẻ chưa phân loại</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tags.filter(tag => !tag.category).map(tag => (
                  <div key={tag.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <div>
                        <span className="font-medium">{tag.name}</span>
                        <p className="text-xs text-muted-foreground">
                          {tag.postCount} bài viết
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditTag(tag)}
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteTag(tag)}
                        className="text-red-500 hover:bg-red-50"
                        disabled={tag.postCount > 0}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {tags.length === 0 && (
          <div className="text-center py-12 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border-white/50">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Tag className="h-8 w-8 text-[#93E1D8]" />
            </div>
            <h3 className="font-cormorant text-xl font-light mb-2">
              Chưa có thẻ nào
            </h3>
            <p className="text-muted-foreground">
              Tạo thẻ đầu tiên để phân loại bài viết của bạn
            </p>
          </div>
        )}
      </div>

      {/* Edit Tag Dialog */}
      <Dialog open={!!editingTag} onOpenChange={() => setEditingTag(null)}>
        <DialogContent className="bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Chỉnh sửa thẻ
            </DialogTitle>
          </DialogHeader>
          
          {editingTag && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Tên thẻ</Label>
                <Input
                  id="edit-name"
                  value={editingTag.name}
                  onChange={(e) => setEditingTag(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-color">Màu sắc</Label>
                <input
                  id="edit-color"
                  type="color"
                  value={editingTag.color}
                  onChange={(e) => setEditingTag(prev => prev ? { ...prev, color: e.target.value } : null)}
                  className="w-full h-10 rounded border"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-category">Danh mục</Label>
                <Input
                  id="edit-category"
                  value={editingTag.category || ''}
                  onChange={(e) => setEditingTag(prev => prev ? { ...prev, category: e.target.value } : null)}
                  placeholder="Danh mục (tùy chọn)"
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditingTag(null)}>
                  <X className="h-4 w-4 mr-2" />
                  Hủy
                </Button>
                <Button onClick={handleSaveEdit} className="bg-[#93E1D8] hover:bg-[#93E1D8]/90">
                  <Save className="h-4 w-4 mr-2" />
                  Lưu
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Xác nhận xóa thẻ
            </DialogTitle>
          </DialogHeader>
          
          {deleteConfirm && (
            <div className="space-y-4">
              <p>
                Bạn có chắc chắn muốn xóa thẻ <strong>"{deleteConfirm.name}"</strong>?
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
                  Xóa thẻ
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}