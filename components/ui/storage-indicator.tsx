"use client";

import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HardDrive, AlertTriangle, Info } from 'lucide-react';
import { getUserStorageInfo, formatBytes, type StorageInfo } from '@/lib/storage';

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
  const [storageInfo, setStorageInfo] = useState<StorageInfo>({
    used: 0,
    limit: 1024 * 1024 * 1024, // 1GB
    percentage: 0,
    remaining: 1024 * 1024 * 1024
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStorageInfo();
  }, []);

  const loadStorageInfo = async () => {
    try {
      setLoading(true);
      const info = await getUserStorageInfo();
      setStorageInfo(info);
      onStorageUpdate?.(info);
    } catch (error) {
      console.error('Error loading storage info:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = () => {
    if (storageInfo.percentage >= 90) return 'bg-red-500';
    if (storageInfo.percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getAlertType = () => {
    if (storageInfo.percentage >= 90) return 'destructive';
    if (storageInfo.percentage >= 75) return 'warning';
    return 'info';
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-2 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className={className}>
      {showDetails && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <HardDrive className="h-5 w-5 text-[#93E1D8]" />
              <div className="flex-1">
                <h3 className="font-medium text-sm">Dung lượng lưu trữ</h3>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.limit)} đã sử dụng
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{storageInfo.percentage.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">
                  Còn lại: {formatBytes(storageInfo.remaining)}
                </p>
              </div>
            </div>
            
            <Progress 
              value={storageInfo.percentage} 
              className="h-2"
            />
          </CardContent>
        </Card>
      )}

      {/* Storage Warnings */}
      {storageInfo.percentage >= 75 && (
        <Alert className={`mb-4 ${
          storageInfo.percentage >= 90 
            ? 'border-red-200 bg-red-50' 
            : 'border-yellow-200 bg-yellow-50'
        }`}>
          {storageInfo.percentage >= 90 ? (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          ) : (
            <Info className="h-4 w-4 text-yellow-600" />
          )}
          <AlertDescription className={
            storageInfo.percentage >= 90 ? 'text-red-700' : 'text-yellow-700'
          }>
            {storageInfo.percentage >= 90 ? (
              <>
                <strong>Dung lượng gần hết!</strong> Bạn đã sử dụng {storageInfo.percentage.toFixed(1)}% 
                dung lượng. Hãy xóa một số ảnh để giải phóng không gian.
              </>
            ) : (
              <>
                <strong>Cảnh báo dung lượng:</strong> Bạn đã sử dụng {storageInfo.percentage.toFixed(1)}% 
                dung lượng lưu trữ.
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Storage Full */}
      {storageInfo.remaining <= 0 && (
        <Alert className="border-red-200 bg-red-50 mb-4">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-700">
            <strong>Hết dung lượng!</strong> Bạn không thể tải thêm ảnh. 
            Hãy xóa một số ảnh để giải phóng không gian.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}