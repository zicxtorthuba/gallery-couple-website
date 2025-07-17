"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  ArrowLeftIcon,
  Calendar,
  Images,
  User,
  Lock,
  Globe,
  Heart,
  Download,
  Share,
  Eye,
  Edit3,
  Trash2,
  Plus,
  AlertTriangle
} from 'lucide-react';
import { Album, getAlbum } from '@/lib/albums-supabase';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { getCurrentUser } from '@/lib/auth';
import { MultipleImageUpload } from '@/components/albums/MultipleImageUpload';

export default function AlbumViewPage() {
  const params = useParams();
  const albumId = params.id as string;
  
  const [album, setAlbum] = useState<Album | null>(null);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState<{ image: any; step: 1 | 2 } | null>(null);

  useEffect(() => {
    loadAlbum();
    loadUser();
  }, [albumId]);

  const loadUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  };

  const loadAlbum = async () => {
    try {
      setLoading(true);
      const foundAlbum = await getAlbum(albumId);
      setAlbum(foundAlbum);
    } catch (error) {
      console.error('Error loading album:', error);
    } finally {
      setLoading(false);
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
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: album?.name,
        text: album?.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleRemoveFromAlbum = async (imageId: string) => {
    if (!album) return;
    
    try {
      // Import the function dynamically to avoid circular imports
      const { removeImageFromAlbum } = await import('@/lib/albums-supabase');
      const success = await removeImageFromAlbum(album.id, imageId);
      
      if (success) {
        // Reload album to reflect changes
        await loadAlbum();
      }
    } catch (error) {
      console.error('Error removing image from album:', error);
    }
  };
  const isOwner = user && album && user.id === album.authorId;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#c4d1a0]">
        <Navbar />
        <div className="pt-20 pb-16 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#93E1D8]"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!album) {
    return (
      <div className="min-h-screen bg-[#c4d1a0]">
        <Navbar />
        <div className="pt-20 pb-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold mb-4">Album không tồn tại</h1>
            <Link href="/">
              <Button variant="outline">Quay lại trang chủ</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Check if user can view this album
  if (!album.isPublic && !isOwner) {
    return (
      <div className="min-h-screen bg-[#c4d1a0]">
        <Navbar />
        <div className="pt-20 pb-16">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="h-8 w-8 text-gray-400" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Album riêng tư</h1>
              <p className="text-muted-foreground mb-6">
                Bạn không có quyền xem album này
              </p>
              <Link href="/">
                <Button variant="outline">Quay lại trang chủ</Button>
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#c4d1a0]">
      <Navbar />
      
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Back Button */}
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-[#93E1D8] transition-colors mb-8">
            <ArrowLeftIcon className="h-4 w-4" />
            Quay lại trang chủ
          </Link>

          {/* Album Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Cover Image */}
              <div className="relative w-full md:w-64 h-48 overflow-hidden rounded-xl bg-gray-100">
                {album.coverImage ? (
                  <Image
                    src={album.coverImage}
                    alt={album.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 256px"
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full bg-gradient-to-br from-[#93E1D8]/20 to-[#FFA69E]/20 flex items-center justify-center">
                    <Images className="h-12 w-12 text-[#93E1D8]" />
                  </div>
                )}
              </div>

              {/* Album Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="font-cormorant text-3xl md:text-4xl font-light mb-2">
                      {album.name}
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{album.authorName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(album.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Images className="h-4 w-4" />
                        <span>{album.imageCount} ảnh</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {album.isPublic ? (
                          <>
                            <Globe className="h-4 w-4" />
                            <span>Công khai</span>
                          </>
                        ) : (
                          <>
                            <Lock className="h-4 w-4" />
                            <span>Riêng tư</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleShare}>
                      <Share className="h-4 w-4" />
                    </Button>
                    {isOwner && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowUploadDialog(true)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Thêm ảnh
                      </Button>
                    )}
                  </div>
                </div>

                {album.description && (
                  <p className="text-muted-foreground mb-4">
                    {album.description}
                  </p>
                )}

                <Badge variant={album.isPublic ? "default" : "secondary"}>
                  {album.isPublic ? "Công khai" : "Riêng tư"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Images Grid */}
          {album.images && album.images.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {album.images.map((image) => (
                <div 
                  key={image.id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden group hover:shadow-lg transition-all duration-300 border border-gray-100"
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
                          onClick={() => handleDownload(image.url, image.title)}
                          className="bg-white/90 hover:bg-white"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {isOwner && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setDeleteConfirmStep({ image, step: 1 })}
                            className="bg-white/90 hover:bg-white text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
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
                        <Badge key={tag} variant="secondary" className="text-xs">
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
                      <div className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        <span>{image.likes}</span>
                      </div>
                      <span>{new Date(image.createdAt).toLocaleDateString('vi-VN')}</span>
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
                  <Images className="h-12 w-12 text-[#93E1D8]" />
                </div>
                <h3 className="font-cormorant text-2xl font-light mb-2">
                  Album chưa có ảnh nào
                </h3>
                <p className="text-muted-foreground mb-6">
                  {isOwner 
                    ? 'Hãy thêm những bức ảnh đẹp vào album của bạn'
                    : 'Album này chưa có ảnh nào'
                  }
                </p>
                {isOwner && (
                  <Button 
                    onClick={() => setShowUploadDialog(true)}
                    className="bg-[#93E1D8] hover:bg-[#93E1D8]/90 text-white px-6 py-3 rounded-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm ảnh đầu tiên
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-white/95 backdrop-blur-sm">
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
                      onClick={() => handleDownload(selectedImage.url, selectedImage.title)}
                    >
                      <Download className="h-4 w-4" />
                      Tải về
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
                {selectedImage.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
              
              <div className="text-sm text-muted-foreground mt-2">
                <span>Tác giả: @{selectedImage.author} • {new Date(selectedImage.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Multiple Image Upload Dialog */}
      {showUploadDialog && (
        <MultipleImageUpload
          isOpen={true}
          onClose={() => setShowUploadDialog(false)}
          albumId={album.id}
          albumName={album.name}
          onUploadComplete={() => {
            loadAlbum();
            setShowUploadDialog(false);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmStep} onOpenChange={() => setDeleteConfirmStep(null)}>
        <DialogContent className="bg-white/95 backdrop-blur-sm max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              {deleteConfirmStep?.step === 1 ? 'Xác nhận xóa ảnh' : 'Xác nhận cuối cùng'}
            </DialogTitle>
          </DialogHeader>
          
          {deleteConfirmStep && (
            <div className="space-y-6">
              {deleteConfirmStep.step === 1 ? (
                <>
                  <div className="text-center">
                    <p className="text-lg font-medium mb-2">
                      Bạn có chắc chắn muốn xóa ảnh này khỏi album?
                    </p>
                    <p className="text-sm text-muted-foreground">
                      "{deleteConfirmStep.image.title}"
                    </p>
                  </div>
                  
                  <div className="flex gap-3 justify-center">
                    <Button 
                      variant="outline" 
                      onClick={() => setDeleteConfirmStep(null)}
                      className="px-6 bg-gray-100 hover:bg-gray-200 text-gray-700"
                    >
                      Hủy
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => setDeleteConfirmStep({ ...deleteConfirmStep, step: 2 })}
                      className="px-6 bg-red-500 hover:bg-red-600 text-white"
                    >
                      Xóa khỏi album
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle className="h-8 w-8 text-red-500" />
                    </div>
                    <p className="text-lg font-medium mb-2 text-red-600">
                      Hành động này không thể hoàn tác!
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Ảnh sẽ bị xóa khỏi album này vĩnh viễn.
                    </p>
                    <p className="text-sm font-medium">
                      "{deleteConfirmStep.image.title}"
                    </p>
                  </div>
                  
                  <div className="flex gap-3 justify-center">
                    <Button 
                      variant="outline" 
                      onClick={() => setDeleteConfirmStep(null)}
                      className="px-6 bg-gray-100 hover:bg-gray-200 text-gray-700"
                    >
                      Hủy
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => {
                        handleRemoveFromAlbum(deleteConfirmStep.image.id);
                        setDeleteConfirmStep(null);
                      }}
                      className="px-6 bg-red-600 hover:bg-red-700 text-white"
                    >
                      Có, xóa khỏi album
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}