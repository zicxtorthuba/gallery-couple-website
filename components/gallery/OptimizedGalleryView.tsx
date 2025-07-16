"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OptimizedImage, GalleryImage, ThumbnailImage } from '@/components/ui/optimized-image';
import { OptimizationDashboard } from '@/components/ui/optimization-dashboard';
import { 
  Heart, 
  Eye, 
  Download, 
  Edit3, 
  Star,
  Trash2,
  Tag,
  BarChart3,
  Zap
} from 'lucide-react';
import { type GalleryImage as GalleryImageType } from '@/lib/gallery-supabase';

interface OptimizedGalleryViewProps {
  images: GalleryImageType[];
  favoriteImages: Set<string>;
  likedImages: Set<string>;
  currentUser: any;
  onImageSelect: (image: GalleryImageType) => void;
  onLike: (imageId: string) => void;
  onFavorite: (imageId: string) => void;
  onDownload: (imageUrl: string, imageName: string) => void;
  onEdit: (image: GalleryImageType) => void;
  onDelete: (image: GalleryImageType) => void;
  onTagClick: (tag: string) => void;
}

export function OptimizedGalleryView({
  images,
  favoriteImages,
  likedImages,
  currentUser,
  onImageSelect,
  onLike,
  onFavorite,
  onDownload,
  onEdit,
  onDelete,
  onTagClick
}: OptimizedGalleryViewProps) {
  const [viewMode, setViewMode] = useState<'optimized' | 'original'>('optimized');
  const [showStats, setShowStats] = useState(false);

  return (
    <div className="space-y-6">
      {/* View Controls */}
      <div className="flex items-center justify-between bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border-white/50">
        <div className="flex items-center gap-4">
          <h3 className="font-medium">Gallery View</h3>
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
            <TabsList>
              <TabsTrigger value="optimized" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Optimized
              </TabsTrigger>
              <TabsTrigger value="original">Original</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <Button
          variant="outline"
          onClick={() => setShowStats(!showStats)}
          className="flex items-center gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          {showStats ? 'Hide Stats' : 'Show Stats'}
        </Button>
      </div>

      {/* Optimization Dashboard */}
      {showStats && (
        <OptimizationDashboard 
          images={images}
          className="mb-6"
        />
      )}

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {images.map((image) => (
          <div 
            key={image.id}
            className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300 border-white/50"
          >
            <div className="relative aspect-square overflow-hidden">
              {viewMode === 'optimized' ? (
                <GalleryImage
                  src={image.url}
                  alt={image.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  showOptimizationStats={true}
                />
              ) : (
                <img
                  src={image.url}
                  alt={image.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex gap-2 flex-wrap justify-center">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onImageSelect(image)}
                    className="bg-white/90 hover:bg-white"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onLike(image.id)}
                    className={`bg-white/90 hover:bg-white ${
                      likedImages.has(image.id) ? 'text-red-500' : ''
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${likedImages.has(image.id) ? 'fill-current' : ''}`} />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onFavorite(image.id)}
                    disabled={!currentUser}
                    className={`bg-white/90 hover:bg-white ${
                      favoriteImages.has(image.id) ? 'text-yellow-500' : ''
                    }`}
                  >
                    <Star className={`h-4 w-4 ${favoriteImages.has(image.id) ? 'fill-current' : ''}`} />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onDownload(image.url, image.title)}
                    className="bg-white/90 hover:bg-white"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {currentUser && currentUser.id === image.authorId && (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onEdit(image)}
                        className="bg-white/90 hover:bg-white"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onDelete(image)}
                        className="bg-white/90 hover:bg-white text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Favorite indicator */}
              {favoriteImages.has(image.id) && (
                <div className="absolute top-2 right-2">
                  <Star className="h-5 w-5 text-yellow-500 fill-current" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="font-medium text-sm mb-1 line-clamp-1">{image.title}</h3>
              {image.description && (
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                  {image.description}
                </p>
              )}
              <div className="flex flex-wrap gap-1 mb-2">
                {image.tags.slice(0, 2).map(tag => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="text-xs cursor-pointer hover:bg-[#93E1D8]/20"
                    onClick={() => onTagClick(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
                {image.tags.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{image.tags.length - 2}
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span>@{image.author}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    <span>{image.likes}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {favoriteImages.has(image.id) && (
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                  )}
                  {viewMode === 'optimized' && (
                    <Badge variant="outline" className="text-xs">
                      <Zap className="h-2 w-2 mr-1" />
                      Optimized
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Summary */}
      {images.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="h-6 w-6 text-blue-500" />
            <h3 className="font-medium text-lg">Optimization Benefits</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">70%</div>
              <div className="text-sm text-muted-foreground">Average Size Reduction</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">3x</div>
              <div className="text-sm text-muted-foreground">Faster Loading</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">Auto</div>
              <div className="text-sm text-muted-foreground">Format Optimization</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}