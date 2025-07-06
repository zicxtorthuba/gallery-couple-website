"use client";

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Crop, RotateCcw, Download, Upload, Move, ZoomIn, ZoomOut, Square, RectangleEllipsis as Rectangle, Scissors } from 'lucide-react';

interface ImageCropperProps {
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedImageUrl: string, cropSettings: CropSettings) => void;
  initialImage?: string;
}

export interface CropSettings {
  layout: 'horizontal' | 'vertical';
  imagePosition?: 'left' | 'right'; // for vertical layout
  cropArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  zoom: number;
  rotation: number;
}

export function ImageCropper({ isOpen, onClose, onCropComplete, initialImage }: ImageCropperProps) {
  const [image, setImage] = useState<string | null>(initialImage || null);
  const [cropSettings, setCropSettings] = useState<CropSettings>({
    layout: 'horizontal',
    imagePosition: 'left',
    cropArea: { x: 0, y: 0, width: 100, height: 100 },
    zoom: 1,
    rotation: 0
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh hợp lệ');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    setCropSettings(prev => ({
      ...prev,
      cropArea: {
        ...prev.cropArea,
        x: Math.max(0, Math.min(100 - prev.cropArea.width, prev.cropArea.x + deltaX * 0.1)),
        y: Math.max(0, Math.min(100 - prev.cropArea.height, prev.cropArea.y + deltaY * 0.1))
      }
    }));

    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const cropImage = async (): Promise<string> => {
    if (!image || !canvasRef.current || !imageRef.current) return '';

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const img = imageRef.current;
    
    // Set canvas size based on layout
    if (cropSettings.layout === 'horizontal') {
      canvas.width = 800;
      canvas.height = 400;
    } else {
      canvas.width = 600;
      canvas.height = 800;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate crop dimensions
    const cropX = (cropSettings.cropArea.x / 100) * img.naturalWidth;
    const cropY = (cropSettings.cropArea.y / 100) * img.naturalHeight;
    const cropWidth = (cropSettings.cropArea.width / 100) * img.naturalWidth;
    const cropHeight = (cropSettings.cropArea.height / 100) * img.naturalHeight;

    // Apply transformations
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((cropSettings.rotation * Math.PI) / 180);
    ctx.scale(cropSettings.zoom, cropSettings.zoom);

    // Draw cropped image
    ctx.drawImage(
      img,
      cropX, cropY, cropWidth, cropHeight,
      -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height
    );

    ctx.restore();

    return canvas.toDataURL('image/jpeg', 0.9);
  };

  const handleCropComplete = async () => {
    const croppedImageUrl = await cropImage();
    if (croppedImageUrl) {
      onCropComplete(croppedImageUrl, cropSettings);
      onClose();
    }
  };

  const resetCrop = () => {
    setCropSettings({
      layout: 'horizontal',
      imagePosition: 'left',
      cropArea: { x: 0, y: 0, width: 100, height: 100 },
      zoom: 1,
      rotation: 0
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5" />
            Cắt và chỉnh sửa ảnh
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Section */}
          {!image && (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-[#93E1D8] hover:bg-[#93E1D8]/90"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Tải ảnh lên
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    Chọn ảnh để bắt đầu cắt và chỉnh sửa
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {image && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Preview Area */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Xem trước</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      {/* Original Image */}
                      <div className="relative overflow-hidden rounded-lg border-2 border-dashed border-gray-300">
                        <img
                          ref={imageRef}
                          src={image}
                          alt="Original"
                          className="w-full h-auto max-h-96 object-contain"
                          crossOrigin="anonymous"
                        />
                        
                        {/* Crop Overlay */}
                        <div
                          className="absolute border-2 border-[#93E1D8] bg-[#93E1D8]/20 cursor-move"
                          style={{
                            left: `${cropSettings.cropArea.x}%`,
                            top: `${cropSettings.cropArea.y}%`,
                            width: `${cropSettings.cropArea.width}%`,
                            height: `${cropSettings.cropArea.height}%`,
                          }}
                          onMouseDown={handleMouseDown}
                        >
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Move className="h-6 w-6 text-[#93E1D8]" />
                          </div>
                        </div>
                      </div>

                      {/* Layout Preview */}
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2">Xem trước bố cục:</h4>
                        {cropSettings.layout === 'horizontal' ? (
                          <div className="w-full h-32 bg-white rounded border flex items-center justify-center">
                            <div className="w-full h-full bg-[#93E1D8]/20 rounded flex items-center justify-center">
                              <span className="text-sm text-gray-600">Ảnh ngang</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-4 h-32">
                            {cropSettings.imagePosition === 'left' ? (
                              <>
                                <div className="w-1/2 bg-[#93E1D8]/20 rounded flex items-center justify-center">
                                  <span className="text-sm text-gray-600">Ảnh</span>
                                </div>
                                <div className="w-1/2 bg-white border rounded flex items-center justify-center">
                                  <span className="text-sm text-gray-600">Nội dung</span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="w-1/2 bg-white border rounded flex items-center justify-center">
                                  <span className="text-sm text-gray-600">Nội dung</span>
                                </div>
                                <div className="w-1/2 bg-[#93E1D8]/20 rounded flex items-center justify-center">
                                  <span className="text-sm text-gray-600">Ảnh</span>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Controls */}
              <div className="space-y-4">
                {/* Layout Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Bố cục</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Kiểu hiển thị</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <Button
                          variant={cropSettings.layout === 'horizontal' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCropSettings(prev => ({ ...prev, layout: 'horizontal' }))}
                          className="flex items-center gap-2"
                        >
                          <Rectangle className="h-4 w-4" />
                          Ngang
                        </Button>
                        <Button
                          variant={cropSettings.layout === 'vertical' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCropSettings(prev => ({ ...prev, layout: 'vertical' }))}
                          className="flex items-center gap-2"
                        >
                          <Square className="h-4 w-4" />
                          Dọc
                        </Button>
                      </div>
                    </div>

                    {cropSettings.layout === 'vertical' && (
                      <div>
                        <Label>Vị trí ảnh</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <Button
                            variant={cropSettings.imagePosition === 'left' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCropSettings(prev => ({ ...prev, imagePosition: 'left' }))}
                          >
                            Trái
                          </Button>
                          <Button
                            variant={cropSettings.imagePosition === 'right' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCropSettings(prev => ({ ...prev, imagePosition: 'right' }))}
                          >
                            Phải
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Crop Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Cài đặt cắt</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Thu phóng: {cropSettings.zoom.toFixed(1)}x</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <ZoomOut className="h-4 w-4" />
                        <Slider
                          value={[cropSettings.zoom]}
                          onValueChange={([value]) => setCropSettings(prev => ({ ...prev, zoom: value }))}
                          min={0.5}
                          max={3}
                          step={0.1}
                          className="flex-1"
                        />
                        <ZoomIn className="h-4 w-4" />
                      </div>
                    </div>

                    <div>
                      <Label>Xoay: {cropSettings.rotation}°</Label>
                      <Slider
                        value={[cropSettings.rotation]}
                        onValueChange={([value]) => setCropSettings(prev => ({ ...prev, rotation: value }))}
                        min={-180}
                        max={180}
                        step={15}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>Kích thước vùng cắt</Label>
                      <div className="space-y-2 mt-2">
                        <div>
                          <Label className="text-sm">Chiều rộng: {cropSettings.cropArea.width}%</Label>
                          <Slider
                            value={[cropSettings.cropArea.width]}
                            onValueChange={([value]) => setCropSettings(prev => ({
                              ...prev,
                              cropArea: { ...prev.cropArea, width: value }
                            }))}
                            min={10}
                            max={100}
                            step={5}
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Chiều cao: {cropSettings.cropArea.height}%</Label>
                          <Slider
                            value={[cropSettings.cropArea.height]}
                            onValueChange={([value]) => setCropSettings(prev => ({
                              ...prev,
                              cropArea: { ...prev.cropArea, height: value }
                            }))}
                            min={10}
                            max={100}
                            step={5}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="space-y-2">
                  <Button
                    onClick={resetCrop}
                    variant="outline"
                    className="w-full"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Đặt lại
                  </Button>
                  
                  <Button
                    onClick={handleCropComplete}
                    className="w-full bg-[#93E1D8] hover:bg-[#93E1D8]/90"
                  >
                    <Crop className="h-4 w-4 mr-2" />
                    Áp dụng cắt
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Hidden Canvas for Processing */}
          <canvas
            ref={canvasRef}
            className="hidden"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}