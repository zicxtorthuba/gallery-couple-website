"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  HardDrive, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Database,
  Trash2
} from 'lucide-react';
import { 
  getUserStorageInfo, 
  getUserUploads,
  removeFileUpload,
  formatBytes, 
  getStorageColor,
  type StorageInfo,
  type ImageUpload
} from '@/lib/storage';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

interface StorageIndicatorProps {
  className?: string;
  showDetails?: boolean;
  onStorageUpdate?: (info: StorageInfo) => void;
}

export function StorageIndicator({ 
  className = '', 
  showDetails = true,
  onStorageUpdate 
}: StorageIndicatorProps) {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [uploads, setUploads] = useState<ImageUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');
  const [showUploads, setShowUploads] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadStorageInfo();
    loadUser();
  }, []);

  const loadUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  };

  const loadStorageInfo = async () => {
    try {
      setLoading(true);
      const info = await getUserStorageInfo();
      setStorageInfo(info);
      onStorageUpdate?.(info);
      
      if (showDetails) {
        const userUploads = await getUserUploads();
        setUploads(userUploads);
      }
    } catch (error) {
      console.error('Error loading storage info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStorageInfo();
    setRefreshing(false);
    setMessage('Thông tin lưu trữ đã được cập nhật');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleCleanupOrphaned = async () => {
    if (!user) return;
    
    try {
      setRefreshing(true);
      
      // Get all uploads from our database
      const dbUploads = await getUserUploads();
      
      // Check which ones still exist in gallery_images or blog_posts
      const orphanedUploads: ImageUpload[] = [];
      
      for (const upload of dbUploads) {
        let exists = false;
        
        if (upload.type === 'gallery') {
          const { data } = await supabase
            .from('gallery_images')
            .select('id')
            .eq('url', upload.url)
            .single();
          exists = !!data;
        } else if (upload.type === 'blog') {
          const { data } = await supabase
            .from('blog_posts')
            .select('id')
            .eq('featured_image', upload.url)
            .single();
          exists = !!data;
        }
        
        if (!exists) {
          orphanedUploads.push(upload);
        }
      }
      
      // Remove orphaned records
      for (const orphaned of orphanedUploads) {
        await removeFileUpload(orphaned.url);
      }
      
      await loadStorageInfo();
      setMessage(`Đã dọn dẹp ${orphanedUploads.length} bản ghi không còn sử dụng`);
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      console.error('Error cleaning up orphaned uploads:', error);
      setMessage('Có lỗi xảy ra khi dọn dẹp dữ liệu');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRemoveUpload = async (upload: ImageUpload) => {
    try {
      const success = await removeFileUpload(upload.url);
      if (success) {
        await loadStorageInfo();
        setMessage('Đã xóa bản ghi tải lên');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error removing upload record:', error);
      setMessage('Có lỗi xảy ra khi xóa bản ghi');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#93E1D8]"></div>
        <span className="text-sm text-muted-foreground">Đang tải thông tin lưu trữ...</span>
      </div>
    );
  }

  if (!storageInfo) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-500" />
        <AlertDescription className="text-red-700">
          Không thể tải thông tin lưu trữ
        </AlertDescription>
      </Alert>
    );
  }

  const warningLevel = storageInfo.percentage >= 90 ? 'critical' : 
                     storageInfo.percentage >= 75 ? 'warning' : 'normal';

  return (
    <div className={className}>
      {/* Success/Error Messages */}
      {message && (
        <Alert className={message.includes('Lỗi') ? 'border-red-200 bg-red-50 mb-4' : 'border-green-200 bg-green-50 mb-4'}>
          {message.includes('Lỗi') ? (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
          <AlertDescription className={message.includes('Lỗi') ? 'text-red-700' : 'text-green-700'}>
            {message}
          </AlertDescription>
        </Alert>
      )}

      <Card className="bg-white/95 backdrop-blur-sm border-white/50 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Dung lượng lưu trữ
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
                className="h-8"
              >
                <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              {showDetails && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowUploads(!showUploads)}
                  className="h-8"
                >
                  <Database className="h-3 w-3 mr-1" />
                  {showUploads ? 'Ẩn' : 'Chi tiết'}
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Storage Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Đã sử dụng: {formatBytes(storageInfo.used)}</span>
              <span>Còn lại: {formatBytes(storageInfo.remaining)}</span>
            </div>
            <Progress 
              value={Math.min(storageInfo.percentage, 100)} 
              className="h-2"
              style={{
                '--progress-background': getStorageColor(storageInfo.percentage)
              } as React.CSSProperties}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{storageInfo.percentage.toFixed(1)}% đã sử dụng</span>
              <span>Tổng: {formatBytes(storageInfo.limit)}</span>
            </div>
          </div>

          {/* Warning Messages */}
          {warningLevel === 'critical' && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-700">
                <strong>Cảnh báo:</strong> Dung lượng gần hết! Vui lòng xóa một số ảnh để giải phóng không gian.
              </AlertDescription>
            </Alert>
          )}

          {warningLevel === 'warning' && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-700">
                <strong>Chú ý:</strong> Bạn đã sử dụng hơn 75% dung lượng lưu trữ.
              </AlertDescription>
            </Alert>
          )}

          {/* Cleanup Button */}
          {showDetails && uploads.length > 0 && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCleanupOrphaned}
                disabled={refreshing}
                className="text-blue-600 hover:text-blue-700"
              >
                <Database className="h-3 w-3 mr-1" />
                Dọn dẹp dữ liệu
              </Button>
            </div>
          )}

          {/* Upload Details */}
          {showDetails && showUploads && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Chi tiết tải lên ({uploads.length} file)</h4>
                <span className="text-xs text-muted-foreground">
                  Tổng: {formatBytes(uploads.reduce((sum, upload) => sum + upload.size, 0))}
                </span>
              </div>
              
              {uploads.length > 0 ? (
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {uploads.map((upload) => (
                    <div key={upload.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{upload.filename}</p>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="capitalize">{upload.type}</span>
                          <span>•</span>
                          <span>{formatBytes(upload.size)}</span>
                          <span>•</span>
                          <span>{new Date(upload.uploadedAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveUpload(upload)}
                        className="text-red-500 hover:text-red-600 h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Chưa có file nào được tải lên
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}