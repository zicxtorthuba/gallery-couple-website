import { BlogPost } from './blog-supabase';

export const getTitleFontClass = (font: BlogPost['titleFont']) => {
  if (!font) return 'font-cormorant'; // Default
  switch (font) {
    case 'serif':
      return 'font-serif';
    case 'sans':
      return 'font-sans';
    case 'mono':
      return 'font-mono';
    default:
      return 'font-cormorant';
  }
};

export const getContentFontClass = (font: BlogPost['contentFont']) => {
  if (!font) return ''; // Default from prose
  switch (font) {
    case 'serif':
      return 'font-serif';
    case 'sans':
      return 'font-sans';
    case 'mono':
      return 'font-mono';
    default:
      return '';
  }
};
