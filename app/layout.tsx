import './globals.css';
import type { Metadata } from 'next';
import { Inter, Oswald, Dancing_Script, Amatic_SC, VT323, Edu_QLD_Beginner } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { EdgeStoreProvider } from '@/lib/edgestore';
import OnlineIndicator from '@/components/OnlineIndicator';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

const cormorant = Oswald({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  variable: '--font-cormorant',
});

const dancingScript = Dancing_Script({
  subsets: ['latin'],
  variable: '--font-dancing-script',
});

const amaticSC = Amatic_SC({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-amatic-sc',
});

const vt323 = VT323({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-vt323',
});

const eduQLD = Edu_QLD_Beginner({
  subsets: ['latin'],
  variable: '--font-edu-qld',
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
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Playwrite+VN:wght@100..400&family=Pinyon+Script&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.variable} ${cormorant.variable} ${dancingScript.variable} ${amaticSC.variable} ${vt323.variable} ${eduQLD.variable} font-sans bg-[#7FFFD4]`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
        >
          <EdgeStoreProvider>
            {children}
            <OnlineIndicator />
            <Toaster />
          </EdgeStoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}