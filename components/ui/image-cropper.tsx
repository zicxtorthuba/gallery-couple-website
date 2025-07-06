"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  RotateCcw, 
  Check, 
  X, 
  Crop,
  Square,
  Maximize,
  Monitor,
  Smartphone
} from 'lucide-react';

interface ImageCropperProps {
  imageUrl: string;
  onCropComplete: (croppedImageUrl: string) => void;
  onCancel: () => void;
  aspectRatios?: { label: string; value: number | null; icon?: any }[];
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function ImageCropper({ 
  imageUrl, 
  onCropComplete, 
  onCancel,
  aspectRatios = [
    { label: 'Tự do', value: null, icon: Crop },
    { label: 'Vuông (1:1)', value: 1, icon: Square },
    { label: 'Ngang (16:9)', value: 16/9, icon: Monitor },
    { label: 'Dọc (9:16)', value: 9/16, icon: Smartphone },
    { label: 'Ngang (4:3)', value: 4/3, icon: Maximize },
    { label: 'Dọc (3:4)', value: 3/4, icon: Maximize }
  ]
}: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<number | null>(null);
  const [cropArea, setCropArea] = useState<CropArea>({ x: 50, y: 50, width: 200, height: 200 });
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 400 });

  // Load and setup image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (imageRef.current) {
        imageRef.current = img;
        setIsLoaded(true);
        
        // Calculate initial canvas size and image scale
        const containerWidth = containerRef.current?.clientWidth || 600;
        const maxWidth = Math.min(containerWidth - 40, 800);
        const maxHeight = 500;
        
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        
        setCanvasSize({ width: scaledWidth, height: scaledHeight });
        setImageScale(scale);
        
        // Center initial crop area
        const initialCropSize = Math.min(scaledWidth, scaledHeight) * 0.6;
        setCropArea({
          x: (scaledWidth - initialCropSize) / 2,
          y: (scaledHeight - initialCropSize) / 2,
          width: initialCropSize,
          height: initialCropSize
        });
        
        drawCanvas();
      }
    };
    img.src = imageUrl;
    imageRef.current = img;
  }, [imageUrl]);

  // Redraw canvas when crop area or aspect ratio changes
  useEffect(() => {
    if (isLoaded) {
      drawCanvas();
    }
  }, [cropArea, selectedAspectRatio, isLoaded]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image
    ctx.drawImage(img, 0, 0, canvasSize.width, canvasSize.height);

    // Draw overlay (darken non-crop area)
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

    // Draw corner handles
    const handleSize = 8;
    ctx.fillStyle = '#93E1D8';
    const corners = [
      { x: cropArea.x - handleSize/2, y: cropArea.y - handleSize/2 },
      { x: cropArea.x + cropArea.width - handleSize/2, y: cropArea.y - handleSize/2 },
      { x: cropArea.x - handleSize/2, y: cropArea.y + cropArea.height - handleSize/2 },
      { x: cropArea.x + cropArea.width - handleSize/2, y: cropArea.y + cropArea.height - handleSize/2 }
    ];
    
    corners.forEach(corner => {
      ctx.fillRect(corner.x, corner.y, handleSize, handleSize);
    });

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 3; i++) {
      const x = cropArea.x + (cropArea.width / 3) * i;
      const y = cropArea.y + (cropArea.height / 3) * i;
      
      ctx.beginPath();
      ctx.moveTo(x, cropArea.y);
      ctx.lineTo(x, cropArea.y + cropArea.height);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(cropArea.x, y);
      ctx.lineTo(cropArea.x + cropArea.width, y);
      ctx.stroke();
    }
  }, [cropArea, canvasSize]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDragging(true);
    setDragStart({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const deltaX = x - dragStart.x;
    const deltaY = y - dragStart.y;

    setCropArea(prev => {
      let newX = Math.max(0, Math.min(prev.x + deltaX, canvasSize.width - prev.width));
      let newY = Math.max(0, Math.min(prev.y + deltaY, canvasSize.height - prev.height));
      
      return {
        ...prev,
        x: newX,
        y: newY
      };
    });

    setDragStart({ x, y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleAspectRatioChange = (ratio: number | null) => {
    setSelectedAspectRatio(ratio);
    
    if (ratio) {
      setCropArea(prev => {
        const centerX = prev.x + prev.width / 2;
        const centerY = prev.y + prev.height / 2;
        
        let newWidth = prev.width;
        let newHeight = prev.width / ratio;
        
        // Adjust if height exceeds canvas
        if (newHeight > canvasSize.height) {
          newHeight = canvasSize.height * 0.8;
          newWidth = newHeight * ratio;
        }
        
        // Adjust if width exceeds canvas
        if (newWidth > canvasSize.width) {
          newWidth = canvasSize.width * 0.8;
          newHeight = newWidth / ratio;
        }
        
        return {
          x: Math.max(0, Math.min(centerX - newWidth / 2, canvasSize.width - newWidth)),
          y: Math.max(0, Math.min(centerY - newHeight / 2, canvasSize.height - newHeight)),
          width: newWidth,
          height: newHeight
        };
      });
    }
  };

  const handleCropSizeChange = (dimension: 'width' | 'height', value: number) => {
    setCropArea(prev => {
      const maxSize = dimension === 'width' ? canvasSize.width : canvasSize.height;
      const newValue = Math.max(50, Math.min(value, maxSize));
      
      if (selectedAspectRatio) {
        if (dimension === 'width') {
          const newHeight = newValue / selectedAspectRatio;
          return {
            ...prev,
            width: newValue,
            height: Math.min(newHeight, canvasSize.height),
            x: Math.max(0, Math.min(prev.x, canvasSize.width - newValue)),
            y: Math.max(0, Math.min(prev.y, canvasSize.height - newHeight))
          };
        } else {
          const newWidth = newValue * selectedAspectRatio;
          return {
            ...prev,
            width: Math.min(newWidth, canvasSize.width),
            height: newValue,
            x: Math.max(0, Math.min(prev.x, canvasSize.width - newWidth)),
            y: Math.max(0, Math.min(prev.y, canvasSize.height - newValue))
          };
        }
      } else {
        return {
          ...prev,
          [dimension]: newValue,
          x: dimension === 'width' ? Math.max(0, Math.min(prev.x, canvasSize.width - newValue)) : prev.x,
          y: dimension === 'height' ? Math.max(0, Math.min(prev.y, canvasSize.height - newValue)) : prev.y
        };
      }
    });
  };

  const resetCrop = () => {
    const initialCropSize = Math.min(canvasSize.width, canvasSize.height) * 0.6;
    setCropArea({
      x: (canvasSize.width - initialCropSize) / 2,
      y: (canvasSize.height - initialCropSize) / 2,
      width: initialCropSize,
      height: initialCropSize
    });
    setSelectedAspectRatio(null);
  };

  const applyCrop = async () => {
    const img = imageRef.current;
    if (!img) return;

    // Create a new canvas for the cropped image
    const cropCanvas = document.createElement('canvas');
    const cropCtx = cropCanvas.getContext('2d');
    if (!cropCtx) return;

    // Calculate the actual crop coordinates on the original image
    const scaleX = img.width / canvasSize.width;
    const scaleY = img.height / canvasSize.height;
    
    const actualCrop = {
      x: cropArea.x * scaleX,
      y: cropArea.y * scaleY,
      width: cropArea.width * scaleX,
      height: cropArea.height * scaleY
    };

    cropCanvas.width = actualCrop.width;
    cropCanvas.height = actualCrop.height;

    // Draw the cropped portion
    cropCtx.drawImage(
      img,
      actualCrop.x, actualCrop.y, actualCrop.width, actualCrop.height,
      0, 0, actualCrop.width, actualCrop.height
    );

    // Convert to blob and create URL
    cropCanvas.toBlob((blob) => {
      if (blob) {
        const croppedUrl = URL.createObjectURL(blob);
        onCropComplete(croppedUrl);
      }
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="space-y-6">
      {/* Aspect Ratio Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tỷ lệ khung hình</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {aspectRatios.map((ratio) => {
              const IconComponent = ratio.icon || Crop;
              return (
                <Button
                  key={ratio.label}
                  variant={selectedAspectRatio === ratio.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleAspectRatioChange(ratio.value)}
                  className="flex items-center gap-2"
                >
                  <IconComponent className="h-4 w-4" />
                  {ratio.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Crop Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Điều chỉnh vùng cắt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Chiều rộng: {Math.round(cropArea.width)}px</Label>
              <Slider
                value={[cropArea.width]}
                onValueChange={([value]) => handleCropSizeChange('width', value)}
                max={canvasSize.width}
                min={50}
                step={1}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Chiều cao: {Math.round(cropArea.height)}px</Label>
              <Slider
                value={[cropArea.height]}
                onValueChange={([value]) => handleCropSizeChange('height', value)}
                max={canvasSize.height}
                min={50}
                step={1}
                className="mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Canvas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Xem trước</CardTitle>
        </CardHeader>
        <CardContent>
          <div ref={containerRef} className="flex justify-center">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="border border-gray-300 rounded-lg cursor-move"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Kéo để di chuyển vùng cắt. Sử dụng thanh trượt để điều chỉnh kích thước.
          </p>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={resetCrop}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Đặt lại
        </Button>
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Hủy
        </Button>
        <Button onClick={applyCrop} className="bg-[#93E1D8] hover:bg-[#93E1D8]/90">
          <Check className="h-4 w-4 mr-2" />
          Áp dụng
        </Button>
      </div>
    </div>
  );
}