"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HardDrive, AlertTriangle, Info, Wifi, WifiOff } from 'lucide-react';
import { 
  getUserStorageInfo, 
  formatBytes, 
  getStorageWarningLevel, 
  getStorageColor,
  type StorageInfo 
} from '@/lib/storage';
import { cn } from '@/lib/utils';

interface StorageIndicatorProps {
  className?: string;
  showDetails?: boolean;
  onStorageUpdate?: (info: StorageInfo) => void;
}

export function StorageIndicator({ 
  className, 
  showDetails = true, 
  onStorageUpdate 
}: StorageIndicatorProps) {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadStorageInfo = async () => {
    if (!isOnline) {
      setError('Không có kết nối internet');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const info = await getUserStorageInfo();
      setStorageInfo(info);
      onStorageUpdate?.(info);
    } catch (error: any) {
      console.error('Error loading storage info:', error);
      
      if (error.message?.includes('Failed to fetch') || error.message?.includes('fetch')) {
        setError('Lỗi kết nối mạng');
      } else {
        setError('Không thể tải thông tin lưu trữ');
      }
      
      // Provide fallback data
      const fallbackInfo: StorageInfo = {
        used: 0,
        limit: 1024 * 1024 * 1024, // 1GB
        percentage: 0,
        remaining: 1024 * 1024 * 1024
      };
      setStorageInfo(fallbackInfo);
      onStorageUpdate?.(fallbackInfo);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStorageInfo();
  }, [isOnline]);

  // Auto-refresh every 30 seconds when online
  useEffect(() => {
    if (!isOnline) return;
    
    const interval = setInterval(loadStorageInfo, 30000);
    return () => clearInterval(interval);
  }, [isOnline]);

  if (loading) {
    return (
      <Card className={cn("border-gray-200", className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#93E1D8]"></div>
            <span className="text-sm text-muted-foreground">Đang tải thông tin lưu trữ...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!storageInfo) {
    return null;
  }

  const warningLevel = getStorageWarningLevel(storageInfo.percentage);
  const storageColor = getStorageColor(storageInfo.percentage);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Connection Status */}
      {!isOnline && (
        <Alert className="border-red-200 bg-red-50">
          <WifiOff className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-700">
            Không có kết nối internet. Thông tin lưu trữ có thể không chính xác.
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-700">
            {error}. Hiển thị dữ liệu dự phòng.
          </AlertDescription>
        </Alert>
      )}

      {/* Storage Info Card */}
      <Card className={cn(
        "border-gray-200",
        warningLevel === 'critical' && "border-red-200 bg-red-50",
        warningLevel === 'warning' && "border-yellow-200 bg-yellow-50"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-[#93E1D8]" />
              <span className="font-medium text-sm">Dung lượng lưu trữ</span>
              {!isOnline && <WifiOff className="h-3 w-3 text-red-500" />}
            </div>
            <span className="text-sm text-muted-foreground">
              {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.limit)}
            </span>
          </div>

          <div className="space-y-2">
            <Progress 
              value={storageInfo.percentage} 
              className="h-2"
              style={{
                '--progress-background': storageColor
              } as React.CSSProperties}
            />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{storageInfo.percentage.toFixed(1)}% đã sử dụng</span>
              <span>{formatBytes(storageInfo.remaining)} còn lại</span>
            </div>
          </div>

          {showDetails && (
            <>
              {/* Warning Messages */}
              {warningLevel === 'critical' && (
                <Alert className="mt-3 border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-700 text-xs">
                    <strong>Cảnh báo:</strong> Dung lượng gần hết! Vui lòng xóa một số ảnh để giải phóng không gian.
                  </AlertDescription>
                </Alert>
              )}

              {warningLevel === 'warning' && (
                <Alert className="mt-3 border-yellow-200 bg-yellow-50">
                  <Info className="h-4 w-4 text-yellow-500" />
                  <AlertDescription className="text-yellow-700 text-xs">
                    <strong>Lưu ý:</strong> Dung lượng đang cao. Hãy cân nhắc xóa các ảnh không cần thiết.
                  </AlertDescription>
                </Alert>
              )}

              {/* Storage Tips */}
              <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-muted-foreground">
                <p><strong>Mẹo:</strong> Mỗi ảnh tối đa 5MB. Xóa ảnh cũ để tải lên ảnh mới.</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}