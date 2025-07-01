import './globals.css';
import type { Metadata } from 'next';
import { Inter, Cormorant_Garamond } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { EdgeStoreProvider } from '@/lib/edgestore';
import { SessionProvider } from 'next-auth/react';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  variable: '--font-cormorant',
});

export const metadata: Metadata = {
  title: 'Zunhee | Gallery and memories',
  description: 'Capturing your beautiful moments together. Professional couple photography and gallery services.',
  icons: {
    icon: 'images/logo.png',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${cormorant.variable} font-sans`}>
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
          >
            <EdgeStoreProvider>
              {children}
              <Toaster />
            </EdgeStoreProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}