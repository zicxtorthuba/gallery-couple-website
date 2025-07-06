"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AuthGuard } from '@/components/AuthGuard';
import { BlogList } from '@/components/blog/BlogList';
import { BlogEditor } from '@/components/blog/BlogEditor';
import { TagManager } from '@/components/blog/TagManager';
import { BlogPost } from '@/lib/blog-supabase';

type ViewMode = 'list' | 'editor' | 'tags';

function BlogContent() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  const handleCreatePost = () => {
    setEditingPost(null);
    setViewMode('editor');
  };

  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setViewMode('editor');
  };

  const handleSavePost = (post: BlogPost) => {
    setViewMode('list');
    setEditingPost(null);
  };

  const handleCancelEdit = () => {
    setViewMode('list');
    setEditingPost(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          {viewMode === 'list' && (
            <Tabs defaultValue="posts" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="posts">Bài viết</TabsTrigger>
                <TabsTrigger value="tags">Quản lý thẻ</TabsTrigger>
              </TabsList>

              <TabsContent value="posts">
                <div className="content-container rounded-3xl p-8 shadow-lg">
                  <BlogList 
                    onCreatePost={handleCreatePost}
                    onEditPost={handleEditPost}
                  />
                </div>
              </TabsContent>

              <TabsContent value="tags">
                <TagManager />
              </TabsContent>
            </Tabs>
          )}

          {viewMode === 'editor' && (
            <BlogEditor
              post={editingPost || undefined}
              onSave={handleSavePost}
              onCancel={handleCancelEdit}
            />
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
      <div className="min-h-screen" style={{ backgroundColor: '#FFA69E' }}>
        <BlogContent />
      </div>
      <Footer />
    </AuthGuard>
  );
}