import type { MetadataRoute } from 'next';
import { SITE_NAME } from '@/lib/seo';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Tokyo Photoshoot Studio`,
    short_name: SITE_NAME,
    description:
      'Tokyo cinematic photography studio specializing in Shibuya, Shinjuku, Harajuku, and Akihabara portrait sessions for travelers and couples.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fcfcfc',
    theme_color: '#000000',
    icons: [
      { src: '/logo.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/logo.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
