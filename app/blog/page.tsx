"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchIcon, PlusIcon, BookOpenIcon } from 'lucide-react';
import { blogPosts } from '@/lib/data';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AuthGuard } from '@/components/AuthGuard';

function BlogContent() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPosts = blogPosts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-cormorant text-4xl md:text-5xl font-light mb-4">
              Blog
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Lorem Ipsum
            </p>
          </div>

          {/* Create Post Button */}
          <div className="flex justify-center mb-8">
            <Button className="bg-[#93E1D8] hover:bg-[#93E1D8]/90 text-white px-6 py-3 rounded-full">
              <PlusIcon className="h-4 w-4 mr-2" />
              Tạo bài viết mới
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-12">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm bài viết..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 text-lg border-gray-200 focus:border-[#93E1D8] focus:ring-[#93E1D8]/20"
            />
          </div>

          {/* Empty State */}
          {filteredPosts.length === 0 && (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-[#93E1D8]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookOpenIcon className="h-12 w-12 text-[#93E1D8]" />
                </div>
                <h3 className="font-cormorant text-2xl font-light mb-2">
                  {searchTerm ? 'Không tìm thấy bài viết nào' : 'Chưa có bài viết nào'}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm 
                    ? `Không tìm thấy bài viết nào phù hợp với từ khóa "${searchTerm}"`
                    : 'Hãy bắt đầu chia sẻ những câu chuyện và kinh nghiệm của bạn'
                  }
                </p>
                {!searchTerm && (
                  <Button className="bg-[#93E1D8] hover:bg-[#93E1D8]/90 text-white px-6 py-3 rounded-full">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Tạo bài viết đầu tiên
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BlogPage() {
  return (
    <AuthGuard>
      <Navbar />
      <BlogContent />
      <Footer />
    </AuthGuard>
  );
}