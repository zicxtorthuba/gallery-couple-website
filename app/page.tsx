import { Metadata } from 'next';
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { GalleryPreview } from "@/components/GalleryPreview";
import { BlogPreview } from "@/components/BlogPreview";
import { Footer } from "@/components/Footer";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: 'Zunhee | Gallery and Memories - Lưu giữ khoảnh khắc đẹp',
  description: 'Chia sẻ và lưu giữ những khoảnh khắc đẹp nhất trong cuộc sống. Tạo bộ sưu tập ảnh, viết blog và kết nối với cộng đồng yêu nhiếp ảnh.',
  keywords: ['nhiếp ảnh', 'thư viện ảnh', 'blog', 'kỷ niệm', 'chia sẻ ảnh', 'Việt Nam'],
  openGraph: {
    title: 'Zunhee | Gallery and Memories',
    description: 'Chia sẻ và lưu giữ những khoảnh khắc đẹp nhất trong cuộc sống',
    type: 'website',
    locale: 'vi_VN',
  },
};

export default function Home() {
  return (
    <ErrorBoundary>
      <main className="min-h-screen">
        <Navbar />
        <Hero />
        <GalleryPreview />
        <BlogPreview />
        <Footer />
      </main>
    </ErrorBoundary>
  );
}