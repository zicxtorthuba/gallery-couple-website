import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      blog_posts: {
        Row: {
          id: string;
          title: string;
          content: string;
          excerpt: string | null;
          featured_image: string | null;
          custom_icon: string | null;
          author_id: string;
          author_name: string;
          author_avatar: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
          read_time: number;
          likes: number;
          comments: number;
          tags: string[];
          status: 'draft' | 'published';
          revision_history: any[];
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          excerpt?: string | null;
          featured_image?: string | null;
          custom_icon?: string | null;
          author_id: string;
          author_name: string;
          author_avatar?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
          read_time?: number;
          likes?: number;
          comments?: number;
          tags?: string[];
          status?: 'draft' | 'published';
          revision_history?: any[];
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          excerpt?: string | null;
          featured_image?: string | null;
          custom_icon?: string | null;
          author_id?: string;
          author_name?: string;
          author_avatar?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
          read_time?: number;
          likes?: number;
          comments?: number;
          tags?: string[];
          status?: 'draft' | 'published';
          revision_history?: any[];
        };
      };
      blog_tags: {
        Row: {
          id: string;
          name: string;
          color: string;
          category: string | null;
          post_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color?: string;
          category?: string | null;
          post_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string;
          category?: string | null;
          post_count?: number;
          created_at?: string;
        };
      };
    };
  };
};