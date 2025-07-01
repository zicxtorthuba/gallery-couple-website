"use client";

import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { 
  HardDrive, 
  AlertTriangle, 
  Info,
  Database
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
    } catch (error: any) {
      console.error('Error loading storage info:', error);
      setError('Không thể tải thông tin dung lượng');
      
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

  if (loading) {
    return (
      <Card className={cn("border-gray-200", className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#93E1D8]"></div>
            <span className="text-sm text-muted-foreground">Đang tải thông tin dung lượng...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !storageInfo) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-500" />
        <AlertDescription className="text-yellow-700">
          {error || 'Không thể tải thông tin dung lượng'}
        </AlertDescription>
      </Alert>
    );
  }

  const warningLevel = getStorageWarningLevel(storageInfo.percentage);
  const storageColor = getStorageColor(storageInfo.percentage);

  if (!showDetails && warningLevel === 'normal') {
    return null; // Don't show if storage is normal and details are hidden
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Storage Warning Alert */}
      {warningLevel !== 'normal' && (
        <Alert className={cn(
          warningLevel === 'critical' 
            ? 'border-red-200 bg-red-50' 
            : 'border-yellow-200 bg-yellow-50'
        )}>
          <AlertTriangle className={cn(
            "h-4 w-4",
            warningLevel === 'critical' ? 'text-red-500' : 'text-yellow-500'
          )} />
          <AlertDescription className={cn(
            warningLevel === 'critical' ? 'text-red-700' : 'text-yellow-700'
          )}>
            {warningLevel === 'critical' 
              ? `Dung lượng gần hết! Còn lại ${formatBytes(storageInfo.remaining)}`
              : `Cảnh báo: Đã sử dụng ${storageInfo.percentage.toFixed(1)}% dung lượng`
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Storage Details Card */}
      {showDetails && (
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-[#93E1D8]" />
                  <span className="font-medium text-sm">Dung lượng lưu trữ</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  EdgeStore (1GB)
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <Progress 
                  value={storageInfo.percentage} 
                  className="h-2"
                  style={{
                    '--progress-background': storageColor
                  } as React.CSSProperties}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatBytes(storageInfo.used)} đã sử dụng</span>
                  <span>{formatBytes(storageInfo.remaining)} còn lại</span>
                </div>
              </div>

              {/* Usage Stats */}
              <div className="grid grid-cols-3 gap-4 pt-2 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Đã dùng</div>
                  <div className="font-medium text-sm">{storageInfo.percentage.toFixed(1)}%</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Còn lại</div>
                  <div className="font-medium text-sm">{formatBytes(storageInfo.remaining)}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Tổng cộng</div>
                  <div className="font-medium text-sm">{formatBytes(storageInfo.limit)}</div>
                </div>
              </div>

              {/* Tips */}
              {warningLevel !== 'normal' && (
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-start gap-2">
                    <Info className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-muted-foreground">
                      <strong>Mẹo:</strong> Xóa những ảnh không cần thiết để giải phóng dung lượng. 
                      Mỗi ảnh tối đa 5MB.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}