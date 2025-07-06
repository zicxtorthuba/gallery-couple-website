"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Crop, 
  RotateCcw, 
  Check, 
  X,
  Move,
  Square,
  Maximize
} from 'lucide-react';

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCropperProps {
  imageUrl: string;
  onCrop: (croppedImageUrl: string) => void;
  onCancel: () => void;
  aspectRatio?: number | null; // null for free form
}

const ASPECT_RATIOS = [
  { label: 'Tự do', value: null },
  { label: '1:1', value: 1 },
  { label: '16:9', value: 16/9 },
  { label: '4:3', value: 4/3 },
  { label: '9:16', value: 9/16 },
  { label: '3:4', value: 3/4 },
];

export function ImageCropper({ imageUrl, onCrop, onCancel, aspectRatio: initialAspectRatio }: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [aspectRatio, setAspectRatio] = useState<number | null>(initialAspectRatio || null);
  const [imageData, setImageData] = useState<{
    img: HTMLImageElement;
    scale: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  
  const [cropArea, setCropArea] = useState<CropArea>({
    x: 50,
    y: 50,
    width: 200,
    height: 200
  });

  const [cropControls, setCropControls] = useState({
    width: 200,
    height: 200
  });

  // Load and setup image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      setIsLoaded(true);
      
      // Calculate initial canvas size and image scale
      const container = containerRef.current;
      if (!container) return;
      
      const containerWidth = container.clientWidth;
      const containerHeight = 400; // Fixed height for canvas
      
      const scale = Math.min(
        containerWidth / img.width,
        containerHeight / img.height,
        1 // Don't scale up
      );
      
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const offsetX = (containerWidth - scaledWidth) / 2;
      const offsetY = (containerHeight - scaledHeight) / 2;
      
      setImageData({
        img,
        scale,
        offsetX,
        offsetY
      });
      
      // Set initial crop area
      const initialCropSize = Math.min(scaledWidth, scaledHeight) * 0.6;
      const initialCrop = {
        x: offsetX + (scaledWidth - initialCropSize) / 2,
        y: offsetY + (scaledHeight - initialCropSize) / 2,
        width: initialCropSize,
        height: aspectRatio ? initialCropSize / aspectRatio : initialCropSize
      };
      
      setCropArea(initialCrop);
      setCropControls({
        width: initialCrop.width,
        height: initialCrop.height
      });
    };
    
    img.onerror = () => {
      console.error('Failed to load image');
    };
    
    img.src = imageUrl;
  }, [imageUrl, aspectRatio]);

  // Draw canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageData) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { img, scale, offsetX, offsetY } = imageData;
    
    // Set canvas size
    canvas.width = containerRef.current?.clientWidth || 600;
    canvas.height = 400;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw image
    ctx.drawImage(
      img,
      offsetX,
      offsetY,
      img.width * scale,
      img.height * scale
    );
    
    // Draw crop overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Clear crop area
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
    
    // Draw crop border
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#93E1D8';
    ctx.lineWidth = 2;
    ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
    
    // Draw grid lines
    ctx.strokeStyle = 'rgba(147, 225, 216, 0.5)';
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let i = 1; i < 3; i++) {
      const x = cropArea.x + (cropArea.width / 3) * i;
      ctx.beginPath();
      ctx.moveTo(x, cropArea.y);
      ctx.lineTo(x, cropArea.y + cropArea.height);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let i = 1; i < 3; i++) {
      const y = cropArea.y + (cropArea.height / 3) * i;
      ctx.beginPath();
      ctx.moveTo(cropArea.x, y);
      ctx.lineTo(cropArea.x + cropArea.width, y);
      ctx.stroke();
    }
    
    // Draw corner handles
    const handleSize = 8;
    ctx.fillStyle = '#93E1D8';
    
    // Top-left
    ctx.fillRect(cropArea.x - handleSize/2, cropArea.y - handleSize/2, handleSize, handleSize);
    // Top-right
    ctx.fillRect(cropArea.x + cropArea.width - handleSize/2, cropArea.y - handleSize/2, handleSize, handleSize);
    // Bottom-left
    ctx.fillRect(cropArea.x - handleSize/2, cropArea.y + cropArea.height - handleSize/2, handleSize, handleSize);
    // Bottom-right
    ctx.fillRect(cropArea.x + cropArea.width - handleSize/2, cropArea.y + cropArea.height - handleSize/2, handleSize, handleSize);
  }, [imageData, cropArea]);

  // Redraw when crop area changes
  useEffect(() => {
    if (isLoaded) {
      drawCanvas();
    }
  }, [isLoaded, drawCanvas]);

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if click is inside crop area
    if (
      x >= cropArea.x && 
      x <= cropArea.x + cropArea.width &&
      y >= cropArea.y && 
      y <= cropArea.y + cropArea.height
    ) {
      setIsDragging(true);
      setDragStart({ x: x - cropArea.x, y: y - cropArea.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    
    const canvas = canvasRef.current;
    if (!canvas || !imageData) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newX = Math.max(imageData.offsetX, Math.min(x - dragStart.x, imageData.offsetX + imageData.img.width * imageData.scale - cropArea.width));
    const newY = Math.max(imageData.offsetY, Math.min(y - dragStart.y, imageData.offsetY + imageData.img.height * imageData.scale - cropArea.height));
    
    setCropArea(prev => ({
      ...prev,
      x: newX,
      y: newY
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle crop controls
  const handleWidthChange = (value: number[]) => {
    const newWidth = value[0];
    let newHeight = aspectRatio ? newWidth / aspectRatio : cropControls.height;
    
    if (imageData) {
      const maxWidth = imageData.img.width * imageData.scale;
      const maxHeight = imageData.img.height * imageData.scale;
      
      if (newWidth > maxWidth) return;
      if (newHeight > maxHeight) {
        newHeight = maxHeight;
        if (aspectRatio) {
          return; // Can't maintain aspect ratio
        }
      }
    }
    
    setCropControls({ width: newWidth, height: newHeight });
    setCropArea(prev => ({
      ...prev,
      width: newWidth,
      height: newHeight
    }));
  };

  const handleHeightChange = (value: number[]) => {
    if (aspectRatio) return; // Height is controlled by aspect ratio
    
    const newHeight = value[0];
    
    if (imageData) {
      const maxHeight = imageData.img.height * imageData.scale;
      if (newHeight > maxHeight) return;
    }
    
    setCropControls(prev => ({ ...prev, height: newHeight }));
    setCropArea(prev => ({
      ...prev,
      height: newHeight
    }));
  };

  const handleAspectRatioChange = (newRatio: number | null) => {
    setAspectRatio(newRatio);
    
    if (newRatio) {
      const newHeight = cropControls.width / newRatio;
      setCropControls(prev => ({ ...prev, height: newHeight }));
      setCropArea(prev => ({
        ...prev,
        height: newHeight
      }));
    }
  };

  const handleReset = () => {
    if (!imageData) return;
    
    const initialCropSize = Math.min(
      imageData.img.width * imageData.scale,
      imageData.img.height * imageData.scale
    ) * 0.6;
    
    const initialCrop = {
      x: imageData.offsetX + (imageData.img.width * imageData.scale - initialCropSize) / 2,
      y: imageData.offsetY + (imageData.img.height * imageData.scale - initialCropSize) / 2,
      width: initialCropSize,
      height: aspectRatio ? initialCropSize / aspectRatio : initialCropSize
    };
    
    setCropArea(initialCrop);
    setCropControls({
      width: initialCrop.width,
      height: initialCrop.height
    });
  };

  const handleCrop = async () => {
    if (!imageData) return;
    
    const { img, scale, offsetX, offsetY } = imageData;
    
    // Calculate crop coordinates relative to original image
    const cropX = (cropArea.x - offsetX) / scale;
    const cropY = (cropArea.y - offsetY) / scale;
    const cropWidth = cropArea.width / scale;
    const cropHeight = cropArea.height / scale;
    
    // Create canvas for cropped image
    const cropCanvas = document.createElement('canvas');
    const cropCtx = cropCanvas.getContext('2d');
    if (!cropCtx) return;
    
    cropCanvas.width = cropWidth;
    cropCanvas.height = cropHeight;
    
    // Draw cropped portion
    cropCtx.drawImage(
      img,
      cropX, cropY, cropWidth, cropHeight,
      0, 0, cropWidth, cropHeight
    );
    
    // Convert to blob and create URL
    cropCanvas.toBlob((blob) => {
      if (blob) {
        const croppedUrl = URL.createObjectURL(blob);
        onCrop(croppedUrl);
      }
    }, 'image/jpeg', 0.9);
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#93E1D8]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Canvas */}
      <div ref={containerRef} className="relative border rounded-lg overflow-hidden bg-gray-100">
        <canvas
          ref={canvasRef}
          className="w-full cursor-move"
          style={{ height: '400px' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Aspect Ratio */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Square className="h-5 w-5" />
              Tỷ lệ khung hình
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {ASPECT_RATIOS.map((ratio) => (
                <Button
                  key={ratio.label}
                  variant={aspectRatio === ratio.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleAspectRatioChange(ratio.value)}
                  className="text-xs"
                >
                  {ratio.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Size Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Maximize className="h-5 w-5" />
              Kích thước
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Chiều rộng: {Math.round(cropControls.width)}px</Label>
              <Slider
                value={[cropControls.width]}
                onValueChange={handleWidthChange}
                min={50}
                max={imageData ? imageData.img.width * imageData.scale : 400}
                step={1}
                className="mt-2"
              />
            </div>
            
            {!aspectRatio && (
              <div>
                <Label>Chiều cao: {Math.round(cropControls.height)}px</Label>
                <Slider
                  value={[cropControls.height]}
                  onValueChange={handleHeightChange}
                  min={50}
                  max={imageData ? imageData.img.height * imageData.scale : 400}
                  step={1}
                  className="mt-2"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Move className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Hướng dẫn sử dụng:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Kéo vùng cắt để di chuyển vị trí</li>
              <li>• Sử dụng thanh trượt để thay đổi kích thước</li>
              <li>• Chọn tỷ lệ khung hình hoặc để tự do</li>
              <li>• Đường lưới giúp căn chỉnh chính xác</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Đặt lại
        </Button>
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Hủy
        </Button>
        <Button onClick={handleCrop} className="bg-[#93E1D8] hover:bg-[#93E1D8]/90">
          <Check className="h-4 w-4 mr-2" />
          Áp dụng
        </Button>
      </div>
    </div>
  );
}