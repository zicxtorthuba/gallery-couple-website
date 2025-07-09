"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  ImageIcon, 
  Check,
  X,
  Filter
} from 'lucide-react';
import { getGalleryImages, type GalleryImage } from '@/lib/gallery-supabase';

interface GalleryImageSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selectedImages: GalleryImage[]) => void;
  preSelectedImages?: GalleryImage[];
}

export function GalleryImageSelector({ 
  isOpen, 
  onClose, 
  onSelect, 
  preSelectedImages = [] 
}: GalleryImageSelectorProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [filteredImages, setFilteredImages] = useState<GalleryImage[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (isOpen && !wasOpen.current) {
      loadImages();
      // Pre-select images if provided
      const preSelectedIds = new Set(preSelectedImages.map(img => img.id));
      setSelectedImages(preSelectedIds);
    }
    wasOpen.current = isOpen;
  }, [isOpen, preSelectedImages]);

  useEffect(() => {
    filterImages();
  }, [images, searchTerm, selectedCategory]);

  const loadImages = async () => {
    try {
      setLoading(true);
      // Get only non-album images from gallery
      const galleryImages = await getGalleryImages(true);
      setImages(galleryImages);
      
      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(galleryImages.map(img => img.category).filter(Boolean))
      );
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error loading gallery images:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterImages = () => {
    let filtered = images;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(img =>
        img.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        img.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        img.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(img => img.category === selectedCategory);
    }

    setFilteredImages(filtered);
  };

  const toggleImageSelection = (imageId: string) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(imageId)) {
      newSelected.delete(imageId);
    } else {
      newSelected.add(imageId);
    }
    setSelectedImages(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedImages.size === filteredImages.length) {
      // Deselect all
      setSelectedImages(new Set());
    } else {
      // Select all filtered images
      const allIds = new Set(filteredImages.map(img => img.id));
      setSelectedImages(allIds);
    }
  };

  const handleConfirm = () => {
    const selectedImageObjects = images.filter(img => selectedImages.has(img.id));
    onSelect(selectedImageObjects);
    onClose();
  };

  const handleCancel = () => {
    // Reset to pre-selected images
    const preSelectedIds = new Set(preSelectedImages.map(img => img.id));
    setSelectedImages(preSelectedIds);
    onClose();
  };

  const categoriesWithAll = ['all', ...categories];

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden bg-white/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Chọn ảnh từ thư viện ({selectedImages.size} đã chọn)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm ảnh..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#93E1D8] focus:border-transparent"
            >
              {categoriesWithAll.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'Tất cả danh mục' : category}
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              onClick={handleSelectAll}
              disabled={filteredImages.length === 0}
            >
              {selectedImages.size === filteredImages.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </Button>
          </div>

          {/* Selected count and info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Filter className="h-4 w-4" />
                <span>{filteredImages.length} ảnh</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="h-4 w-4" />
                <span>{selectedImages.size} đã chọn</span>
              </div>
            </div>
          </div>

          {/* Images Grid */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#93E1D8]"></div>
              </div>
            ) : filteredImages.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredImages.map((image) => {
                  const isSelected = selectedImages.has(image.id);
                  return (
                    <div
                      key={image.id}
                      className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                        isSelected 
                          ? 'border-[#93E1D8] ring-2 ring-[#93E1D8]/20' 
                          : 'border-transparent hover:border-gray-300'
                      }`}
                      onClick={() => toggleImageSelection(image.id)}
                    >
                      <div className="relative aspect-square">
                        <Image
                          src={image.url}
                          alt={image.title}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                          className="object-cover"
                        />
                        
                        {/* Selection overlay */}
                        <div className={`absolute inset-0 transition-all duration-200 ${
                          isSelected 
                            ? 'bg-[#93E1D8]/20' 
                            : 'bg-black/0 group-hover:bg-black/10'
                        }`} />
                        
                        {/* Checkbox */}
                        <div className="absolute top-2 right-2">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                            isSelected 
                              ? 'bg-[#93E1D8] border-[#93E1D8]' 
                              : 'bg-white/90 border-gray-300 group-hover:border-[#93E1D8]'
                          }`}>
                            {isSelected && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Image info */}
                      <div className="p-2">
                        <h4 className="text-xs font-medium line-clamp-1">{image.title}</h4>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-muted-foreground">@{image.author}</span>
                          {image.tags.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {image.tags[0]}
                              {image.tags.length > 1 && ` +${image.tags.length - 1}`}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty State */
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-[#93E1D8]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="h-8 w-8 text-[#93E1D8]" />
                </div>
                <h3 className="font-medium mb-2">
                  {searchTerm || selectedCategory !== 'all'
                    ? 'Không tìm thấy ảnh nào'
                    : 'Chưa có ảnh trong thư viện'
                  }
                </h3>
                <p className="text-muted-foreground text-sm">
                  {searchTerm || selectedCategory !== 'all'
                    ? 'Thử thay đổi bộ lọc để tìm ảnh khác'
                    : 'Hãy tải ảnh lên thư viện trước khi thêm vào album'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Hủy
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={selectedImages.size === 0}
              className="bg-[#93E1D8] hover:bg-[#93E1D8]/90"
            >
              <Check className="h-4 w-4 mr-2" />
              Chọn {selectedImages.size} ảnh
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}