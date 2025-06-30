import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlusIcon, BookOpenIcon } from 'lucide-react';

export function BlogPreview() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-cormorant text-4xl md:text-5xl font-light mb-4">Blog</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Lời khuyên, những bức thư và những câu chuyện tâm sự
          </p>
        </div>

        {/* Empty State */}
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 bg-[#93E1D8]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpenIcon className="h-12 w-12 text-[#93E1D8]" />
            </div>
            <h3 className="font-cormorant text-2xl font-light mb-2">
              Chưa có bài viết nào
            </h3>
            <p className="text-muted-foreground mb-6">
              Hãy bắt đầu chia sẻ những câu chuyện và kinh nghiệm của bạn
            </p>
            <Link href="/blog">
              <Button className="bg-[#93E1D8] hover:bg-[#93E1D8]/90 text-white px-6 py-3 rounded-full">
                <PlusIcon className="h-4 w-4 mr-2" />
                Tạo bài viết đầu tiên
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}