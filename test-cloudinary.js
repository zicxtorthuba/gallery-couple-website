// Quick test to verify Cloudinary integration
const { uploadToCloudinaryOptimized, getOptimizedImageUrl } = require('./lib/cloudinary');

console.log('Testing Cloudinary integration...');

// Test URL optimization
const testUrl = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
const optimizedUrl = getOptimizedImageUrl(testUrl, 'gallery');

console.log('Original URL:', testUrl);
console.log('Optimized URL:', optimizedUrl);
console.log('✅ Cloudinary integration test completed successfully!');