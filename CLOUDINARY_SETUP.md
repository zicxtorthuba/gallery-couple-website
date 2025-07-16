# Cloudinary Setup Guide

This guide will help you set up Cloudinary to replace EdgeStore for image uploads in your application.

## 1. Create a Cloudinary Account

1. Go to [Cloudinary](https://cloudinary.com/) and create a free account
2. After signing up, you'll be taken to your dashboard
3. Note down your **Cloud Name**, **API Key**, and **API Secret**

## 2. Configure Environment Variables

Update your `.env.local` file with your Cloudinary credentials:

```env
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name_here"
CLOUDINARY_API_KEY="your_api_key_here"
CLOUDINARY_API_SECRET="your_api_secret_here"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="ml_default"
```

## 3. Set Up Upload Preset (Optional but Recommended)

For better security and control, create a custom upload preset:

1. Go to your Cloudinary dashboard
2. Navigate to **Settings** → **Upload**
3. Scroll down to **Upload presets**
4. Click **Add upload preset**
5. Configure the preset:
   - **Preset name**: `your_app_name` (e.g., `gallery_uploads`)
   - **Signing Mode**: `Unsigned` (for client-side uploads)
   - **Folder**: Set a default folder like `gallery` or `blog`
   - **Allowed formats**: `jpg,png,gif,webp`
   - **Max file size**: Set appropriate limits (e.g., 10MB)
   - **Image transformations**: Add any default transformations you want

6. Save the preset and update your environment variable:
   ```env
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="your_preset_name"
   ```

## 4. Install Dependencies

The required dependencies are already added to your `package.json`. Run:

```bash
npm install
```

## 5. Features Implemented

### Gallery Page (`app/gallery/page.tsx`)
- ✅ Upload images to Cloudinary with folder organization
- ✅ Delete images from Cloudinary when removed from gallery
- ✅ Automatic tagging and context metadata
- ✅ File size validation and storage tracking

### Blog Editor (`components/blog/BlogEditor.tsx`)
- ✅ Upload featured images to Cloudinary
- ✅ Delete old featured images when replacing
- ✅ Organized in `blog` folder with proper tagging

### API Routes
- ✅ `/api/cloudinary/delete` - Server-side image deletion

## 6. Migration Benefits

### Advantages over EdgeStore:
- **Higher free tier limits**: 25GB storage vs EdgeStore's limited free tier
- **Better image optimization**: Automatic format conversion and compression
- **Advanced transformations**: Resize, crop, and optimize images on-the-fly
- **CDN delivery**: Global content delivery network for faster loading
- **Better analytics**: Detailed usage statistics and monitoring

### File Organization:
- Gallery images: `gallery/` folder
- Blog featured images: `blog/` folder
- Automatic tagging for better organization

## 7. Usage Examples

### Upload with Custom Options
```typescript
const result = await uploadToCloudinary(file, {
  folder: 'gallery',
  tags: ['user-upload', 'gallery'],
  context: {
    title: 'My Image',
    description: 'Beautiful sunset'
  }
});
```

### Image Transformations (Future Enhancement)
You can add URL transformations for automatic optimization:
```typescript
// Example: Auto-optimize and resize
const optimizedUrl = result.secure_url.replace(
  '/upload/',
  '/upload/f_auto,q_auto,w_800/'
);
```

## 8. Security Considerations

1. **Upload Presets**: Use unsigned presets for client-side uploads
2. **Folder Structure**: Organize uploads in specific folders
3. **File Validation**: Client and server-side validation implemented
4. **Size Limits**: Enforced through upload presets and application logic

## 9. Monitoring and Analytics

Access your Cloudinary dashboard to monitor:
- Storage usage
- Bandwidth consumption
- Transformation usage
- Popular images and access patterns

## 10. Troubleshooting

### Common Issues:

1. **Upload fails with 401 error**
   - Check your API credentials in `.env.local`
   - Ensure upload preset exists and is set to "Unsigned"

2. **Images not displaying**
   - Verify the `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is correct
   - Check browser network tab for CORS issues

3. **Delete operation fails**
   - Ensure `CLOUDINARY_API_SECRET` is correctly set
   - Check server logs for detailed error messages

### Testing the Setup:

1. Try uploading an image in the gallery
2. Verify it appears in your Cloudinary dashboard
3. Test image deletion
4. Check that old EdgeStore images still work (backward compatibility)

## 11. Next Steps (Optional Enhancements)

1. **Image Optimization**: Add automatic format conversion and compression
2. **Responsive Images**: Implement different sizes for different screen sizes
3. **Image Analytics**: Track popular images and usage patterns
4. **Backup Strategy**: Set up automatic backups of your Cloudinary assets

Your application now uses Cloudinary for all new image uploads while maintaining backward compatibility with existing EdgeStore images!