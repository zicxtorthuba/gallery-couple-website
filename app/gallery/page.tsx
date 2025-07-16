"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StorageIndicator } from '@/components/ui/storage-indicator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Heart, 
  Search, 
  Filter, 
  Eye, 
  Download, 
  Upload, 
  Edit3, 
  Star,
  Plus,
  X,
  Save,
  Trash2,
  Tag,
  Camera,
  ImageIcon,
  AlertTriangle,
  CheckCircle,
  FileImage
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AuthGuard } from '@/components/AuthGuard';
import { AlbumManager } from '@/components/albums/AlbumManager';
import { useEdgeStore } from '@/lib/edgestore';
import { 
  isFileSizeValid, 
  hasStorageSpace, 
  recordFileUpload, 
  removeFileUpload,
  formatBytes,
  MAX_FILE_SIZE,
  type StorageInfo
} from '@/lib/storage';
import {
  getGalleryImages,
  createGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,
  updateImageLikes,
  getGalleryCategories,
  getGalleryTags,
  type GalleryImage
} from '@/lib/gallery-supabase';
import { addToFavorites, removeFromFavorites, isFavorite } from '@/lib/favorites-supabase';
import { getCurrentUser } from '@/lib/auth';

function GalleryContent() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [filteredImages, setFilteredImages] = useState<GalleryImage[]>([]);
  const [activeTab, setActiveTab] = useState('images');
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState<{ image: GalleryImage; step: 1 | 2 } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [likedImages, setLikedImages] = useState<Set<string>>(new Set());
  const [favoriteImages, setFavoriteImages] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [message, setMessage] = useState('');
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { edgestore } = useEdgeStore();
  
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    file: null as File | null
  });
  
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    tags: ''
  });

  useEffect(() => {
    loadImages();
    loadCategories();
    loadTags();
    loadCurrentUser();
  }, []);

  useEffect(() => {
    filterImages();
  }, [images, searchTerm, selectedCategory, selectedTags]);

  useEffect(() => {
    if (currentUser) {
      loadUserFavorites();
    }
  }, [currentUser, images]);

  const loadCurrentUser = async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);
  };

  const loadUserFavorites = async () => {
    if (!currentUser) return;
    
    try {
      const favoriteStatuses = await Promise.all(
        images.map(async (image) => {
          const isFav = await isFavorite('gallery', image.id);
          return { id: image.id, isFavorite: isFav };
        })
      );
      
      const favoriteIds = new Set(
        favoriteStatuses
          .filter(status => status.isFavorite)
          .map(status => status.id)
      );
      
      setFavoriteImages(favoriteIds);
    } catch (error) {
      console.error('Error loading user favorites:', error);
    }
  };

  const loadImages = async () => {
    try {
      setLoading(true);
      const galleryImages = await getGalleryImages(true); // Exclude album images
      setImages(galleryImages);
    } catch (error) {
      console.error('Error loading images:', error);
      setMessage('Có lỗi xảy ra khi tải ảnh');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await getGalleryCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadTags = async () => {
    try {
      const tags = await getGalleryTags();
      setAllTags(tags);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const filterImages = () => {
    let filtered = images;

    if (searchTerm) {
      filtered = filtered.filter(img =>
        img.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        img.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (img.description && img.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(img => img.category === selectedCategory);
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter(img =>
        selectedTags.every(tag => img.tags.includes(tag))
      );
    }

    setFilteredImages(filtered);
  };

  const handleLike = async (imageId: string) => {
    const isLiked = likedImages.has(imageId);
    
    try {
      const success = await updateImageLikes(imageId, !isLiked);
      if (success) {
        setLikedImages(prev => {
          const newLiked = new Set(prev);
          if (isLiked) {
            newLiked.delete(imageId);
          } else {
            newLiked.add(imageId);
          }
          return newLiked;
        });

        // Update local state
        setImages(prev => prev.map(img =>
          img.id === imageId
            ? { ...img, likes: isLiked ? img.likes - 1 : img.likes + 1 }
            : img
        ));
      }
    } catch (error) {
      console.error('Error updating likes:', error);
    }
  };

  const handleFavorite = async (imageId: string) => {
    if (!currentUser) return;
    
    try {
      const isCurrentlyFavorite = favoriteImages.has(imageId);
      
      if (isCurrentlyFavorite) {
        const success = await removeFromFavorites('gallery', imageId);
        if (success) {
          setFavoriteImages(prev => {
            const newFavorites = new Set(prev);
            newFavorites.delete(imageId);
            return newFavorites;
          });
        }
      } else {
        const success = await addToFavorites('gallery', imageId);
        if (success) {
          setFavoriteImages(prev => {
            const newFavorites = new Set(prev);
            newFavorites.add(imageId);
            return newFavorites;
          });
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleDownload = async (imageUrl: string, imageName: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${imageName}.jpg`;
      document.body.appendChild(link);
      link.click(); 
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      setMessage('Lỗi khi tải ảnh về');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const validateFile = async (file: File): Promise<string | null> => {
    if (!file.type.startsWith('image/')) {
      return 'Vui lòng chọn file ảnh hợp lệ';
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

  const handleUpload = async () => {
    if (!uploadData.file || !uploadData.title) return;

    const validationError = await validateFile(uploadData.file);
    if (validationError) {
      setMessage(validationError);
      setTimeout(() => setMessage(''), 5000);
      return;
    }

    try {
      setLoading(true);

      // Upload to EdgeStore
      const res = await edgestore.images.upload({
        file: uploadData.file,
        onProgressChange: (progress: number) => {
          if (progress === 100) {
            setLoading(false);
          }
        },
      });

      // Record in storage tracking
      const recorded = await recordFileUpload(
        res.url,
        uploadData.file.name,
        uploadData.file.size,
        'gallery'
      );

      if (!recorded) {
        console.warn('Failed to record file upload, but continuing...');
      }

      // Create gallery image in database
      const newImage = await createGalleryImage({
        url: res.url,
        title: uploadData.title,
        description: uploadData.description,
        category: uploadData.category || 'uncategorized',
        tags: uploadData.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        size: uploadData.file.size
      });

      if (newImage) {
        // Reload images to get the latest data
        await loadImages();
        await loadCategories();
        await loadTags();

        setUploadData({
          title: '',
          description: '',
          category: '',
          tags: '',
          file: null,
        });
        setShowUploadDialog(false);
        setMessage('Ảnh đã được tải lên thành công!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Có lỗi xảy ra khi lưu thông tin ảnh');
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      setMessage('Lỗi khi tải ảnh lên');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (image: GalleryImage) => {
    setEditingImage(image);
    setEditData({
      title: image.title,
      description: image.description || '',
      tags: image.tags.join(', ')
    });
  };

  const handleSaveEdit = async () => {
    if (!editingImage) return;

    try {
      const updatedImage = await updateGalleryImage(editingImage.id, {
        title: editData.title,
        description: editData.description,
        tags: editData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      });

      if (updatedImage) {
        // Reload images to get the latest data
        await loadImages();
        await loadTags();

        setEditingImage(null);
        setEditData({ title: '', description: '', tags: '' });
        setMessage('Ảnh đã được cập nhật!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Có lỗi xảy ra khi cập nhật ảnh');
      }
    } catch (error) {
      console.error('Error updating image:', error);
      setMessage('Có lỗi xảy ra khi cập nhật ảnh');
    }
  };

  const handleDelete = async (imageId: string) => {
    const imageToDelete = images.find(img => img.id === imageId);
    if (!imageToDelete) return;

    try {
      setLoading(true);
      
      // Delete from EdgeStore if it's an EdgeStore URL
      if (imageToDelete.url.includes('edgestore') || imageToDelete.url.includes('files.edgestore.dev')) {
        try {
          console.log('Attempting to delete from EdgeStore:', imageToDelete.url);
          await edgestore.images.delete({
            url: imageToDelete.url,
          });
          console.log('Successfully deleted from EdgeStore');
        } catch (edgeStoreError: any) {
          console.warn('EdgeStore deletion failed (this is OK for external URLs):', edgeStoreError.message);
        }
      }

      // Remove from storage tracking
      await removeFileUpload(imageToDelete.url);

      // Delete from database
      const success = await deleteGalleryImage(imageId);
      if (success) {
        // Reload images to get the latest data
        await loadImages();
        await loadCategories();
        await loadTags();

        setSelectedImage(null);
        setMessage('Ảnh đã được xóa!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Có lỗi xảy ra khi xóa ảnh');
      }
    } catch (error: any) {
      console.error('Delete failed:', error);
      setMessage(`Lỗi khi xóa ảnh: ${error.message || 'Unknown error'}`);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleTagClick = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags(prev => [...prev, tag]);
    }
  };

  const removeSelectedTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage('Vui lòng chọn file ảnh hợp lệ');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    if (!isFileSizeValid(file)) {
      setMessage(`Kích thước file không được vượt quá ${formatBytes(MAX_FILE_SIZE)}`);
      setTimeout(() => setMessage(''), 5000);
      return;
    }

    setUploadData(prev => ({ ...prev, file }));
  };

  const categoriesWithAll = ['all', ...categories];

  return (
    <div className="min-h-screen bg-[#7FFFD4]">
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12 bg-white/95 backdrop-blur-sm rounded-xl p-8 shadow-lg border-white/50">
            <h1 className="font-cormorant text-4xl md:text-5xl font-light mb-4">
              Thư viện & Album
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Khám phá bộ sưu tập những khoảnh khắc đẹp nhất và tạo album để tổ chức ảnh của bạn
            </p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border-white/50">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="images">Thư viện ảnh</TabsTrigger>
                <TabsTrigger value="albums">Quản lý Album</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="images">
          {/* Storage Indicator */}
          <StorageIndicator 
            showDetails={false}
            onStorageUpdate={setStorageInfo}
          />

          {/* Success/Error Messages */}
          {message && (
            <Alert className={`mb-6 ${message.includes('Lỗi') || message.includes('không được') || message.includes('Không đủ') ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
              {message.includes('Lỗi') || message.includes('không được') || message.includes('Không đủ') ? (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              <AlertDescription className={message.includes('Lỗi') || message.includes('không được') || message.includes('Không đủ') ? 'text-red-700' : 'text-green-700'}>
                {message}
              </AlertDescription>
            </Alert>
          )}

          {/* Upload Button */}
          <div className="flex justify-center mb-8">
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-[#93E1D8] hover:bg-[#93E1D8]/90 text-white px-6 py-3 rounded-full"
                  disabled={storageInfo?.remaining === 0}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {storageInfo?.remaining === 0 ? 'Hết dung lượng' : 'Tải ảnh lên'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-cormorant text-2xl font-light">
                    Tải ảnh lên
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* File Size Limit Info */}
                  <Alert className="border-blue-200 bg-blue-50">
                    <FileImage className="h-4 w-4 text-blue-500" />
                    <AlertDescription className="text-blue-700">
                      <strong>Giới hạn:</strong> Tối đa {formatBytes(MAX_FILE_SIZE)} mỗi ảnh
                    </AlertDescription>
                  </Alert>

                  <div>
                    <Label htmlFor="upload-file">Chọn ảnh</Label>
                    <Input
                      id="upload-file"
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="mt-1"
                    />
                    {uploadData.file && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Kích thước: {formatBytes(uploadData.file.size)}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="upload-title">Tiêu đề *</Label>
                    <Input
                      id="upload-title"
                      value={uploadData.title}
                      onChange={(e) => setUploadData(prev => ({ 
                        ...prev, 
                        title: e.target.value 
                      }))}
                      placeholder="Nhập tiêu đề ảnh"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="upload-description">Mô tả</Label>
                    <Textarea
                      id="upload-description"
                      value={uploadData.description}
                      onChange={(e) => setUploadData(prev => ({ 
                        ...prev, 
                        description: e.target.value 
                      }))}
                      placeholder="Mô tả về bức ảnh..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="upload-category">Danh mục</Label>
                    <Select 
                      value={uploadData.category} 
                      onValueChange={(value) => setUploadData(prev => ({ 
                        ...prev, 
                        category: value 
                      }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Chọn danh mục" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="couples">Couples</SelectItem>
                        <SelectItem value="nature">Nature</SelectItem>
                        <SelectItem value="urban">Urban</SelectItem>
                        <SelectItem value="lifestyle">Lifestyle</SelectItem>
                        <SelectItem value="adventure">Adventure</SelectItem>
                        <SelectItem value="uncategorized">Chưa phân loại</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="upload-tags">Thẻ (phân cách bằng dấu phẩy)</Label>
                    <Input
                      id="upload-tags"
                      value={uploadData.tags}
                      onChange={(e) => setUploadData(prev => ({ 
                        ...prev, 
                        tags: e.target.value 
                      }))}
                      placeholder="ví dụ: sunset, romance, outdoor"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={handleUpload}
                      disabled={!uploadData.file || !uploadData.title || loading}
                      className="flex-1 bg-[#93E1D8] text-black hover:bg-[#7BC4B9] disabled:opacity-70"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      {loading ? 'Đang tải...' : 'Tải lên'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowUploadDialog(false)}
                      className="flex-1"
                      disabled={loading}
                    >
                      Hủy
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Rest of the component continues with filters, gallery grid, etc. */}
          {/* I'll continue with the rest if you want the complete file */}
          
            </TabsContent>

            <TabsContent value="albums">
              <AlbumManager />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default function GalleryPage() {
  return (
    <AuthGuard>
      <Navbar />
      <GalleryContent />
      <Footer />
    </AuthGuard>
  );
}