"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { StorageIndicator } from '@/components/ui/storage-indicator';
import { MultipleImageUpload } from './MultipleImageUpload';
import { GalleryImageSelector } from './GalleryImageSelector';
import { 
  Plus, 
  Upload, 
  Edit3, 
  Trash2, 
  Eye, 
  ImageIcon,
  FolderPlus,
  X,
  Save,
  AlertTriangle,
  CheckCircle,
  FileImage,
  Images
} from 'lucide-react';
import { useEdgeStore } from '@/lib/edgestore';
import { 
  getAlbums, 
  createAlbum, 
  updateAlbum, 
  deleteAlbum, 
  addImagesToAlbum,
  type Album 
} from '@/lib/albums-supabase';
import { createGalleryImage } from '@/lib/gallery-supabase';
import { getCurrentUser } from '@/lib/auth';
import { 
  isFileSizeValid, 
  hasStorageSpace, 
  recordFileUpload,
  formatBytes,
  MAX_FILE_SIZE,
  type StorageInfo
} from '@/lib/storage';
import { type GalleryImage } from '@/lib/gallery-supabase';

export function AlbumManager() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState<string | null>(null);
  const [showGallerySelector, setShowGallerySelector] = useState<string | null>(null);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Album | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [user, setUser] = useState<any>(null);
  const { edgestore } = useEdgeStore();
  
  const [albumData, setAlbumData] = useState({
    name: '',
    description: '',
    isPublic: true
  });

  // Upload data state for selected files, titles, descriptions, etc.
  type UploadData = {
    files: File[];
    titles: string[];
    descriptions: string[];
    category: string;
    tags: string;
  };
  const [uploadData, setUploadData] = useState<UploadData>({
    files: [],
    titles: [],
    descriptions: [],
    category: 'album',
    tags: ''
  });

  // Selected album for upload
  const [selectedAlbum, setSelectedAlbum] = useState<string>('');

  useEffect(() => {
    loadAlbums();
    loadUser();
  }, []);

  const loadUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  };

  const loadAlbums = async () => {
    try {
      setLoading(true);
      const userAlbums = await getAlbums(true); // Include private albums
      setAlbums(userAlbums);
    } catch (error) {
      console.error('Error loading albums:', error);
      setMessage('Có lỗi xảy ra khi tải album');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlbum = async () => {
    if (!albumData.name.trim()) return;

    try {
      const newAlbum = await createAlbum(albumData);
      if (newAlbum) {
        await loadAlbums();
        setAlbumData({ name: '', description: '', isPublic: true });
        setShowCreateDialog(false);
        setMessage('Album đã được tạo thành công!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Có lỗi xảy ra khi tạo album');
      }
    } catch (error) {
      console.error('Error creating album:', error);
      setMessage('Có lỗi xảy ra khi tạo album');
    }
  };

  const handleSelectGalleryImages = async (albumId: string, selectedImages: GalleryImage[]) => {
    if (selectedImages.length === 0) return;

    try {
      const imageIds = selectedImages.map(img => img.id);
      const success = await addImagesToAlbum(albumId, imageIds);
      
      if (success) {
        await loadAlbums();
        setMessage(`Đã thêm ${selectedImages.length} ảnh vào album!`);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Có lỗi xảy ra khi thêm ảnh vào album');
      }
    } catch (error) {
      console.error('Error adding gallery images to album:', error);
      setMessage('Có lỗi xảy ra khi thêm ảnh vào album');
    }
  };
  const handleEditAlbum = (album: Album) => {
    setEditingAlbum(album);
    setAlbumData({
      name: album.name,
      description: album.description || '',
      isPublic: album.isPublic
    });
  };

  const handleSaveEdit = async () => {
    if (!editingAlbum) return;

    try {
      const updatedAlbum = await updateAlbum(editingAlbum.id, albumData);
      if (updatedAlbum) {
        await loadAlbums();
        setEditingAlbum(null);
        setAlbumData({ name: '', description: '', isPublic: true });
        setMessage('Album đã được cập nhật!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Có lỗi xảy ra khi cập nhật album');
      }
    } catch (error) {
      console.error('Error updating album:', error);
      setMessage('Có lỗi xảy ra khi cập nhật album');
    }
  };

  const handleDeleteAlbum = (album: Album) => {
    setDeleteConfirm(album);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      const success = await deleteAlbum(deleteConfirm.id);
      if (success) {
        await loadAlbums();
        setDeleteConfirm(null);
        setMessage('Album đã được xóa!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Có lỗi xảy ra khi xóa album');
      }
    } catch (error) {
      console.error('Error deleting album:', error);
      setMessage('Có lỗi xảy ra khi xóa album');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate files
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        setMessage('Chỉ chấp nhận file ảnh');
        return false;
      }
      if (!isFileSizeValid(file)) {
        setMessage(`File ${file.name} vượt quá giới hạn ${formatBytes(MAX_FILE_SIZE)}`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploadData(prev => ({
      ...prev,
      files: validFiles,
      titles: validFiles.map(file => file.name.replace(/\.[^/.]+$/, "")),
      descriptions: validFiles.map(() => '')
    }));
  };

  const handleUploadToAlbum = async () => {
    if (!selectedAlbum || uploadData.files.length === 0) return;

    try {
      setUploading(true);
      const uploadedImageIds: string[] = [];

      // Upload each file
      for (let i = 0; i < uploadData.files.length; i++) {
        const file = uploadData.files[i];
        const title = uploadData.titles[i] || file.name;
        const description = uploadData.descriptions[i];

        // Check storage space
        const hasSpace = await hasStorageSpace(file.size);
        if (!hasSpace) {
          setMessage(`Không đủ dung lượng cho file ${file.name}`);
          continue;
        }

        // Upload to EdgeStore
        const res = await edgestore.images.upload({
          file,
          onProgressChange: (progress) => {
            console.log(`Upload progress for ${file.name}:`, progress);
          },
        });

        // Record in storage tracking
        await recordFileUpload(
          res.url,
          file.name,
          file.size,
          'gallery'
        );

        // Create gallery image
        const newImage = await createGalleryImage({
          url: res.url,
          title,
          description,
          category: uploadData.category,
          tags: uploadData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
          size: file.size
        });

        if (newImage) {
          uploadedImageIds.push(newImage.id);
        }
      }

      // Add images to album
      if (uploadedImageIds.length > 0) {
        const success = await addImagesToAlbum(selectedAlbum, uploadedImageIds);
        if (success) {
          await loadAlbums();
          setUploadData({
            files: [],
            titles: [],
            descriptions: [],
            category: 'album',
            tags: ''
          });
          setSelectedAlbum('');
          setShowUploadDialog(null);
          setMessage(`Đã tải lên ${uploadedImageIds.length} ảnh vào album!`);
          setTimeout(() => setMessage(''), 3000);
        }
      }
    } catch (error) {
      console.error('Error uploading to album:', error);
      setMessage('Có lỗi xảy ra khi tải ảnh lên');
    } finally {
      setUploading(false);
    }
  };

  const updateImageTitle = (index: number, title: string) => {
    setUploadData(prev => ({
      ...prev,
      titles: prev.titles.map((t, i) => i === index ? title : t)
    }));
  };

  const updateImageDescription = (index: number, description: string) => {
    setUploadData(prev => ({
      ...prev,
      descriptions: prev.descriptions.map((d, i) => i === index ? description : d)
    }));
  };

  const removeFile = (index: number) => {
    setUploadData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
      titles: prev.titles.filter((_, i) => i !== index),
      descriptions: prev.descriptions.filter((_, i) => i !== index)
    }));
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Bạn cần đăng nhập để quản lý album</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Storage Indicator */}
      <StorageIndicator 
        showDetails={false}
        onStorageUpdate={setStorageInfo}
      />

      {/* Success/Error Messages */}
      {message && (
        <Alert className={message.includes('Lỗi') || message.includes('không được') || message.includes('Không đủ') ? 'border-red-200 bg-red-50/90' : 'border-green-200 bg-green-50/90'}>
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

      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border-white/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-cormorant text-3xl font-light mb-2">Quản lý Album</h2>
            <p className="text-muted-foreground">
              Tạo và quản lý các album ảnh của bạn
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="bg-[#93E1D8] hover:bg-[#93E1D8]/90"
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              Tạo Album
            </Button>
            <Button 
              onClick={() => setShowUploadDialog('select')}
              variant="outline"
              disabled={albums.length === 0}
            >
              <Upload className="h-4 w-4 mr-2" />
              Tải nhiều ảnh vào Album
            </Button>
          </div>
        </div>
      </div>

      {/* Albums Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#93E1D8] mx-auto"></div>
        </div>
      ) : albums.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map((album) => (
            <Card key={album.id} className="bg-white/95 backdrop-blur-sm border-white/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-0">
                {/* Cover Image */}
                <div className="relative h-48 overflow-hidden rounded-t-lg">
                  {album.coverImage ? (
                    <Image
                      src={album.coverImage}
                      alt={album.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full bg-gradient-to-br from-[#93E1D8]/20 to-[#FFA69E]/20 flex items-center justify-center">
                      <Images className="h-12 w-12 text-[#93E1D8]" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    {!album.isPublic && (
                      <div className="bg-black/50 text-white px-2 py-1 rounded text-xs">
                        Riêng tư
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-cormorant text-xl font-medium mb-2 line-clamp-1">
                    {album.name}
                  </h3>
                  {album.description && (
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                      {album.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <span>{album.imageCount} ảnh</span>
                    <span>{new Date(album.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="h-3 w-3 mr-1" />
                      Xem
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setShowGallerySelector(album.id)}
                      className="mr-2"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Từ thư viện
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setShowUploadDialog(album.id)}
                      className="mr-2"
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      Tải lên
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleEditAlbum(album)}
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDeleteAlbum(album)}
                      className="text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border-white/50">
          <div className="w-24 h-24 bg-[#93E1D8]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Images className="h-12 w-12 text-[#93E1D8]" />
          </div>
          <h3 className="font-cormorant text-2xl font-light mb-2">
            Chưa có album nào
          </h3>
          <p className="text-muted-foreground mb-6">
            Tạo album đầu tiên để tổ chức ảnh của bạn
          </p>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="bg-[#93E1D8] hover:bg-[#93E1D8]/90"
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            Tạo Album đầu tiên
          </Button>
        </div>
      )}

      {/* Create Album Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="h-5 w-5" />
              Tạo Album mới
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="album-name">Tên album *</Label>
              <Input
                id="album-name"
                value={albumData.name}
                onChange={(e) => setAlbumData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nhập tên album..."
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="album-description">Mô tả</Label>
              <Textarea
                id="album-description"
                value={albumData.description}
                onChange={(e) => setAlbumData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Mô tả về album..."
                className="mt-1"
                rows={3}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="album-public">Công khai</Label>
              <Switch
                id="album-public"
                checked={albumData.isPublic}
                onCheckedChange={(checked) => setAlbumData(prev => ({ ...prev, isPublic: checked }))}
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleCreateAlbum}
                disabled={!albumData.name.trim()}
                className="flex-1 bg-[#93E1D8] hover:bg-[#93E1D8]/90"
              >
                <Save className="h-4 w-4 mr-2" />
                Tạo Album
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCreateDialog(false)}
                className="flex-1"
              >
                Hủy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Album Dialog */}
      <Dialog open={!!editingAlbum} onOpenChange={() => setEditingAlbum(null)}>
        <DialogContent className="bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Chỉnh sửa Album
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-album-name">Tên album *</Label>
              <Input
                id="edit-album-name"
                value={albumData.name}
                onChange={(e) => setAlbumData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nhập tên album..."
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-album-description">Mô tả</Label>
              <Textarea
                id="edit-album-description"
                value={albumData.description}
                onChange={(e) => setAlbumData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Mô tả về album..."
                className="mt-1"
                rows={3}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-album-public">Công khai</Label>
              <Switch
                id="edit-album-public"
                checked={albumData.isPublic}
                onCheckedChange={(checked) => setAlbumData(prev => ({ ...prev, isPublic: checked }))}
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleSaveEdit}
                disabled={!albumData.name.trim()}
                className="flex-1 bg-[#93E1D8] hover:bg-[#93E1D8]/90"
              >
                <Save className="h-4 w-4 mr-2" />
                Lưu thay đổi
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setEditingAlbum(null)}
                className="flex-1"
              >
                Hủy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Album Selection Dialog */}
      <Dialog open={showUploadDialog === 'select'} onOpenChange={() => setShowUploadDialog(null)}>
        <DialogContent className="max-w-md bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Chọn Album để tải ảnh
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Chọn album mà bạn muốn thêm ảnh vào:
            </p>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {albums.map(album => (
                <Button
                  key={album.id}
                  variant="outline"
                  className="w-full justify-start h-auto p-4"
                  onClick={() => setShowUploadDialog(album.id)}
                >
                  <div className="text-left">
                    <div className="font-medium">{album.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {album.imageCount} ảnh • {album.isPublic ? 'Công khai' : 'Riêng tư'}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => setShowUploadDialog(null)}
              className="w-full"
            >
              Hủy
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Multiple Image Upload Dialog */}
      {showUploadDialog && showUploadDialog !== 'select' && (
        <MultipleImageUpload
          isOpen={true}
          onClose={() => setShowUploadDialog(null)}
          albumId={showUploadDialog}
          albumName={albums.find(a => a.id === showUploadDialog)?.name || ''}
          onUploadComplete={() => {
            loadAlbums();
            setShowUploadDialog(null);
          }}
        />
      )}

      {/* Gallery Image Selector Dialog */}
      {showGallerySelector && (
        <GalleryImageSelector
          isOpen={true}
          onClose={() => setShowGallerySelector(null)}
          onSelect={(selectedImages) => {
            handleSelectGalleryImages(showGallerySelector, selectedImages);
            setShowGallerySelector(null);
          }}
        />
      )}
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Xác nhận xóa Album
            </DialogTitle>
          </DialogHeader>
          
          {deleteConfirm && (
            <div className="space-y-4">
              <p>
                Bạn có chắc chắn muốn xóa album <strong>"{deleteConfirm.name}"</strong>?
              </p>
              <p className="text-sm text-muted-foreground">
                Album sẽ bị xóa nhưng các ảnh trong album vẫn được giữ lại trong thư viện.
              </p>
              
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setDeleteConfirm(null)}
                >
                  Hủy
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={confirmDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa Album
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}