// Storage management utilities for EdgeStore
import { supabase } from './supabase';
import { getCurrentUser } from './auth';

export interface StorageInfo {
  used: number; // bytes
  limit: number; // bytes
  percentage: number;
  remaining: number; // bytes
}

export interface ImageUpload {
  id: string;
  url: string;
  filename: string;
  size: number; // bytes
  uploadedAt: string;
  userId: string;
  type: 'gallery' | 'blog';
  associatedId?: string; // gallery image id or blog post id
}

// Constants
export const STORAGE_LIMIT = 1024 * 1024 * 1024; // 1GB in bytes
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

// Format bytes to human readable
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Check if file size is within limit
export const isFileSizeValid = (file: File): boolean => {
  return file.size <= MAX_FILE_SIZE;
};

// Get user's storage info
export const getUserStorageInfo = async (): Promise<StorageInfo> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        used: 0,
        limit: STORAGE_LIMIT,
        percentage: 0,
        remaining: STORAGE_LIMIT
      };
    }

    const { data, error } = await supabase
      .from('user_uploads')
      .select('size')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching storage info:', error);
      return {
        used: 0,
        limit: STORAGE_LIMIT,
        percentage: 0,
        remaining: STORAGE_LIMIT
      };
    }

    const used = data?.reduce((total, upload) => total + upload.size, 0) || 0;
    const percentage = (used / STORAGE_LIMIT) * 100;
    const remaining = STORAGE_LIMIT - used;

    return {
      used,
      limit: STORAGE_LIMIT,
      percentage,
      remaining
    };
  } catch (error) {
    console.error('Error in getUserStorageInfo:', error);
    return {
      used: 0,
      limit: STORAGE_LIMIT,
      percentage: 0,
      remaining: STORAGE_LIMIT
    };
  }
};

// Check if user has enough storage space
export const hasStorageSpace = async (fileSize: number): Promise<boolean> => {
  const storageInfo = await getUserStorageInfo();
  return storageInfo.remaining >= fileSize;
};

// Record file upload
export const recordFileUpload = async (
  url: string,
  filename: string,
  size: number,
  type: 'gallery' | 'blog',
  associatedId?: string
): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    const { error } = await supabase
      .from('user_uploads')
      .insert({
        url,
        filename,
        size,
        user_id: user.id,
        type,
        associated_id: associatedId
      });

    if (error) {
      console.error('Error recording file upload:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in recordFileUpload:', error);
    return false;
  }
};

// Remove file upload record
export const removeFileUpload = async (url: string): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    const { error } = await supabase
      .from('user_uploads')
      .delete()
      .eq('url', url)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error removing file upload record:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in removeFileUpload:', error);
    return false;
  }
};

// Get user's uploads
export const getUserUploads = async (): Promise<ImageUpload[]> => {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('user_uploads')
      .select('*')
      .eq('user_id', user.id)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching user uploads:', error);
      return [];
    }

    return data?.map(upload => ({
      id: upload.id,
      url: upload.url,
      filename: upload.filename,
      size: upload.size,
      uploadedAt: upload.uploaded_at,
      userId: upload.user_id,
      type: upload.type,
      associatedId: upload.associated_id
    })) || [];
  } catch (error) {
    console.error('Error in getUserUploads:', error);
    return [];
  }
};