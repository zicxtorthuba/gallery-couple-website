import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { GalleryPreview } from "@/components/GalleryPreview";
import { AlbumPreview } from "@/components/AlbumPreview";
import { BlogPreview } from "@/components/BlogPreview";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <GalleryPreview />
      <AlbumPreview />
      <BlogPreview />
      <Footer />
    </main>
  );
}