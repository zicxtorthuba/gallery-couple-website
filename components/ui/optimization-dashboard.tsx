"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  Image as ImageIcon, 
  TrendingDown, 
  Globe, 
  Gauge,
  FileImage,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { getOptimizationStats, isCloudinaryUrl, OPTIMIZATION_PRESETS } from '@/lib/cloudinary';

interface OptimizationDashboardProps {
  images: Array<{ id: string; url: string; title: string; size?: number }>;
  className?: string;
}

export function OptimizationDashboard({ images, className = '' }: OptimizationDashboardProps) {
  const [stats, setStats] = useState({
    totalImages: 0,
    optimizedImages: 0,
    totalSavings: 0,
    averageReduction: 0,
    isLoading: true
  });

  const [detailedStats, setDetailedStats] = useState<Array<{
    id: string;
    title: string;
    originalSize: number;
    optimizedSize: number;
    reduction: number;
    savings: number;
  }>>([]);

  useEffect(() => {
    calculateOptimizationStats();
  }, [images]);

  const calculateOptimizationStats = async () => {
    setStats(prev => ({ ...prev, isLoading: true }));

    const cloudinaryImages = images.filter(img => isCloudinaryUrl(img.url));
    const detailed: typeof detailedStats = [];
    let totalSavings = 0;
    let totalReduction = 0;
    let validStats = 0;

    for (const image of cloudinaryImages) {
      try {
        const optimizationStats = await getOptimizationStats(image.url);
        if (optimizationStats) {
          detailed.push({
            id: image.id,
            title: image.title,
            originalSize: optimizationStats.originalSize,
            optimizedSize: optimizationStats.optimizedSize,
            reduction: optimizationStats.reduction,
            savings: optimizationStats.savings
          });
          
          totalSavings += optimizationStats.savings;
          totalReduction += optimizationStats.reduction;
          validStats++;
        }
      } catch (error) {
        console.error(`Failed to get stats for image ${image.id}:`, error);
      }
    }

    setDetailedStats(detailed);
    setStats({
      totalImages: images.length,
      optimizedImages: cloudinaryImages.length,
      totalSavings,
      averageReduction: validStats > 0 ? totalReduction / validStats : 0,
      isLoading: false
    });
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const optimizationPercentage = stats.totalImages > 0 
    ? (stats.optimizedImages / stats.totalImages) * 100 
    : 0;

  if (stats.isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            Analyzing Optimization...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Images</p>
                <p className="text-2xl font-bold">{stats.totalImages}</p>
              </div>
              <ImageIcon className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Optimized</p>
                <p className="text-2xl font-bold text-green-600">{stats.optimizedImages}</p>
              </div>
              <Zap className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data Saved</p>
                <p className="text-2xl font-bold text-purple-600">{formatBytes(stats.totalSavings)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Reduction</p>
                <p className="text-2xl font-bold text-orange-600">{Math.round(stats.averageReduction)}%</p>
              </div>
              <Gauge className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Optimization Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Optimization Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Images Optimized</span>
              <span className="text-sm text-muted-foreground">
                {stats.optimizedImages} of {stats.totalImages}
              </span>
            </div>
            <Progress value={optimizationPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>{Math.round(optimizationPercentage)}% Complete</span>
              <span>100%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Optimization Presets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Available Optimization Presets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(OPTIMIZATION_PRESETS).map(([key, preset]) => (
              <div key={key} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium capitalize">{key}</h4>
                  <Badge variant="outline">{preset.quality}</Badge>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Width: {preset.width}px</div>
                  <div>Format: {preset.fetch_format}</div>
                  <div>Crop: {preset.crop}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Optimization Benefits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <Zap className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <h4 className="font-medium mb-1">Faster Loading</h4>
              <p className="text-sm text-muted-foreground">
                Optimized images load up to 70% faster
              </p>
            </div>
            <div className="text-center p-4">
              <TrendingDown className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <h4 className="font-medium mb-1">Reduced Bandwidth</h4>
              <p className="text-sm text-muted-foreground">
                Save on data costs and improve performance
              </p>
            </div>
            <div className="text-center p-4">
              <Globe className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <h4 className="font-medium mb-1">Global CDN</h4>
              <p className="text-sm text-muted-foreground">
                Images served from the nearest location
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Stats (if available) */}
      {detailedStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5" />
              Detailed Optimization Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {detailedStats.slice(0, 5).map((stat) => (
                <div key={stat.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{stat.title}</h4>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span>Original: {formatBytes(stat.originalSize)}</span>
                      <span>Optimized: {formatBytes(stat.optimizedSize)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={stat.reduction > 50 ? "default" : "secondary"}>
                      -{stat.reduction}%
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      Saved {formatBytes(stat.savings)}
                    </div>
                  </div>
                </div>
              ))}
              {detailedStats.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  And {detailedStats.length - 5} more optimized images...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Button */}
      {stats.optimizedImages < stats.totalImages && (
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="font-medium mb-2">Want to optimize more images?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Re-upload your images to take advantage of automatic optimization
            </p>
            <Button onClick={calculateOptimizationStats} disabled={stats.isLoading}>
              <Sparkles className="h-4 w-4 mr-2" />
              Refresh Stats
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}