"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  HardDrive, 
  AlertTriangle, 
  AlertCircle,
  Info
} from 'lucide-react';
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

  useEffect(() => {
    loadStorageInfo();
    
    // Refresh storage info every 30 seconds
    const interval = setInterval(loadStorageInfo, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadStorageInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const info = await getUserStorageInfo();
      setStorageInfo(info);
      onStorageUpdate?.(info);
    } catch (error) {
      console.error('Error loading storage info:', error);
      setError('Không thể tải thông tin dung lượng');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <HardDrive className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <div className="h-2 bg-gray-200 rounded-full animate-pulse"></div>
              <p className="text-sm text-muted-foreground mt-1">Đang tải...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50">
        <Info className="h-4 w-4 text-yellow-500" />
        <AlertDescription className="text-yellow-700">
          {error}. Tính năng theo dõi dung lượng sẽ hoạt động sau khi cơ sở dữ liệu được cập nhật.
        </AlertDescription>
      </Alert>
    );
  }

  if (!storageInfo) return null;

  const warningLevel = getStorageWarningLevel(storageInfo.percentage);
  const storageColor = getStorageColor(storageInfo.percentage);

  const getWarningMessage = () => {
    switch (warningLevel) {
      case 'critical':
        return {
          icon: AlertCircle,
          message: 'Dung lượng lưu trữ gần hết! Vui lòng xóa một số ảnh để giải phóng không gian.',
          className: 'border-red-200 bg-red-50 text-red-700'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          message: 'Dung lượng lưu trữ đang cao. Hãy cân nhắc xóa một số ảnh không cần thiết.',
          className: 'border-amber-200 bg-amber-50 text-amber-700'
        };
      default:
        return null;
    }
  };

  const warning = getWarningMessage();

  return (
    <div className={cn("space-y-4", className)}>
      {/* Storage Progress Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Dung lượng lưu trữ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Đã sử dụng</span>
              <span className="font-medium">
                {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.limit)}
              </span>
            </div>
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
            <div className="grid grid-cols-3 gap-4 pt-2 border-t">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Đã dùng</p>
                <p className="text-sm font-medium">{formatBytes(storageInfo.used)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Còn lại</p>
                <p className="text-sm font-medium">{formatBytes(storageInfo.remaining)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Tổng cộng</p>
                <p className="text-sm font-medium">{formatBytes(storageInfo.limit)}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Warning Alert */}
      {warning && (
        <Alert className={warning.className}>
          <warning.icon className="h-4 w-4" />
          <AlertDescription>
            {warning.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}