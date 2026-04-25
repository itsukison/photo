import type { Metadata } from 'next';
import ProfileClient from './ProfileClient';

export const metadata: Metadata = {
  title: 'Your Bookings',
  description: 'Manage your @ Studio ON Tokyo photoshoot bookings.',
  alternates: { canonical: '/profile' },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default function ProfilePage() {
  return <ProfileClient />;
}
