"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Save, 
  Eye, 
  Upload, 
  X, 
  Plus, 
  Calendar,
  Clock,
  User,
  Tag,
  Image as ImageIcon,
  Palette,
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useEdgeStore } from '@/lib/edgestore';
import { BlogPost, createBlogPost, updateBlogPost, getBlogTags, createBlogTag, saveBlogTags } from '@/lib/blog';
import { getStoredUser } from '@/lib/auth';

interface BlogEditorProps {
  post?: BlogPost;
  onSave: (post: BlogPost) => void;
  onCancel: () => void;
}

const iconOptions = [
  { name: 'FileText', icon: FileText, color: '#3B82F6' },
  { name: 'Calendar', icon: Calendar, color: '#10B981' },
  { name: 'Clock', icon: Clock, color: '#F59E0B' },
  { name: 'User', icon: User, color: '#8B5CF6' },
  { name: 'Tag', icon: Tag, color: '#EF4444' },
  { name: 'Image', icon: ImageIcon, color: '#06B6D4' },
  { name: 'Palette', icon: Palette, color: '#EC4899' }
];

export function BlogEditor({ post, onSave, onCancel }: BlogEditorProps) {
  const [formData, setFormData] = useState({
    title: post?.title || '',
    content: post?.content || '',
    featuredImage: post?.featuredImage || '',
    customIcon: post?.customIcon || '',
    tags: post?.tags || [],
    status: post?.status || 'draft' as 'draft' | 'published'
  });
  
  const [newTag, setNewTag] = useState('');
  const [tagColor, setTagColor] = useState('#93E1D8');
  const [availableTags, setAvailableTags] = useState(getBlogTags());
  const [showPreview, setShowPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { edgestore } = useEdgeStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const user = getStoredUser();

  useEffect(() => {
    setAvailableTags(getBlogTags());
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Tiêu đề là bắt buộc';
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Nội dung là bắt buộc';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const res = await edgestore.images.upload({
        file,
        onProgressChange: (progress) => {
          console.log('Upload progress:', progress);
        },
      });
      
      setFormData(prev => ({ ...prev, featuredImage: res.url }));
      setSaveMessage('Ảnh đã được tải lên thành công!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Upload failed:', error);
      setSaveMessage('Lỗi khi tải ảnh lên');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    
    const tagName = newTag.toLowerCase().trim();
    
    // Check if tag already exists
    const existingTag = availableTags.find(tag => tag.name === tagName);
    
    if (!existingTag) {
      const newTagObj = createBlogTag(tagName, tagColor);
      setAvailableTags(prev => [...prev, newTagObj]);
    }
    
    if (!formData.tags.includes(tagName)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagName]
      }));
    }
    
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSave = () => {
    if (!validateForm() || !user) return;

    try {
      let savedPost: BlogPost;
      
      if (post) {
        savedPost = updateBlogPost(post.id, formData, user.name)!;
      } else {
        savedPost = createBlogPost({
          ...formData,
          authorAvatar: user.image || ''
        }, user.id, user.name);
      }
      
      // Update tag counts
      const tags = getBlogTags();
      tags.forEach(tag => {
        const posts = JSON.parse(localStorage.getItem('blogPosts') || '[]');
        tag.postCount = posts.filter((p: BlogPost) => 
          p.tags.includes(tag.name) && p.status === 'published'
        ).length;
      });
      saveBlogTags(tags);
      
      setSaveMessage(post ? 'Bài viết đã được cập nhật!' : 'Bài viết đã được tạo!');
      setTimeout(() => {
        onSave(savedPost);
      }, 1000);
    } catch (error) {
      setSaveMessage('Có lỗi xảy ra khi lưu bài viết');
    }
  };

  const getSelectedIcon = () => {
    const selected = iconOptions.find(option => option.name === formData.customIcon);
    return selected ? selected.icon : FileText;
  };

  const SelectedIcon = getSelectedIcon();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Success/Error Messages */}
      {saveMessage && (
        <Alert className={saveMessage.includes('Lỗi') ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
          {saveMessage.includes('Lỗi') ? (
            <AlertCircle className="h-4 w-4 text-red-500" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
          <AlertDescription className={saveMessage.includes('Lỗi') ? 'text-red-700' : 'text-green-700'}>
            {saveMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-cormorant text-3xl font-light">
          {post ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Xem trước
          </Button>
          <Button onClick={handleSave} className="bg-[#93E1D8] hover:bg-[#93E1D8]/90">
            <Save className="h-4 w-4 mr-2" />
            {post ? 'Cập nhật' : 'Lưu'}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Hủy
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tiêu đề bài viết</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Nhập tiêu đề bài viết..."
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className={`text-lg ${errors.title ? 'border-red-500' : ''}`}
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title}</p>
              )}
            </CardContent>
          </Card>

          {/* Content Editor */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Nội dung</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Viết nội dung bài viết của bạn..."
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={15}
                className={`resize-none font-cormorant text-base leading-relaxed ${errors.content ? 'border-red-500' : ''}`}
              />
              {errors.content && (
                <p className="text-red-500 text-sm mt-1">{errors.content}</p>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                Hỗ trợ định dạng HTML cơ bản. Sử dụng ## cho tiêu đề phụ, ### cho tiêu đề nhỏ.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cài đặt xuất bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="publish-status">Trạng thái</Label>
                <div className="flex items-center gap-2">
                  <span className={formData.status === 'draft' ? 'font-medium' : 'text-muted-foreground'}>
                    Nháp
                  </span>
                  <Switch
                    id="publish-status"
                    checked={formData.status === 'published'}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, status: checked ? 'published' : 'draft' }))
                    }
                  />
                  <span className={formData.status === 'published' ? 'font-medium' : 'text-muted-foreground'}>
                    Xuất bản
                  </span>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                {formData.status === 'published' ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Bài viết sẽ được xuất bản công khai
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Bài viết được lưu dưới dạng nháp
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Featured Image */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ảnh đại diện</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.featuredImage && (
                <div className="relative">
                  <img
                    src={formData.featuredImage}
                    alt="Featured"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2"
                    onClick={() => setFormData(prev => ({ ...prev, featuredImage: '' }))}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Đang tải...' : 'Tải ảnh lên'}
              </Button>
            </CardContent>
          </Card>

          {/* Custom Icon */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Biểu tượng tùy chỉnh</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {iconOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <Button
                      key={option.name}
                      variant={formData.customIcon === option.name ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, customIcon: option.name }))}
                      className="h-12 w-12 p-0"
                    >
                      <IconComponent 
                        className="h-5 w-5" 
                        style={{ color: formData.customIcon === option.name ? 'white' : option.color }}
                      />
                    </Button>
                  );
                })}
              </div>
              {formData.customIcon && (
                <div className="mt-3 p-2 bg-gray-50 rounded-lg flex items-center gap-2">
                  <SelectedIcon className="h-4 w-4 text-[#93E1D8]" />
                  <span className="text-sm">Đã chọn: {formData.customIcon}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Thẻ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Tags */}
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer hover:bg-red-100"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>

              {/* Add New Tag */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Thêm thẻ mới..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    className="flex-1"
                  />
                  <input
                    type="color"
                    value={tagColor}
                    onChange={(e) => setTagColor(e.target.value)}
                    className="w-10 h-10 rounded border"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={handleAddTag}
                  disabled={!newTag.trim()}
                  className="w-full"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Thêm thẻ
                </Button>
              </div>

              {/* Available Tags */}
              {availableTags.length > 0 && (
                <div>
                  <Label className="text-sm text-muted-foreground">Thẻ có sẵn:</Label>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {availableTags.map(tag => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="cursor-pointer hover:bg-[#93E1D8]/10 text-xs"
                        style={{ borderColor: tag.color }}
                        onClick={() => {
                          if (!formData.tags.includes(tag.name)) {
                            setFormData(prev => ({
                              ...prev,
                              tags: [...prev.tags, tag.name]
                            }));
                          }
                        }}
                      >
                        {tag.name} ({tag.postCount})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Xem trước bài viết
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                {formData.customIcon && (
                  <SelectedIcon className="h-6 w-6 text-[#93E1D8]" />
                )}
                <h1 className="font-cormorant text-3xl font-light">
                  {formData.title || 'Tiêu đề bài viết'}
                </h1>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{user?.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date().toLocaleDateString('vi-VN')}</span>
                </div>
                <Badge variant={formData.status === 'published' ? 'default' : 'secondary'}>
                  {formData.status === 'published' ? 'Đã xuất bản' : 'Nháp'}
                </Badge>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {formData.tags.map(tag => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Featured Image */}
            {formData.featuredImage && (
              <div className="relative h-64 overflow-hidden rounded-xl">
                <img
                  src={formData.featuredImage}
                  alt={formData.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Content */}
            <div className="prose prose-lg max-w-none">
              <div 
                className="text-gray-700 leading-relaxed space-y-6"
                style={{ 
                  fontFamily: 'var(--font-cormorant)',
                  fontSize: '1.125rem',
                  lineHeight: '1.8'
                }}
                dangerouslySetInnerHTML={{ 
                  __html: formData.content
                    .replace(/\n\n/g, '</p><p>')
                    .replace(/\n/g, '<br>')
                    .replace(/^/, '<p>')
                    .replace(/$/, '</p>')
                    .replace(/## (.*?)<br>/g, '<h2 style="font-size: 1.5rem; font-weight: 600; margin: 2rem 0 1rem 0; color: #1f2937;">$1</h2>')
                    .replace(/### (.*?)<br>/g, '<h3 style="font-size: 1.25rem; font-weight: 600; margin: 1.5rem 0 0.75rem 0; color: #1f2937;">$1</h3>')
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}