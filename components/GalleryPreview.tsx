import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ImageIcon, Upload } from 'lucide-react';

export function GalleryPreview() {
  return (
    <section id="gallery-preview" className="py-24 bg-[#DDFFF7]/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-cormorant text-4xl md:text-5xl font-light mb-4">Bộ sưu tập</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Bộ sưu tập theo chủ đề, từ những khoảnh khắc hấp dẫn đến những kỷ niệm đáng nhớ.
          </p>
        </div>

        {/* Empty State */}
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 bg-[#93E1D8]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <ImageIcon className="h-12 w-12 text-[#93E1D8]" />
            </div>
            <h3 className="font-cormorant text-2xl font-light mb-2">
              Chưa có bộ sưu tập nào
            </h3>
            <p className="text-muted-foreground mb-6">
              Hãy bắt đầu bằng cách tạo bộ sưu tập đầu tiên và tải lên những bức ảnh đẹp nhất của bạn
            </p>
            <Link href="/gallery">
              <Button className="bg-[#93E1D8] hover:bg-[#93E1D8]/90 text-white px-6 py-3 rounded-full">
                <Upload className="h-4 w-4 mr-2" />
                Bắt đầu tạo bộ sưu tập
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}