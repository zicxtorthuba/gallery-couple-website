import './globals.css';
import type { Metadata } from 'next';
import { Inter, Cormorant_Garamond } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { EdgeStoreProvider } from '@/lib/edgestore';
import { Analytics } from '@/components/Analytics';
import { PerformanceMonitor } from '@/components/PerformanceMonitor';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  variable: '--font-cormorant',
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: 'Zunhee | Gallery and Memories',
    template: '%s | Zunhee'
  },
  description: 'Capturing your beautiful moments together. Professional couple photography and gallery services. Share your memories, create stunning galleries, and preserve your precious moments.',
  keywords: ['photography', 'gallery', 'memories', 'couples', 'blog', 'photo sharing', 'Vietnam'],
  authors: [{ name: 'Zunhee Team' }],
  creator: 'Zunhee',
  publisher: 'Zunhee',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://zunhee.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: 'https://zunhee.vercel.app',
    title: 'Zunhee | Gallery and Memories',
    description: 'Capturing your beautiful moments together. Professional couple photography and gallery services.',
    siteName: 'Zunhee',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Zunhee - Gallery and Memories',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zunhee | Gallery and Memories',
    description: 'Capturing your beautiful moments together. Professional couple photography and gallery services.',
    images: ['/images/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/images/logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/logo.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/images/logo.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.pexels.com" />
        <link rel="dns-prefetch" href="https://files.edgestore.dev" />
        <meta name="theme-color" content="#93E1D8" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Zunhee" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#93E1D8" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className={`${inter.variable} ${cormorant.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
        >
          <EdgeStoreProvider>
            <PerformanceMonitor />
            {children}
            <Toaster />
            <Analytics />
          </EdgeStoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}