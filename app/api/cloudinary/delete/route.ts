import { NextRequest, NextResponse } from 'next/server';
import { deleteFromCloudinary, extractPublicId } from '@/lib/cloudinary';
import { getCurrentUser } from '@/lib/auth';

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const publicId = extractPublicId(url);
    if (!publicId) {
      return NextResponse.json({ error: 'Invalid Cloudinary URL' }, { status: 400 });
    }

    const success = await deleteFromCloudinary(publicId);
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
    }
  } catch (error) {
    console.error('Cloudinary delete API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}