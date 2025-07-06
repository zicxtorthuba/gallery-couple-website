"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Image as ImageIcon, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Move,
  Trash2,
  Edit3,
  Undo,
  Redo,
  Save,
  Eye,
  Plus,
  Settings,
  Type,
  Crop
} from 'lucide-react';
import { ImageCropper } from './image-cropper';
import { useEdgeStore } from '@/lib/edgestore';
import { 
  isFileSizeValid, 
  hasStorageSpace, 
  recordFileUpload,
  formatBytes,
  MAX_FILE_SIZE 
} from '@/lib/storage';

interface BlogImage {
  id: string;
  url: string;
  alt: string;
  width: number;
  height: number;
  alignment: 'left' | 'center' | 'right';
  wrapText: boolean;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  position: { x: number; y: number };
  size: number;
}

interface BlogLayoutEditorProps {
  initialContent?: string;
  initialImages?: BlogImage[];
  onSave: (content: string, images: BlogImage[]) => void;
  onCancel: () => void;
}

interface HistoryState {
  content: string;
  images: BlogImage[];
}

export function BlogLayoutEditor({ 
  initialContent = '', 
  initialImages = [], 
  onSave, 
  onCancel 
}: BlogLayoutEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [images, setImages] = useState<BlogImage[]>(initialImages);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showPreview, setShowPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [cropImage, setCropImage] = useState<{ url: string; id: string } | null>(null);
  
  // History for undo/redo
  const [history, setHistory] = useState<HistoryState[]>([{ content: initialContent, images: initialImages }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const { edgestore } = useEdgeStore();

  // Save state to history
  const saveToHistory = useCallback((newContent: string, newImages: BlogImage[]) => {
    const newState = { content: newContent, images: [...newImages] };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    
    // Limit history to 50 states
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(prev => prev + 1);
    }
    
    setHistory(newHistory);
  }, [history, historyIndex]);

  // Undo/Redo functions
  const undo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setContent(prevState.content);
      setImages(prevState.images);
      setHistoryIndex(prev => prev - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setContent(nextState.content);
      setImages(nextState.images);
      setHistoryIndex(prev => prev + 1);
    }
  };

  // Handle file upload
  const handleFileUpload = async (files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) return false;
      if (!isFileSizeValid(file)) return false;
      return ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
    });

    if (validFiles.length === 0) {
      alert('Vui lòng chọn file ảnh hợp lệ (JPEG, PNG, WebP) và không quá ' + formatBytes(MAX_FILE_SIZE));
      return;
    }

    setIsUploading(true);

    try {
      const uploadPromises = validFiles.map(async (file) => {
        // Check storage space
        const hasSpace = await hasStorageSpace(file.size);
        if (!hasSpace) {
          throw new Error('Không đủ dung lượng lưu trữ');
        }

        // Upload to EdgeStore
        const res = await edgestore.images.upload({
          file,
          onProgressChange: (progress) => {
            console.log('Upload progress:', progress);
          },
        });

        // Record upload
        await recordFileUpload(res.url, file.name, file.size, 'blog');

        // Create image object
        const img = new Image();
        img.src = res.url;
        
        return new Promise<BlogImage>((resolve) => {
          img.onload = () => {
            const newImage: BlogImage = {
              id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              url: res.url,
              alt: file.name.replace(/\.[^/.]+$/, ''),
              width: Math.min(img.width, 600),
              height: (Math.min(img.width, 600) / img.width) * img.height,
              alignment: 'center',
              wrapText: false,
              marginTop: 16,
              marginBottom: 16,
              marginLeft: 0,
              marginRight: 0,
              position: { x: 0, y: images.length * 100 },
              size: file.size
            };
            resolve(newImage);
          };
        });
      });

      const newImages = await Promise.all(uploadPromises);
      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      saveToHistory(content, updatedImages);
      
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Lỗi khi tải ảnh lên: ' + (error as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle drag and drop
  const handleDragStart = (e: React.MouseEvent, imageId: string) => {
    const image = images.find(img => img.id === imageId);
    if (!image) return;

    setSelectedImage(imageId);
    setIsDragging(true);
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !selectedImage || !editorRef.current) return;

    const editorRect = editorRef.current.getBoundingClientRect();
    const newX = e.clientX - editorRect.left - dragOffset.x;
    const newY = e.clientY - editorRect.top - dragOffset.y;

    setImages(prev => prev.map(img => 
      img.id === selectedImage 
        ? { ...img, position: { x: Math.max(0, newX), y: Math.max(0, newY) } }
        : img
    ));
  }, [isDragging, selectedImage, dragOffset]);

  const handleDragEnd = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      saveToHistory(content, images);
    }
  }, [isDragging, content, images, saveToHistory]);

  // Add event listeners for drag
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Update image properties
  const updateImage = (imageId: string, updates: Partial<BlogImage>) => {
    const updatedImages = images.map(img => 
      img.id === imageId ? { ...img, ...updates } : img
    );
    setImages(updatedImages);
    saveToHistory(content, updatedImages);
  };

  // Delete image
  const deleteImage = (imageId: string) => {
    const updatedImages = images.filter(img => img.id !== imageId);
    setImages(updatedImages);
    setSelectedImage(null);
    saveToHistory(content, updatedImages);
  };

  // Handle crop completion
  const handleCropComplete = (croppedUrl: string) => {
    if (cropImage) {
      updateImage(cropImage.id, { url: croppedUrl });
      setCropImage(null);
    }
  };

  // Generate final HTML
  const generateHTML = () => {
    let html = content;
    
    // Insert images at their positions
    images.forEach(image => {
      const alignmentClass = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right'
      }[image.alignment];

      const wrapClass = image.wrapText ? 'float-left mr-4 mb-4' : 'block';
      
      const imageHTML = `
        <div class="${alignmentClass}" style="margin: ${image.marginTop}px ${image.marginRight}px ${image.marginBottom}px ${image.marginLeft}px;">
          <img 
            src="${image.url}" 
            alt="${image.alt}"
            width="${image.width}"
            height="${image.height}"
            class="${wrapClass} rounded-lg shadow-sm"
            style="max-width: 100%; height: auto;"
          />
        </div>
      `;
      
      html += imageHTML;
    });

    return html;
  };

  const selectedImageData = selectedImage ? images.find(img => img.id === selectedImage) : null;

  if (cropImage) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-cormorant font-light">Cắt ảnh</h2>
          <Button variant="outline" onClick={() => setCropImage(null)}>
            Hủy
          </Button>
        </div>
        <ImageCropper
          imageUrl={cropImage.url}
          onCropComplete={handleCropComplete}
          onCancel={() => setCropImage(null)}
        />
      </div>
    );
  }

  if (showPreview) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-cormorant font-light">Xem trước</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              <Edit3 className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </Button>
            <Button onClick={() => onSave(generateHTML(), images)} className="bg-[#93E1D8] hover:bg-[#93E1D8]/90">
              <Save className="h-4 w-4 mr-2" />
              Lưu
            </Button>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-8">
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: generateHTML() }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-cormorant font-light">Trình chỉnh sửa bố cục</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={undo} 
            disabled={historyIndex === 0}
            size="sm"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            onClick={redo} 
            disabled={historyIndex === history.length - 1}
            size="sm"
          >
            <Redo className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Xem trước
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Hủy
          </Button>
          <Button onClick={() => onSave(generateHTML(), images)} className="bg-[#93E1D8] hover:bg-[#93E1D8]/90">
            <Save className="h-4 w-4 mr-2" />
            Lưu
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Toolbar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Upload Images */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Ảnh
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                className="hidden"
              />
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full"
                variant="outline"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Đang tải...' : 'Tải ảnh lên'}
              </Button>

              <div className="text-xs text-muted-foreground">
                Hỗ trợ: JPEG, PNG, WebP<br />
                Tối đa: {formatBytes(MAX_FILE_SIZE)}
              </div>
            </CardContent>
          </Card>

          {/* Image Properties */}
          {selectedImageData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Thuộc tính ảnh
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Văn bản thay thế</Label>
                  <Input
                    value={selectedImageData.alt}
                    onChange={(e) => updateImage(selectedImageData.id, { alt: e.target.value })}
                    placeholder="Mô tả ảnh..."
                  />
                </div>

                <div>
                  <Label>Căn chỉnh</Label>
                  <div className="flex gap-1 mt-1">
                    {[
                      { value: 'left', icon: AlignLeft },
                      { value: 'center', icon: AlignCenter },
                      { value: 'right', icon: AlignRight }
                    ].map(({ value, icon: Icon }) => (
                      <Button
                        key={value}
                        variant={selectedImageData.alignment === value ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateImage(selectedImageData.id, { alignment: value as any })}
                      >
                        <Icon className="h-4 w-4" />
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Kích thước</Label>
                  <div className="space-y-2 mt-1">
                    <div>
                      <Label className="text-xs">Chiều rộng: {selectedImageData.width}px</Label>
                      <Slider
                        value={[selectedImageData.width]}
                        onValueChange={([width]) => {
                          const ratio = selectedImageData.height / selectedImageData.width;
                          updateImage(selectedImageData.id, { 
                            width, 
                            height: width * ratio 
                          });
                        }}
                        max={800}
                        min={100}
                        step={10}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Khoảng cách (px)</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <Label className="text-xs">Trên</Label>
                      <Input
                        type="number"
                        value={selectedImageData.marginTop}
                        onChange={(e) => updateImage(selectedImageData.id, { marginTop: Number(e.target.value) })}
                        min="0"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Dưới</Label>
                      <Input
                        type="number"
                        value={selectedImageData.marginBottom}
                        onChange={(e) => updateImage(selectedImageData.id, { marginBottom: Number(e.target.value) })}
                        min="0"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Trái</Label>
                      <Input
                        type="number"
                        value={selectedImageData.marginLeft}
                        onChange={(e) => updateImage(selectedImageData.id, { marginLeft: Number(e.target.value) })}
                        min="0"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Phải</Label>
                      <Input
                        type="number"
                        value={selectedImageData.marginRight}
                        onChange={(e) => updateImage(selectedImageData.id, { marginRight: Number(e.target.value) })}
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCropImage({ url: selectedImageData.url, id: selectedImageData.id })}
                  >
                    <Crop className="h-4 w-4 mr-1" />
                    Cắt
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteImage(selectedImageData.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Xóa
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Images List */}
          {images.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Danh sách ảnh</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {images.map((image) => (
                    <div
                      key={image.id}
                      className={`p-2 border rounded cursor-pointer transition-colors ${
                        selectedImage === image.id ? 'border-[#93E1D8] bg-[#93E1D8]/10' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedImage(image.id)}
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={image.url}
                          alt={image.alt}
                          className="w-10 h-10 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{image.alt}</p>
                          <p className="text-xs text-muted-foreground">
                            {image.width} × {image.height}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Editor */}
        <div className="lg:col-span-3 space-y-4">
          {/* Text Content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Type className="h-5 w-5" />
                Nội dung văn bản
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  saveToHistory(e.target.value, images);
                }}
                placeholder="Nhập nội dung bài viết của bạn..."
                rows={10}
                className="resize-none"
              />
            </CardContent>
          </Card>

          {/* Visual Editor */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Move className="h-5 w-5" />
                Bố cục trực quan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                ref={editorRef}
                className="relative min-h-96 border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50"
                style={{ minHeight: '400px' }}
              >
                {images.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Kéo thả ảnh vào đây hoặc sử dụng nút tải lên</p>
                    </div>
                  </div>
                ) : (
                  images.map((image) => (
                    <div
                      key={image.id}
                      className={`absolute cursor-move border-2 rounded-lg overflow-hidden transition-all ${
                        selectedImage === image.id 
                          ? 'border-[#93E1D8] shadow-lg' 
                          : 'border-transparent hover:border-gray-300'
                      }`}
                      style={{
                        left: image.position.x,
                        top: image.position.y,
                        width: image.width,
                        height: image.height
                      }}
                      onMouseDown={(e) => handleDragStart(e, image.id)}
                    >
                      <img
                        src={image.url}
                        alt={image.alt}
                        className="w-full h-full object-cover"
                        draggable={false}
                      />
                      {selectedImage === image.id && (
                        <div className="absolute top-1 right-1 flex gap-1">
                          <Badge variant="secondary" className="text-xs">
                            {image.alignment}
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Nhấp để chọn ảnh, kéo để di chuyển. Sử dụng bảng điều khiển bên trái để chỉnh sửa thuộc tính.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}