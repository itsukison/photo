import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import {
  SITE_URL,
  SITE_NAME,
  STUDIO,
  DEFAULT_OG,
  DEFAULT_TWITTER,
  studioJsonLd,
} from '@/lib/seo';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: '@ Studio ON — Tokyo Photoshoot Studio | Shibuya, Shinjuku, Harajuku',
    template: '%s | @ Studio ON Tokyo',
  },
  description: STUDIO.description,
  applicationName: SITE_NAME,
  authors: [{ name: STUDIO.founder }],
  generator: 'Next.js',
  keywords: [
    'Tokyo photoshoot',
    'Tokyo photographer',
    'Shibuya photoshoot',
    'Shibuya Crossing photographer',
    'Shinjuku photoshoot',
    'Harajuku photoshoot',
    'Asakusa photoshoot',
    'Akihabara photoshoot',
    'Tokyo couple photographer',
    'Tokyo proposal photographer',
    'English-speaking photographer Tokyo',
    'cinematic photoshoot Tokyo',
    'editorial portrait Tokyo',
    'Tokyo vacation photographer',
    '@ Studio ON',
  ],
  category: 'Photography',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    ...DEFAULT_OG,
    url: SITE_URL,
    title: '@ Studio ON — Tokyo Photoshoot Studio',
    description: STUDIO.description,
  },
  twitter: {
    ...DEFAULT_TWITTER,
    title: '@ Studio ON — Tokyo Photoshoot Studio',
    description: STUDIO.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
    shortcut: '/logo.png',
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased" suppressHydrationWarning>
        <JsonLd data={studioJsonLd()} />
        <AuthProvider>
          <Navbar />
          <div className="flex flex-col min-h-screen">
            <div className="flex-1">{children}</div>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
