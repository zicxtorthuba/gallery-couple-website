"use client";

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  AlertTriangle, 
  CheckCircle,
  FileImage,
  Trash2,
  Plus,
  CloudUpload
} from 'lucide-react';
import { CldUploadButton } from 'next-cloudinary';
import { createGalleryImage } from '@/lib/gallery-supabase';
import { addImagesToAlbum } from '@/lib/albums-supabase';
import { 
  isFileSizeValid, 
  hasStorageSpace, 
  recordFileUpload,
  formatBytes,
  MAX_FILE_SIZE
} from '@/lib/storage';

interface MultipleImageUploadProps {
  isOpen: boolean;
  onClose: () => void;
  albumId: string;
  albumName: string;
  onUploadComplete: () => void;
}

interface SelectedFile {
  id: string;
  file: File;
  preview: string;
  title: string;
  description: string;
  error?: string;
}

interface UploadProgress {
  fileId: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILES = 20;
const MAX_SIZE_PER_FILE = 10 * 1024 * 1024; // 10MB

export function MultipleImageUpload({ 
  isOpen, 
  onClose, 
  albumId, 
  albumName, 
  onUploadComplete 
}: MultipleImageUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [globalTags, setGlobalTags] = useState('');
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Định dạng file không được hỗ trợ. Chỉ chấp nhận JPG, PNG, GIF, WEBP.';
    }
    
    if (file.size > MAX_SIZE_PER_FILE) {
      return `Kích thước file vượt quá ${formatBytes(MAX_SIZE_PER_FILE)}`;
    }
    
    return null;
  };

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    if (selectedFiles.length + fileArray.length > MAX_FILES) {
      setMessage(`Chỉ có thể chọn tối đa ${MAX_FILES} ảnh cùng lúc`);
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const newFiles: SelectedFile[] = [];
    
    for (const file of fileArray) {
      const error = validateFile(file);
      const hasSpace = await hasStorageSpace(file.size);
      
      if (!hasSpace) {
        setMessage('Không đủ dung lượng lưu trữ');
        setTimeout(() => setMessage(''), 3000);
        continue;
      }

      const fileId = `${Date.now()}-${Math.random()}`;
      const preview = URL.createObjectURL(file);
      
      newFiles.push({
        id: fileId,
        file,
        preview,
        title: file.name.replace(/\.[^/.]+$/, ""),
        description: '',
        error: error || undefined
      });
    }

    setSelectedFiles(prev => [...prev, ...newFiles]);
  }, [selectedFiles.length]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset input value to allow selecting the same files again
    e.target.value = '';
  };

  const removeFile = (fileId: string) => {
    setSelectedFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  const updateFileTitle = (fileId: string, title: string) => {
    setSelectedFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, title } : f
    ));
  };

  const updateFileDescription = (fileId: string, description: string) => {
    setSelectedFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, description } : f
    ));
  };

  const handleUpload = async () => {
    const validFiles = selectedFiles.filter(f => !f.error);
    
    if (validFiles.length === 0) {
      setMessage('Không có file hợp lệ để tải lên');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setIsUploading(true);
    setUploadProgress(validFiles.map(f => ({
      fileId: f.id,
      progress: 0,
      status: 'pending'
    })));

    const uploadedImageIds: string[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (const selectedFile of validFiles) {
      try {
        // Update progress to uploading
        setUploadProgress(prev => prev.map(p => 
          p.fileId === selectedFile.id 
            ? { ...p, status: 'uploading', progress: 0 }
            : p
        ));

        // Upload to Cloudinary using direct API call
        const formData = new FormData();
        formData.append('file', selectedFile.file);
        formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default');
        formData.append('folder', 'albums');
        formData.append('tags', `album,${albumName.toLowerCase().replace(/\s+/g, '-')}`);
        formData.append('context', `title=${selectedFile.title}|description=${selectedFile.description}|albumId=${albumId}`);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const res = await response.json();

        // Update progress to 100%
        setUploadProgress(prev => prev.map(p => 
          p.fileId === selectedFile.id 
            ? { ...p, progress: 100 }
            : p
        ));

        // Record in storage tracking
        await recordFileUpload(
          res.secure_url,
          selectedFile.file.name,
          res.bytes,
          'gallery'
        );

        // Create gallery image
        const tags = globalTags.split(',').map(tag => tag.trim()).filter(Boolean);
        const newImage = await createGalleryImage({
          url: res.url,
          title: selectedFile.title,
          description: selectedFile.description,
          category: 'album',
          tags,
          size: selectedFile.file.size
        });

        if (newImage) {
          uploadedImageIds.push(newImage.id);
          successCount++;
          
          // Update progress to completed
          setUploadProgress(prev => prev.map(p => 
            p.fileId === selectedFile.id 
              ? { ...p, status: 'completed', progress: 100 }
              : p
          ));
        } else {
          throw new Error('Failed to create gallery image');
        }

      } catch (error) {
        console.error(`Upload failed for ${selectedFile.file.name}:`, error);
        errorCount++;
        
        // Update progress to error
        setUploadProgress(prev => prev.map(p => 
          p.fileId === selectedFile.id 
            ? { ...p, status: 'error', error: 'Upload failed' }
            : p
        ));
      }
    }

    // Add images to album
    if (uploadedImageIds.length > 0) {
      try {
        await addImagesToAlbum(albumId, uploadedImageIds);
      } catch (error) {
        console.error('Failed to add images to album:', error);
      }
    }

    // Show results
    if (successCount > 0) {
      setMessage(`Đã tải lên thành công ${successCount} ảnh${errorCount > 0 ? `, ${errorCount} ảnh thất bại` : ''}!`);
      setTimeout(() => {
        onUploadComplete();
        handleClose();
      }, 2000);
    } else {
      setMessage('Tất cả ảnh đều tải lên thất bại');
    }

    setIsUploading(false);
  };

  const handleClose = () => {
    if (isUploading) return;
    
    // Clean up object URLs
    selectedFiles.forEach(file => {
      URL.revokeObjectURL(file.preview);
    });
    
    setSelectedFiles([]);
    setUploadProgress([]);
    setGlobalTags('');
    setMessage('');
    onClose();
  };

  const getProgressForFile = (fileId: string) => {
    return uploadProgress.find(p => p.fileId === fileId);
  };

  const validFilesCount = selectedFiles.filter(f => !f.error).length;
  const totalProgress = uploadProgress.length > 0 
    ? Math.round(uploadProgress.reduce((sum, p) => sum + p.progress, 0) / uploadProgress.length)
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CloudUpload className="h-5 w-5" />
            Tải nhiều ảnh vào album "{albumName}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Size Limit Info */}
          <Alert className="border-blue-200 bg-blue-50">
            <FileImage className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-blue-700">
              <strong>Giới hạn:</strong> Tối đa {MAX_FILES} ảnh, mỗi ảnh không quá {formatBytes(MAX_SIZE_PER_FILE)}. 
              Hỗ trợ: JPG, PNG, GIF, WEBP
            </AlertDescription>
          </Alert>

          {/* Success/Error Messages */}
          {message && (
            <Alert className={message.includes('thành công') ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              {message.includes('thành công') ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
              <AlertDescription className={message.includes('thành công') ? 'text-green-700' : 'text-red-700'}>
                {message}
              </AlertDescription>
            </Alert>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Đang tải lên...</span>
                    <span>{totalProgress}%</span>
                  </div>
                  <Progress value={totalProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {uploadProgress.filter(p => p.status === 'completed').length} / {uploadProgress.length} ảnh hoàn thành
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Drag and Drop Area */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
              isDragOver 
                ? 'border-[#93E1D8] bg-[#93E1D8]/10' 
                : 'border-gray-300 hover:border-[#93E1D8] hover:bg-[#93E1D8]/5'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <div className="w-16 h-16 bg-[#93E1D8]/10 rounded-full flex items-center justify-center mx-auto">
                <CloudUpload className="h-8 w-8 text-[#93E1D8]" />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">
                  Kéo thả ảnh vào đây hoặc
                </h3>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="border-[#93E1D8] text-[#93E1D8] hover:bg-[#93E1D8]/10"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Chọn ảnh từ máy tính
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Chọn tối đa {MAX_FILES} ảnh (JPG, PNG, GIF, WEBP)
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Global Tags */}
          {selectedFiles.length > 0 && (
            <div>
              <Label htmlFor="global-tags">Thẻ chung cho tất cả ảnh (phân cách bằng dấu phẩy)</Label>
              <Input
                id="global-tags"
                value={globalTags}
                onChange={(e) => setGlobalTags(e.target.value)}
                placeholder="ví dụ: album, memories, family"
                className="mt-1"
                disabled={isUploading}
              />
            </div>
          )}

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">
                  Ảnh đã chọn ({selectedFiles.length}/{MAX_FILES})
                  {validFilesCount !== selectedFiles.length && (
                    <span className="text-red-500 ml-2">
                      ({selectedFiles.length - validFilesCount} ảnh có lỗi)
                    </span>
                  )}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    selectedFiles.forEach(file => URL.revokeObjectURL(file.preview));
                    setSelectedFiles([]);
                  }}
                  disabled={isUploading}
                  className="text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Xóa tất cả
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {selectedFiles.map((selectedFile) => {
                  const progress = getProgressForFile(selectedFile.id);
                  
                  return (
                    <Card key={selectedFile.id} className={`${selectedFile.error ? 'border-red-200' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {/* Image Preview */}
                          <div className="relative w-20 h-20 flex-shrink-0">
                            <Image
                              src={selectedFile.preview}
                              alt={selectedFile.title}
                              fill
                              className="object-cover rounded"
                            />
                            {progress?.status === 'completed' && (
                              <div className="absolute inset-0 bg-green-500/20 rounded flex items-center justify-center">
                                <CheckCircle className="h-6 w-6 text-green-500" />
                              </div>
                            )}
                            {progress?.status === 'error' && (
                              <div className="absolute inset-0 bg-red-500/20 rounded flex items-center justify-center">
                                <AlertTriangle className="h-6 w-6 text-red-500" />
                              </div>
                            )}
                          </div>

                          {/* File Info */}
                          <div className="flex-1 space-y-2">
                            <div className="flex justify-between items-start">
                              <div className="flex-1 mr-2">
                                <Input
                                  value={selectedFile.title}
                                  onChange={(e) => updateFileTitle(selectedFile.id, e.target.value)}
                                  placeholder="Tiêu đề ảnh..."
                                  className="text-sm h-8"
                                  disabled={isUploading}
                                />
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeFile(selectedFile.id)}
                                disabled={isUploading}
                                className="text-red-500 hover:bg-red-50 h-8 w-8 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>

                            <Input
                              value={selectedFile.description}
                              onChange={(e) => updateFileDescription(selectedFile.id, e.target.value)}
                              placeholder="Mô tả ảnh..."
                              className="text-sm h-8"
                              disabled={isUploading}
                            />

                            <div className="flex justify-between items-center text-xs text-muted-foreground">
                              <span>{formatBytes(selectedFile.file.size)}</span>
                              {selectedFile.error && (
                                <span className="text-red-500">{selectedFile.error}</span>
                              )}
                            </div>

                            {/* Progress Bar */}
                            {progress && progress.status === 'uploading' && (
                              <div className="space-y-1">
                                <Progress value={progress.progress} className="h-1" />
                                <p className="text-xs text-muted-foreground">
                                  Đang tải lên... {progress.progress}%
                                </p>
                              </div>
                            )}

                            {progress?.status === 'completed' && (
                              <p className="text-xs text-green-600">✓ Tải lên thành công</p>
                            )}

                            {progress?.status === 'error' && (
                              <p className="text-xs text-red-600">✗ {progress.error}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={handleClose}
              disabled={isUploading}
            >
              {isUploading ? 'Đang tải...' : 'Hủy'}
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={validFilesCount === 0 || isUploading}
              className="bg-[#93E1D8] hover:bg-[#93E1D8]/90"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? `Đang tải ${uploadProgress.filter(p => p.status === 'completed').length}/${uploadProgress.length}...` : `Tải lên ${validFilesCount} ảnh`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}