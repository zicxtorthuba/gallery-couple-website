"use client";

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { 
  Crop, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Move, 
  Check, 
  X,
  Info,
  Image as ImageIcon
} from 'lucide-react';

interface ImageCropperProps {
  file: File;
  onCropComplete: (croppedFile: File) => void;
  onCancel: () => void;
  aspectRatio?: number; // width/height ratio, e.g., 16/9, 1 for square
  maxWidth?: number;
  maxHeight?: number;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function ImageCropper({ 
  file, 
  onCropComplete, 
  onCancel, 
  aspectRatio = 1, // Default to square
  maxWidth = 1200,
  maxHeight = 1200
}: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [scale, setScale] = useState([100]);
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 200, height: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Load image when component mounts
  useState(() => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  });

  const handleImageLoad = useCallback(() => {
    if (!imageRef.current) return;
    
    const img = imageRef.current;
    const containerWidth = 400;
    const containerHeight = 300;
    
    // Calculate initial crop area (centered)
    const cropSize = Math.min(containerWidth, containerHeight) * 0.6;
    const cropWidth = aspectRatio >= 1 ? cropSize : cropSize * aspectRatio;
    const cropHeight = aspectRatio >= 1 ? cropSize / aspectRatio : cropSize;
    
    setCropArea({
      x: (containerWidth - cropWidth) / 2,
      y: (containerHeight - cropHeight) / 2,
      width: cropWidth,
      height: cropHeight
    });
    
    setImageLoaded(true);
  }, [aspectRatio]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - cropArea.x,
      y: e.clientY - cropArea.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Keep crop area within bounds
    const maxX = 400 - cropArea.width;
    const maxY = 300 - cropArea.height;
    
    setCropArea(prev => ({
      ...prev,
      x: Math.max(0, Math.min(maxX, newX)),
      y: Math.max(0, Math.min(maxY, newY))
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const cropImage = async () => {
    if (!imageRef.current || !canvasRef.current) return;
    
    setProcessing(true);
    
    try {
      const img = imageRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;
      
      // Calculate scale factors
      const scaleX = img.naturalWidth / img.width;
      const scaleY = img.naturalHeight / img.height;
      const currentScale = scale[0] / 100;
      
      // Calculate crop dimensions in original image coordinates
      const cropX = cropArea.x * scaleX / currentScale;
      const cropY = cropArea.y * scaleY / currentScale;
      const cropWidth = cropArea.width * scaleX / currentScale;
      const cropHeight = cropArea.height * scaleY / currentScale;
      
      // Set canvas size to desired output size
      const outputWidth = Math.min(cropWidth, maxWidth);
      const outputHeight = Math.min(cropHeight, maxHeight);
      
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      
      // Draw cropped image
      ctx.drawImage(
        img,
        cropX, cropY, cropWidth, cropHeight,
        0, 0, outputWidth, outputHeight
      );
      
      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob) {
          const croppedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          });
          onCropComplete(croppedFile);
        }
      }, file.type, 0.9);
      
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setProcessing(false);
    }
  };

  const getRecommendedResolution = () => {
    if (aspectRatio === 1) return "1080x1080 (Instagram vuông)";
    if (aspectRatio === 16/9) return "1920x1080 (Widescreen)";
    if (aspectRatio === 4/3) return "1600x1200 (Cổ điển)";
    if (aspectRatio === 3/2) return "1800x1200 (Máy ảnh)";
    return "1200x1200 (Tùy chỉnh)";
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crop className="h-5 w-5" />
          Cắt ảnh
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Resolution Recommendation */}
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-blue-700">
            <div className="space-y-2">
              <p><strong>Khuyến nghị độ phân giải:</strong></p>
              <ul className="text-sm space-y-1">
                <li>• <strong>Vuông (1:1):</strong> 1080x1080px - Tốt nhất cho Instagram, avatar</li>
                <li>• <strong>Ngang (16:9):</strong> 1920x1080px - Tốt cho banner, cover photo</li>
                <li>• <strong>Dọc (9:16):</strong> 1080x1920px - Tốt cho Stories, TikTok</li>
                <li>• <strong>Cổ điển (4:3):</strong> 1600x1200px - Cân bằng tốt</li>
              </ul>
              <p className="text-xs mt-2">
                <strong>Hiện tại:</strong> {getRecommendedResolution()}
              </p>
            </div>
          </AlertDescription>
        </Alert>

        {/* Image Preview with Crop Area */}
        <div className="relative">
          <div 
            className="relative w-full h-80 bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {imageUrl && (
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Preview"
                className="w-full h-full object-contain"
                style={{ transform: `scale(${scale[0] / 100})` }}
                onLoad={handleImageLoad}
                draggable={false}
              />
            )}
            
            {/* Crop Area Overlay */}
            {imageLoaded && (
              <>
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-50 pointer-events-none" />
                
                {/* Crop area */}
                <div
                  className="absolute border-2 border-white shadow-lg cursor-move bg-transparent"
                  style={{
                    left: cropArea.x,
                    top: cropArea.y,
                    width: cropArea.width,
                    height: cropArea.height,
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
                  }}
                  onMouseDown={handleMouseDown}
                >
                  {/* Corner handles */}
                  <div className="absolute -top-1 -left-1 w-3 h-3 bg-white border border-gray-400 rounded-full" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-white border border-gray-400 rounded-full" />
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border border-gray-400 rounded-full" />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border border-gray-400 rounded-full" />
                  
                  {/* Center icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Move className="h-6 w-6 text-white drop-shadow-lg" />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {/* Zoom Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Zoom</label>
              <span className="text-sm text-muted-foreground">{scale[0]}%</span>
            </div>
            <div className="flex items-center gap-3">
              <ZoomOut className="h-4 w-4 text-muted-foreground" />
              <Slider
                value={scale}
                onValueChange={setScale}
                min={50}
                max={200}
                step={10}
                className="flex-1"
              />
              <ZoomIn className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Quick Aspect Ratio Buttons */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tỷ lệ khung hình</label>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={aspectRatio === 1 ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const size = Math.min(cropArea.width, cropArea.height);
                  setCropArea(prev => ({ ...prev, width: size, height: size }));
                }}
              >
                1:1 Vuông
              </Button>
              <Button
                variant={aspectRatio === 16/9 ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const height = cropArea.width * 9 / 16;
                  setCropArea(prev => ({ ...prev, height }));
                }}
              >
                16:9 Ngang
              </Button>
              <Button
                variant={aspectRatio === 4/3 ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const height = cropArea.width * 3 / 4;
                  setCropArea(prev => ({ ...prev, height }));
                }}
              >
                4:3 Cổ điển
              </Button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={cropImage}
            disabled={!imageLoaded || processing}
            className="flex-1 bg-[#93E1D8] hover:bg-[#93E1D8]/90"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Áp dụng cắt ảnh
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={processing}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            Hủy
          </Button>
        </div>

        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
    </Card>
  );
}