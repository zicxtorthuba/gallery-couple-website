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
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { galleryImages } from '@/lib/data';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AuthGuard } from '@/components/AuthGuard';
import { useEdgeStore } from '@/lib/edgestore';

interface GalleryImage {
  id: string;
  url: string;
  title: string;
  category: string;
  tags: string[];
  likes: number;
  author: string;
  createdAt: string;
  description?: string;
}

function GalleryContent() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [filteredImages, setFilteredImages] = useState<GalleryImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [likedImages, setLikedImages] = useState<Set<string>>(new Set());
  const [favoriteImages, setFavoriteImages] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
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

  const { edgestore } = useEdgeStore();

  useEffect(() => {
    setImages(galleryImages);
    setFilteredImages(galleryImages);
  }, []);

  // Filter images based on search, category, and tags
  useEffect(() => {
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
  }, [images, searchTerm, selectedCategory, selectedTags]);

  const handleLike = (imageId: string) => {
    setLikedImages(prev => {
      const newLiked = new Set(prev);
      if (newLiked.has(imageId)) {
        newLiked.delete(imageId);
      } else {
        newLiked.add(imageId);
      }
      return newLiked;
    });

    setImages(prev => prev.map(img =>
      img.id === imageId
        ? { ...img, likes: likedImages.has(imageId) ? img.likes - 1 : img.likes + 1 }
        : img
    ));
  };

  const handleFavorite = (imageId: string) => {
    setFavoriteImages(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(imageId)) {
        newFavorites.delete(imageId);
      } else {
        newFavorites.add(imageId);
      }
      return newFavorites;
    });
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
    }
  };

  const handleUpload = async () => {
    if (!uploadData.file || !uploadData.title) {
      setUploadStatus('error');
      setUploadMessage('Vui lòng chọn file và nhập tiêu đề');
      return;
    }

    try {
      setUploadStatus('uploading');
      setUploadProgress(0);
      setUploadMessage('Đang tải lên...');

      const res = await edgestore.images.upload({
        file: uploadData.file,
        onProgressChange: (progress) => {
          setUploadProgress(progress);
        },
      });

      const newImage: GalleryImage = {
        id: `upload-${Date.now()}`,
        url: res.url,
        title: uploadData.title,
        description: uploadData.description,
        category: uploadData.category || 'uncategorized',
        tags: uploadData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        likes: 0,
        author: 'current-user',
        createdAt: new Date().toISOString().split('T')[0]
      };

      setImages(prev => [newImage, ...prev]);
      setUploadStatus('success');
      setUploadMessage('Tải lên thành công!');
      
      // Reset form
      setUploadData({
        title: '',
        description: '',
        category: '',
        tags: '',
        file: null
      });

      // Close dialog after 2 seconds
      setTimeout(() => {
        setShowUploadDialog(false);
        setUploadStatus('idle');
        setUploadProgress(0);
        setUploadMessage('');
      }, 2000);

    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus('error');
      setUploadMessage('Tải lên thất bại. Vui lòng thử lại.');
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

  const handleSaveEdit = () => {
    if (!editingImage) return;

    setImages(prev => prev.map(img =>
      img.id === editingImage.id
        ? {
            ...img,
            title: editData.title,
            description: editData.description,
            tags: editData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
          }
        : img
    ));

    setEditingImage(null);
    setEditData({ title: '', description: '', tags: '' });
  };

  const handleDelete = async (image: GalleryImage) => {
    try {
      // Delete from EdgeStore if it's an uploaded image
      if (image.url.includes('edgestore')) {
        await edgestore.images.delete({
          url: image.url,
        });
      }

      // Remove from local state
      setImages(prev => prev.filter(img => img.id !== image.id));
      setSelectedImage(null);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleReplace = async (image: GalleryImage, newFile: File) => {
    try {
      setLoading(true);

      const res = await edgestore.images.upload({
        file: newFile,
        options: {
          replaceTargetUrl: image.url,
        },
        onProgressChange: (progress) => {
          console.log('Replace progress:', progress);
        },
      });

      // Update the image URL in local state
      setImages(prev => prev.map(img =>
        img.id === image.id
          ? { ...img, url: res.url }
          : img
      ));

      setLoading(false);
    } catch (error) {
      console.error('Replace failed:', error);
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

  const categories = ['all', ...Array.from(new Set(images.map(img => img.category)))];
  const allTags = Array.from(new Set(images.flatMap(img => img.tags)));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-cormorant text-4xl md:text-5xl font-light mb-4">
              Thư viện ảnh
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Khám phá bộ sưu tập những khoảnh khắc đẹp nhất được chia sẻ bởi cộng đồng
            </p>
          </div>

          {/* Upload Button */}
          <div className="flex justify-center mb-8">
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button className="bg-[#93E1D8] hover:bg-[#93E1D8]/90 text-white px-6 py-3 rounded-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Tải ảnh lên
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-cormorant text-2xl font-light">
                    Tải ảnh lên
                  </DialogTitle>
                </DialogHeader>
                
                {uploadStatus === 'success' ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-green-700 mb-2">
                      Tải lên thành công!
                    </h3>
                    <p className="text-sm text-green-600">
                      Ảnh của bạn đã được thêm vào thư viện
                    </p>
                  </div>
                ) : uploadStatus === 'error' ? (
                  <div className="space-y-4">
                    <Alert className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <AlertDescription className="text-red-700">
                        {uploadMessage}
                      </AlertDescription>
                    </Alert>
                    <Button 
                      onClick={() => {
                        setUploadStatus('idle');
                        setUploadMessage('');
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      Thử lại
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {uploadStatus === 'uploading' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Đang tải lên...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                      </div>
                    )}
                    
                    <div>
                      <Label htmlFor="upload-file">Chọn ảnh</Label>
                      <Input
                        id="upload-file"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setUploadData(prev => ({ 
                          ...prev, 
                          file: e.target.files?.[0] || null 
                        }))}
                        className="mt-1"
                        disabled={uploadStatus === 'uploading'}
                      />
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
                        disabled={uploadStatus === 'uploading'}
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
                        disabled={uploadStatus === 'uploading'}
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
                        disabled={uploadStatus === 'uploading'}
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
                        disabled={uploadStatus === 'uploading'}
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button 
                        onClick={handleUpload}
                        disabled={!uploadData.file || !uploadData.title || uploadStatus === 'uploading'}
                        className="flex-1 bg-[#93E1D8] hover:bg-[#93E1D8]/90"
                      >
                        {uploadStatus === 'uploading' ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Đang tải...
                          </>
                        ) : (
                          <>
                            <Camera className="h-4 w-4 mr-2" />
                            Tải lên
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowUploadDialog(false)}
                        className="flex-1"
                        disabled={uploadStatus === 'uploading'}
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>

          {/* Filters */}
          <div className="space-y-4 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo tiêu đề, mô tả hoặc thẻ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? 'Tất cả' : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Tags */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground">Lọc theo thẻ:</span>
                {selectedTags.map(tag => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-red-100"
                    onClick={() => removeSelectedTag(tag)}
                  >
                    {tag}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}

            {/* Popular Tags */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground">Thẻ phổ biến:</span>
                {allTags.slice(0, 8).map(tag => (
                  <Badge 
                    key={tag} 
                    variant="outline" 
                    className="cursor-pointer hover:bg-[#93E1D8]/10 hover:border-[#93E1D8]"
                    onClick={() => handleTagClick(tag)}
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Gallery Content */}
          {filteredImages.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredImages.map((image) => (
                <div
                  key={image.id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden group hover:shadow-lg transition-all duration-300"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={image.url}
                      alt={image.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectedImage(image)}
                          className="bg-white/90 hover:bg-white"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleLike(image.id)}
                          className={`bg-white/90 hover:bg-white ${
                            likedImages.has(image.id) ? 'text-red-500' : ''
                          }`}
                        >
                          <Heart className={`h-4 w-4 ${likedImages.has(image.id) ? 'fill-current' : ''}`} />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleFavorite(image.id)}
                          className={`bg-white/90 hover:bg-white ${
                            favoriteImages.has(image.id) ? 'text-yellow-500' : ''
                          }`}
                        >
                          <Star className={`h-4 w-4 ${favoriteImages.has(image.id) ? 'fill-current' : ''}`} />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleDownload(image.url, image.title)}
                          className="bg-white/90 hover:bg-white"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleEdit(image)}
                          className="bg-white/90 hover:bg-white"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
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
                          onClick={() => handleTagClick(tag)}
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
                      <span>@{image.author}</span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          <span>{image.likes}</span>
                        </div>
                        {favoriteImages.has(image.id) && (
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-[#93E1D8]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ImageIcon className="h-12 w-12 text-[#93E1D8]" />
                </div>
                <h3 className="font-cormorant text-2xl font-light mb-2">
                  Chưa có ảnh nào
                </h3>
                <p className="text-muted-foreground mb-6">
                  Hãy bắt đầu bằng cách tải lên những bức ảnh đẹp nhất của bạn
                </p>
                <Button 
                  onClick={() => setShowUploadDialog(true)}
                  className="bg-[#93E1D8] hover:bg-[#93E1D8]/90 text-white px-6 py-3 rounded-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Tải ảnh đầu tiên
                </Button>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2 text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#93E1D8]"></div>
                Đang xử lý...
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          {selectedImage && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span className="font-cormorant text-2xl font-light">
                    {selectedImage.title}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleLike(selectedImage.id)}
                      className={likedImages.has(selectedImage.id) ? 'text-red-500' : ''}
                    >
                      <Heart className={`h-4 w-4 mr-1 ${likedImages.has(selectedImage.id) ? 'fill-current' : ''}`} />
                      {selectedImage.likes}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleFavorite(selectedImage.id)}
                      className={favoriteImages.has(selectedImage.id) ? 'text-yellow-500' : ''}
                    >
                      <Star className={`h-4 w-4 mr-1 ${favoriteImages.has(selectedImage.id) ? 'fill-current' : ''}`} />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDownload(selectedImage.url, selectedImage.title)}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Tải về
                    </Button>
                    <label htmlFor="replace-file">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="gap-2"
                        asChild
                      >
                        <span>
                          <RefreshCw className="h-4 w-4" />
                          Thay thế
                        </span>
                      </Button>
                      <input
                        id="replace-file"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleReplace(selectedImage, file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDelete(selectedImage)}
                      className="text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </DialogTitle>
              </DialogHeader>
              
              <div className="relative aspect-video">
                <Image
                  src={selectedImage.url}
                  alt={selectedImage.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 80vw"
                  className="object-contain"
                />
              </div>
              
              {selectedImage.description && (
                <p className="text-muted-foreground mt-4">
                  {selectedImage.description}
                </p>
              )}
              
              <div className="flex flex-wrap gap-2 mt-4">
                {selectedImage.tags.map(tag => (
                  <Badge 
                    key={tag} 
                    variant="secondary"
                    className="cursor-pointer hover:bg-[#93E1D8]/20"
                    onClick={() => handleTagClick(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
              
              <div className="text-sm text-muted-foreground mt-2">
                Tác giả: @{selectedImage.author} • {selectedImage.createdAt}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editingImage} onOpenChange={() => setEditingImage(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-cormorant text-2xl font-light">
              Chỉnh sửa ảnh
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Tiêu đề</Label>
              <Input
                id="edit-title"
                value={editData.title}
                onChange={(e) => setEditData(prev => ({ 
                  ...prev, 
                  title: e.target.value 
                }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Mô tả</Label>
              <Textarea
                id="edit-description"
                value={editData.description}
                onChange={(e) => setEditData(prev => ({ 
                  ...prev, 
                  description: e.target.value 
                }))}
                className="mt-1"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-tags">Thẻ (phân cách bằng dấu phẩy)</Label>
              <Input
                id="edit-tags"
                value={editData.tags}
                onChange={(e) => setEditData(prev => ({ 
                  ...prev, 
                  tags: e.target.value 
                }))}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleSaveEdit}
                className="flex-1 bg-[#93E1D8] hover:bg-[#93E1D8]/90"
              >
                <Save className="h-4 w-4 mr-2" />
                Lưu
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setEditingImage(null)}
                className="flex-1"
              >
                Hủy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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