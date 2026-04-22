'use client';

import Link from 'next/link';
import { Search, Scan, Aperture } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function Navbar() {
  const { user, signOut } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-4 md:px-6 md:py-6 pointer-events-none">
      <div className="md:hidden pointer-events-auto rounded-full border border-black/10 bg-white/90 px-3 py-2 backdrop-blur-md shadow-[0_8px_26px_rgba(0,0,0,0.12)] mobile-safe-px">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2.5 rounded-full px-1 py-1">
            <img src="/logo.png" alt="@ Studio ON" className="w-8 h-8 object-contain" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/75">@ Studio ON</span>
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              <Link href="/profile" className="mobile-touch-target rounded-full border border-black/10 px-4 text-xs font-medium text-black">
                Profile
              </Link>
              <button
                onClick={signOut}
                className="mobile-touch-target rounded-full bg-black px-4 text-xs font-medium text-white"
              >
                Log out
              </button>
            </div>
          ) : (
            <Link href="/book" className="mobile-touch-target rounded-full bg-black px-5 text-xs font-medium text-white">
              Book now
            </Link>
          )}
        </div>
      </div>

      <div className="hidden md:flex justify-between items-start">
        {/* Left Section */}
        <div className="flex items-center gap-4 pointer-events-auto">
          <Link href="/" className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-black/5 hover:scale-105 transition-transform">
            <img src="/logo.png" alt="@ Studio ON" className="w-9 h-9 object-contain" />
          </Link>
          <div className="h-12 bg-white rounded-full flex items-center px-2 shadow-sm border border-black/5">
            <Link href="#explore" className="px-4 text-sm font-medium text-gray-600 hover:text-black transition-colors">
              Locations
            </Link>
            <Link href="#portfolio" className="px-4 text-sm font-medium text-gray-600 hover:text-black transition-colors">
              Portfolio
            </Link>
          </div>
        </div>

        {/* Center Section - Search */}
        <div className="hidden md:flex items-center h-12 bg-white rounded-full shadow-sm border border-black/5 w-[480px] px-4 pointer-events-auto">
          <Search size={18} className="text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Search location or style..."
            className="flex-1 bg-transparent outline-none text-sm text-black placeholder:text-gray-400"
          />
          <div className="flex items-center gap-3 text-gray-400">
            <Scan size={18} className="hover:text-black cursor-pointer transition-colors" />
            <Aperture size={18} className="hover:text-black cursor-pointer transition-colors" />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4 pointer-events-auto">
          {user ? (
            <>
              <Link href="/profile" className="text-sm font-medium text-black hover:text-gray-600 transition-colors">
                Profile
              </Link>
              <button onClick={signOut} className="h-12 px-6 bg-black text-white rounded-full text-sm font-medium hover:bg-black/80 transition-colors shadow-sm inline-flex items-center justify-center">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/book" className="text-sm font-medium text-black hover:text-gray-600 transition-colors">
                Login
              </Link>
              <Link href="/book" className="h-12 px-6 bg-black text-white rounded-full text-sm font-medium hover:bg-black/80 transition-colors shadow-sm inline-flex items-center justify-center">
                Book now
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
