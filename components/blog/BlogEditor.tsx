"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StorageIndicator } from '@/components/ui/storage-indicator';
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
  AlertCircle,
  FileImage
} from 'lucide-react';
import { useEdgeStore } from '@/lib/edgestore';
import { BlogPost, createBlogPost, updateBlogPost, getBlogTags, createBlogTag } from '@/lib/blog-supabase';
import { getCurrentUser } from '@/lib/auth';
import { 
  isFileSizeValid, 
  hasStorageSpace, 
  recordFileUpload, 
  removeFileUpload,
  formatBytes,
  MAX_FILE_SIZE,
  type StorageInfo
} from '@/lib/storage';

interface BlogEditorProps {
  post?: BlogPost;
  onSave: (post: BlogPost) => void;
  onCancel: () => void;
}

const fontOptions = [
  { value: '', label: 'Mặc định (Cormorant)', className: 'font-cormorant' },
  { value: 'dancing-script', label: 'Dancing Script', className: 'font-dancing-script' },
  { value: 'playwrite-vn', label: 'Playwrite Vietnam', className: 'font-playwrite-vn' },
  { value: 'my-soul', label: 'My Soul', className: 'font-my-soul' },
  { value: 'edu-qld', label: 'Edu QLD Hand', className: 'font-edu-qld' },
  { value: 'amatic-sc', label: 'Amatic SC', className: 'font-amatic-sc' },
  { value: 'vt323', label: 'VT323', className: 'font-vt323' },
  { value: 'pinyon-script', label: 'Pinyon Script', className: 'font-pinyon-script' }
];

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
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: post?.title || '',
    content: post?.content || '',
    featuredImage: post?.featuredImage || '',
    customIcon: post?.customIcon || '',
    tags: post?.tags || [],
    status: post?.status || 'draft' as 'draft' | 'published',
    titleFont: post?.titleFont || '',
    contentFont: post?.contentFont || ''
  });
  
  const [newTag, setNewTag] = useState('');
  const [tagColor, setTagColor] = useState('#93E1D8');
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  
  const { edgestore } = useEdgeStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadTags();
    loadUser();
  }, []);

  const loadUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  };

  const loadTags = async () => {
    try {
      const tags = await getBlogTags();
      setAvailableTags(tags);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

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

  const validateFile = async (file: File): Promise<string | null> => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return 'Vui lòng chọn file ảnh hợp lệ';
    }

    // Check file size
    if (!isFileSizeValid(file)) {
      return `Kích thước file không được vượt quá ${formatBytes(MAX_FILE_SIZE)}`;
    }

    // Check storage space
    const hasSpace = await hasStorageSpace(file.size);
    if (!hasSpace) {
      return 'Không đủ dung lượng lưu trữ. Vui lòng xóa một số ảnh để giải phóng không gian.';
    }

    return null;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validationError = await validateFile(file);
    if (validationError) {
      setSaveMessage(validationError);
      setTimeout(() => setSaveMessage(''), 5000);
      return;
    }

    try {
      setIsUploading(true);
      
      // If there's an existing featured image, remove it from storage tracking
      if (formData.featuredImage && (formData.featuredImage.includes('edgestore') || formData.featuredImage.includes('files.edgestore.dev'))) {
        try {
          await edgestore.images.delete({ url: formData.featuredImage });
          await removeFileUpload(formData.featuredImage);
        } catch (error) {
          console.warn('Failed to delete old featured image:', error);
        }
      }

      const res = await edgestore.images.upload({
        file,
        onProgressChange: (progress) => {
          console.log('Upload progress:', progress);
        },
      });
      
      // Record the upload in our storage tracking
      const recorded = await recordFileUpload(
        res.url,
        file.name,
        file.size,
        'blog',
        post?.id
      );

      if (!recorded) {
        console.warn('Failed to record file upload, but continuing...');
      }
      
      setFormData(prev => ({ ...prev, featuredImage: res.url }));
      setSaveMessage('Ảnh đã được tải lên thành công!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Upload failed:', error);
      setSaveMessage('Lỗi khi tải ảnh lên');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    
    const tagName = newTag.toLowerCase().trim();
    
    // Check if tag already exists
    const existingTag = availableTags.find(tag => tag.name === tagName);
    
    if (!existingTag) {
      try {
        const newTagObj = await createBlogTag(tagName, tagColor);
        if (newTagObj) {
          setAvailableTags(prev => [...prev, newTagObj]);
        }
      } catch (error) {
        console.error('Error creating tag:', error);
      }
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

  const handleSave = async () => {
    if (!validateForm() || !user || isSaving) return;

    try {
      setIsSaving(true);
      let savedPost: BlogPost | null = null;
      
      if (post) {
        savedPost = await updateBlogPost(post.id, {
          title: formData.title,
          content: formData.content,
          featuredImage: formData.featuredImage || undefined,
          customIcon: formData.customIcon || undefined,
          tags: formData.tags,
          status: formData.status,
          titleFont: formData.titleFont || undefined,
          contentFont: formData.contentFont || undefined
        });
      } else {
        savedPost = await createBlogPost({
          title: formData.title,
          content: formData.content,
          featuredImage: formData.featuredImage || undefined,
          customIcon: formData.customIcon || undefined,
          tags: formData.tags,
          status: formData.status,
          author: user.name,
          authorId: user.id,
          authorAvatar: user.image || '',
          titleFont: formData.titleFont || undefined,
          contentFont: formData.contentFont || undefined
        });
      }
      
      if (savedPost) {
        setSaveMessage(post ? 'Bài viết đã được cập nhật!' : 'Bài viết đã được tạo!');
        const postToReturn = savedPost; // ensure non-null for TypeScript
        setTimeout(() => {
          onSave(postToReturn);
        }, 1000);
      } else {
        setSaveMessage('Có lỗi xảy ra khi lưu bài viết');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error saving post:', error);
      setSaveMessage('Có lỗi xảy ra khi lưu bài viết');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const getSelectedIcon = () => {
    const selected = iconOptions.find(option => option.name === formData.customIcon);
    return selected ? selected.icon : FileText;
  };

  const getFontClass = (fontValue: string) => {
    const font = fontOptions.find(f => f.value === fontValue);
    return font ? font.className : 'font-cormorant';
  };

  const SelectedIcon = getSelectedIcon();

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Bạn cần đăng nhập để tạo bài viết</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Storage Indicator */}
      <StorageIndicator 
        showDetails={false}
        onStorageUpdate={setStorageInfo}
      />

      {/* Success/Error Messages */}
      {saveMessage && (
        <Alert className={saveMessage.includes('Lỗi') || saveMessage.includes('không được') || saveMessage.includes('Không đủ') ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
          {saveMessage.includes('Lỗi') || saveMessage.includes('không được') || saveMessage.includes('Không đủ') ? (
            <AlertCircle className="h-4 w-4 text-red-500" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
          <AlertDescription className={saveMessage.includes('Lỗi') || saveMessage.includes('không được') || saveMessage.includes('Không đủ') ? 'text-red-700' : 'text-green-700'}>
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
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-[#93E1D8] hover:bg-[#93E1D8]/90"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Đang lưu...' : (post ? 'Cập nhật' : 'Lưu')}
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
                className={`text-lg form-element ${getFontClass(formData.titleFont)} ${errors.title ? 'border-red-500' : ''}`}
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
                className={`resize-none text-base leading-relaxed form-element ${getFontClass(formData.contentFont)} ${errors.content ? 'border-red-500' : ''}`}
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

          {/* Font Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Phông chữ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title-font">Font tiêu đề</Label>
                <select
                  id="title-font"
                  value={formData.titleFont}
                  onChange={(e) => setFormData(prev => ({ ...prev, titleFont: e.target.value }))}
                  className="w-full mt-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#93E1D8] focus:border-transparent form-element"
                >
                  {fontOptions.map(font => (
                    <option key={font.value} value={font.value} className={font.className}>
                      {font.label}
                    </option>
                  ))}
                </select>
                {formData.titleFont && (
                  <div className={`mt-2 p-2 bg-gray-50 rounded text-sm ${getFontClass(formData.titleFont)}`}>
                    Xem trước: Tiêu đề với font này
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="content-font">Font nội dung</Label>
                <select
                  id="content-font"
                  value={formData.contentFont}
                  onChange={(e) => setFormData(prev => ({ ...prev, contentFont: e.target.value }))}
                  className="w-full mt-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#93E1D8] focus:border-transparent form-element"
                >
                  {fontOptions.map(font => (
                    <option key={font.value} value={font.value} className={font.className}>
                      {font.label}
                    </option>
                  ))}
                </select>
                {formData.contentFont && (
                  <div className={`mt-2 p-2 bg-gray-50 rounded text-sm ${getFontClass(formData.contentFont)}`}>
                    Xem trước: Nội dung với font này sẽ hiển thị như thế này.
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
              {/* File Size Limit Info */}
              <Alert className="border-blue-200 bg-blue-50">
                <FileImage className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-blue-700">
                  <strong>Giới hạn:</strong> Tối đa {formatBytes(MAX_FILE_SIZE)} mỗi ảnh
                </AlertDescription>
              </Alert>

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
                disabled={isUploading || storageInfo?.remaining === 0}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Đang tải...' : (storageInfo?.remaining === 0 ? 'Hết dung lượng' : 'Tải ảnh lên')}
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
                    className="flex-1 form-element"
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-md">
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
                <h1 className={`text-3xl font-light ${getFontClass(formData.titleFont)}`}>
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
                className={`text-gray-700 leading-relaxed space-y-6 ${getFontClass(formData.contentFont)}`}
                style={{ 
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