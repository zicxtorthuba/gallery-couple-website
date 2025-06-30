import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Dancing_Script } from 'next/font/google';

const galleries = [
  {
    id: 1,
    title: 'Lorem Ipsum',
    description: 'Lorem Ipsum',
    image: 'https://images.pexels.com/photos/1122639/pexels-photo-1122639.jpeg',
    count: 10,
  },
  {
    id: 2,
    title: 'Lorem Ipsum',
    description: 'Lorem Ipsum',
    image: 'https://images.pexels.com/photos/1381679/pexels-photo-1381679.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    count: 10,
  },
  {
    id: 3,
    title: 'Lorep Ipsum',
    description: 'Lorem Ipsum',
    image: 'https://images.pexels.com/photos/3040705/pexels-photo-3040705.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    count: 10,
  },
];

export function GalleryPreview() {
  return (
    <section id="gallery-preview" className="py-24 bg-[#DDFFF7]/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-cormorant text-4xl md:text-5xl font-light mb-4 {dancing.classname}">Bộ sưu tập</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Bộ sưu tập theo chủ đề, từ những khoảnh khắc hấp dẫn đến những kỷ niệm đáng nhớ.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {galleries.map((gallery) => (
            <div 
              key={gallery.id} 
              className="group overflow-hidden rounded-xl border border-[#93E1D8]/20 bg-white shadow-sm transition-all hover:shadow-md"
            >
              <div className="relative h-80 overflow-hidden">
                <Image
                  src={gallery.image}
                  alt={gallery.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 p-6">
                    <p className="text-white text-sm">{gallery.count} Photos</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-cormorant text-2xl font-medium mb-2">{gallery.title}</h3>
                <p className="text-muted-foreground mb-4">{gallery.description}</p>
                <Link href={`/gallery/${gallery.id}`}>
                  <Button variant="outline" className="border-[#93E1D8] text-[#93E1D8] hover:bg-[#93E1D8]/10">
                    Xem bộ sưu tập
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <Link href="/gallery">
            <Button className="bg-[#93E1D8] text-white hover:bg-[#93E1D8]/90 px-8">
              Xem toàn bộ bộ sưu tập
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}