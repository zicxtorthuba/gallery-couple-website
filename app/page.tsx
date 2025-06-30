import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { GalleryPreview } from "@/components/GalleryPreview";
import { BlogPreview } from "@/components/BlogPreview";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <GalleryPreview />
      <BlogPreview />
      <Footer />
    </main>
  );
}