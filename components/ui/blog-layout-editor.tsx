"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  Image as ImageIcon, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Move,
  Crop,
  Trash2,
  Eye,
  Save,
  X,
  Undo,
  Redo,
  Plus,
  Settings,
  Layout,
  Type,
  Palette,
  FileImage
} from 'lucide-react';
import { useEdgeStore } from '@/lib/edgestore';
import { ImageCropper } from './image-cropper';
import { 
  isFileSizeValid, 
  hasStorageSpace, 
  recordFileUpload,
  formatBytes,
  MAX_FILE_SIZE
} from '@/lib/storage';

interface LayoutImage {
  id: string;
  url: string;
  alt: string;
  width: number;
  height: number;
  x: number;
  y: number;
  alignment: 'left' | 'center' | 'right';
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  textWrap: boolean;
  zIndex: number;
}

interface HistoryState {
  images: LayoutImage[];
  content: string;
}

interface BlogLayoutEditorProps {
  initialContent?: string;
  onSave: (htmlContent: string, images: LayoutImage[]) => void;
  onCancel: () => void;
}

export function BlogLayoutEditor({ initialContent = '', onSave, onCancel }: BlogLayoutEditorProps) {
  const [images, setImages] = useState<LayoutImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [content, setContent] = useState(initialContent);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showPreview, setShowPreview] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [cropImageUrl, setCropImageUrl] = useState('');
  const [cropImageId, setCropImageId] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  
  // History management
  const [history, setHistory] = useState<HistoryState[]>([{ images: [], content: initialContent }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  const { edgestore } = useEdgeStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Save state to history
  const saveToHistory = useCallback((newImages: LayoutImage[], newContent: string) => {
    const newState = { images: newImages, content: newContent };
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
      const newIndex = historyIndex - 1;
      const state = history[newIndex];
      setImages(state.images);
      setContent(state.content);
      setHistoryIndex(newIndex);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const state = history[newIndex];
      setImages(state.images);
      setContent(state.content);
      setHistoryIndex(newIndex);
    }
  };

  // File upload validation
  const validateFile = async (file: File): Promise<string | null> => {
    if (!file.type.startsWith('image/')) {
      return 'Vui lòng chọn file ảnh hợp lệ (JPEG, PNG, WebP)';
    }

    if (!isFileSizeValid(file)) {
      return `Kích thước file không được vượt quá ${formatBytes(MAX_FILE_SIZE)}`;
    }

    const hasSpace = await hasStorageSpace(file.size);
    if (!hasSpace) {
      return 'Không đủ dung lượng lưu trữ. Vui lòng xóa một số ảnh để giải phóng không gian.';
    }

    return null;
  };

  // Handle file upload
  const handleFileUpload = async (files: FileList) => {
    const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length === 0) {
      setMessage('Không có file ảnh hợp lệ nào được chọn');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setIsUploading(true);
    const newImages: LayoutImage[] = [];

    try {
      for (const file of validFiles) {
        const validationError = await validateFile(file);
        if (validationError) {
          setMessage(validationError);
          setTimeout(() => setMessage(''), 5000);
          continue;
        }

        // Upload to EdgeStore
        const res = await edgestore.images.upload({
          file,
          onProgressChange: (progress) => {
            console.log('Upload progress:', progress);
          },
        });

        // Record in storage tracking
        await recordFileUpload(
          res.url,
          file.name,
          file.size,
          'blog'
        );

        // Create image object
        const img = new Image();
        img.onload = () => {
          const newImage: LayoutImage = {
            id: `img-${Date.now()}-${Math.random()}`,
            url: res.url,
            alt: file.name,
            width: Math.min(img.width, 400),
            height: (Math.min(img.width, 400) / img.width) * img.height,
            x: 50 + newImages.length * 20,
            y: 50 + newImages.length * 20,
            alignment: 'center',
            marginTop: 16,
            marginBottom: 16,
            marginLeft: 16,
            marginRight: 16,
            textWrap: true,
            zIndex: newImages.length
          };
          
          newImages.push(newImage);
          
          if (newImages.length === validFiles.length) {
            const updatedImages = [...images, ...newImages];
            setImages(updatedImages);
            saveToHistory(updatedImages, content);
            setMessage(`Đã tải lên ${newImages.length} ảnh thành công!`);
            setTimeout(() => setMessage(''), 3000);
          }
        };
        img.src = res.url;
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setMessage('Lỗi khi tải ảnh lên');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle drag and drop
  const handleMouseDown = (e: React.MouseEvent, imageId: string) => {
    e.preventDefault();
    const image = images.find(img => img.id === imageId);
    if (!image) return;

    setSelectedImageId(imageId);
    setIsDragging(true);
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedImageId || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const newX = e.clientX - canvasRect.left - dragOffset.x;
    const newY = e.clientY - canvasRect.top - dragOffset.y;

    const updatedImages = images.map(img =>
      img.id === selectedImageId
        ? { ...img, x: Math.max(0, newX), y: Math.max(0, newY) }
        : img
    );
    
    setImages(updatedImages);
  };

  const handleMouseUp = () => {
    if (isDragging) {
      saveToHistory(images, content);
    }
    setIsDragging(false);
  };

  // Update selected image properties
  const updateImageProperty = (property: keyof LayoutImage, value: any) => {
    if (!selectedImageId) return;

    const updatedImages = images.map(img =>
      img.id === selectedImageId ? { ...img, [property]: value } : img
    );
    
    setImages(updatedImages);
    saveToHistory(updatedImages, content);
  };

  // Delete image
  const deleteImage = (imageId: string) => {
    const updatedImages = images.filter(img => img.id !== imageId);
    setImages(updatedImages);
    saveToHistory(updatedImages, content);
    setSelectedImageId(null);
  };

  // Crop image
  const handleCropImage = (imageId: string) => {
    const image = images.find(img => img.id === imageId);
    if (!image) return;
    
    setCropImageId(imageId);
    setCropImageUrl(image.url);
    setShowCropper(true);
  };

  const handleCropComplete = (croppedUrl: string) => {
    const updatedImages = images.map(img =>
      img.id === cropImageId ? { ...img, url: croppedUrl } : img
    );
    
    setImages(updatedImages);
    saveToHistory(updatedImages, content);
    setShowCropper(false);
    setCropImageId('');
    setCropImageUrl('');
  };

  // Generate HTML output
  const generateHTML = () => {
    let html = content;
    
    // Insert images into content based on their positions
    const sortedImages = [...images].sort((a, b) => a.zIndex - b.zIndex);
    
    sortedImages.forEach(image => {
      const imageHtml = `
        <div style="
          display: ${image.alignment === 'center' ? 'flex' : 'block'};
          justify-content: ${image.alignment === 'center' ? 'center' : image.alignment};
          text-align: ${image.alignment};
          margin: ${image.marginTop}px ${image.marginRight}px ${image.marginBottom}px ${image.marginLeft}px;
          ${image.textWrap ? 'float: ' + (image.alignment === 'right' ? 'right' : 'left') + ';' : ''}
        ">
          <img 
            src="${image.url}" 
            alt="${image.alt}"
            style="
              width: ${image.width}px;
              height: ${image.height}px;
              max-width: 100%;
              height: auto;
              border-radius: 8px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            "
          />
        </div>
      `;
      
      // Insert at the beginning for now (can be improved with position-based insertion)
      html = imageHtml + html;
    });
    
    return html;
  };

  // Handle save
  const handleSave = () => {
    const htmlContent = generateHTML();
    onSave(htmlContent, images);
  };

  const selectedImage = selectedImageId ? images.find(img => img.id === selectedImageId) : null;

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="font-cormorant text-2xl font-light">Trình chỉnh sửa bố cục</h2>
            
            {/* Undo/Redo */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={undo}
                disabled={historyIndex <= 0}
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
              >
                <Redo className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowPreview(true)}>
              <Eye className="h-4 w-4 mr-2" />
              Xem trước
            </Button>
            <Button onClick={handleSave} className="bg-[#93E1D8] hover:bg-[#93E1D8]/90">
              <Save className="h-4 w-4 mr-2" />
              Lưu
            </Button>
            <Button variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Hủy
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <Alert className={`mx-4 mt-4 ${message.includes('Lỗi') || message.includes('không được') || message.includes('Không đủ') ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
          <AlertDescription className={message.includes('Lỗi') || message.includes('không được') || message.includes('Không đủ') ? 'text-red-700' : 'text-green-700'}>
            {message}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Toolbar */}
        <div className="w-80 border-r bg-gray-50 overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Tải ảnh lên
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className="border-blue-200 bg-blue-50 mb-4">
                  <FileImage className="h-4 w-4 text-blue-500" />
                  <AlertDescription className="text-blue-700">
                    <strong>Hỗ trợ:</strong> JPEG, PNG, WebP. Tối đa {formatBytes(MAX_FILE_SIZE)} mỗi ảnh
                  </AlertDescription>
                </Alert>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  className="hidden"
                />
                
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {isUploading ? 'Đang tải...' : 'Tải ảnh lên'}
                </Button>
              </CardContent>
            </Card>

            {/* Image Properties */}
            {selectedImage && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Thuộc tính ảnh
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Alignment */}
                  <div>
                    <Label className="text-sm font-medium">Căn chỉnh</Label>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant={selectedImage.alignment === 'left' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateImageProperty('alignment', 'left')}
                      >
                        <AlignLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={selectedImage.alignment === 'center' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateImageProperty('alignment', 'center')}
                      >
                        <AlignCenter className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={selectedImage.alignment === 'right' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateImageProperty('alignment', 'right')}
                      >
                        <AlignRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Size */}
                  <div>
                    <Label className="text-sm font-medium">Chiều rộng: {selectedImage.width}px</Label>
                    <Slider
                      value={[selectedImage.width]}
                      onValueChange={(value) => {
                        const newWidth = value[0];
                        const aspectRatio = selectedImage.width / selectedImage.height;
                        const newHeight = newWidth / aspectRatio;
                        updateImageProperty('width', newWidth);
                        updateImageProperty('height', newHeight);
                      }}
                      min={100}
                      max={800}
                      step={10}
                      className="mt-2"
                    />
                  </div>

                  {/* Margins */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Lề trên: {selectedImage.marginTop}px</Label>
                      <Slider
                        value={[selectedImage.marginTop]}
                        onValueChange={(value) => updateImageProperty('marginTop', value[0])}
                        min={0}
                        max={100}
                        step={4}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Lề dưới: {selectedImage.marginBottom}px</Label>
                      <Slider
                        value={[selectedImage.marginBottom]}
                        onValueChange={(value) => updateImageProperty('marginBottom', value[0])}
                        min={0}
                        max={100}
                        step={4}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Lề trái: {selectedImage.marginLeft}px</Label>
                      <Slider
                        value={[selectedImage.marginLeft]}
                        onValueChange={(value) => updateImageProperty('marginLeft', value[0])}
                        min={0}
                        max={100}
                        step={4}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Lề phải: {selectedImage.marginRight}px</Label>
                      <Slider
                        value={[selectedImage.marginRight]}
                        onValueChange={(value) => updateImageProperty('marginRight', value[0])}
                        min={0}
                        max={100}
                        step={4}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Text Wrap */}
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Bao quanh văn bản</Label>
                    <Button
                      variant={selectedImage.textWrap ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateImageProperty('textWrap', !selectedImage.textWrap)}
                    >
                      {selectedImage.textWrap ? 'Bật' : 'Tắt'}
                    </Button>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCropImage(selectedImage.id)}
                      className="flex-1"
                    >
                      <Crop className="h-4 w-4 mr-1" />
                      Cắt
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteImage(selectedImage.id)}
                      className="text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Content Editor */}
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
                    saveToHistory(images, e.target.value);
                  }}
                  placeholder="Nhập nội dung bài viết..."
                  rows={8}
                  className="resize-none"
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto bg-white">
          <div
            ref={canvasRef}
            className="relative min-h-full p-8"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Images */}
            {images.map((image) => (
              <div
                key={image.id}
                className={`absolute cursor-move border-2 rounded-lg overflow-hidden transition-all ${
                  selectedImageId === image.id 
                    ? 'border-[#93E1D8] shadow-lg' 
                    : 'border-transparent hover:border-gray-300'
                }`}
                style={{
                  left: image.x,
                  top: image.y,
                  width: image.width,
                  height: image.height,
                  zIndex: image.zIndex
                }}
                onMouseDown={(e) => handleMouseDown(e, image.id)}
                onClick={() => setSelectedImageId(image.id)}
              >
                <img
                  src={image.url}
                  alt={image.alt}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
                
                {/* Selection indicator */}
                {selectedImageId === image.id && (
                  <div className="absolute inset-0 bg-[#93E1D8]/20 border-2 border-[#93E1D8] pointer-events-none">
                    <div className="absolute -top-6 left-0 bg-[#93E1D8] text-white text-xs px-2 py-1 rounded">
                      {image.alt}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Drop zone when no images */}
            {images.length === 0 && (
              <div className="flex items-center justify-center h-96 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">
                    Chưa có ảnh nào
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Tải ảnh lên để bắt đầu tạo bố cục
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tải ảnh đầu tiên
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Xem trước bố cục</DialogTitle>
          </DialogHeader>
          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: generateHTML() }}
          />
        </DialogContent>
      </Dialog>

      {/* Image Cropper Modal */}
      <Dialog open={showCropper} onOpenChange={setShowCropper}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cắt ảnh</DialogTitle>
          </DialogHeader>
          {cropImageUrl && (
            <ImageCropper
              imageUrl={cropImageUrl}
              onCrop={handleCropComplete}
              onCancel={() => setShowCropper(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}