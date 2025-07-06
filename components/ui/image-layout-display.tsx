"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Edit3, Trash2 } from 'lucide-react';
import type { CropSettings } from './image-cropper';

interface ImageLayoutDisplayProps {
  imageUrl: string;
  cropSettings: CropSettings;
  content: string;
  onEdit?: () => void;
  onDelete?: () => void;
  editable?: boolean;
  className?: string;
}

export function ImageLayoutDisplay({ 
  imageUrl, 
  cropSettings, 
  content, 
  onEdit, 
  onDelete, 
  editable = false,
  className = ""
}: ImageLayoutDisplayProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  if (cropSettings.layout === 'horizontal') {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Horizontal Layout - Image on top, content below */}
        <div className="relative group">
          <div className="relative w-full h-64 md:h-80 overflow-hidden rounded-xl">
            <Image
              src={imageUrl}
              alt="Blog image"
              fill
              sizes="(max-width: 768px) 100vw, 80vw"
              className="object-cover transition-opacity duration-300"
              onLoad={() => setImageLoaded(true)}
              style={{ opacity: imageLoaded ? 1 : 0 }}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-xl" />
            )}
          </div>
          
          {editable && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex gap-2">
                {onEdit && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={onEdit}
                    className="bg-white/90 hover:bg-white"
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={onDelete}
                    className="bg-white/90 hover:bg-white text-red-500"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
        
        {content && (
          <div className="prose prose-lg max-w-none">
            <div 
              className="text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        )}
      </div>
    );
  }

  // Vertical Layout - Image and content side by side
  const isImageLeft = cropSettings.imagePosition === 'left';
  
  return (
    <div className={`${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Image Column */}
        <div className={`relative group ${isImageLeft ? 'md:order-1' : 'md:order-2'}`}>
          <div className="relative w-full h-64 md:h-96 overflow-hidden rounded-xl">
            <Image
              src={imageUrl}
              alt="Blog image"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-opacity duration-300"
              onLoad={() => setImageLoaded(true)}
              style={{ opacity: imageLoaded ? 1 : 0 }}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-xl" />
            )}
          </div>
          
          {editable && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex gap-2">
                {onEdit && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={onEdit}
                    className="bg-white/90 hover:bg-white"
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={onDelete}
                    className="bg-white/90 hover:bg-white text-red-500"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Content Column */}
        {content && (
          <div className={`${isImageLeft ? 'md:order-2' : 'md:order-1'}`}>
            <div className="prose prose-lg max-w-none">
              <div 
                className="text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}