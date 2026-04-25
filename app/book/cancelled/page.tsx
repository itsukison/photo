// Stripe cancel_url lands here when the customer dismisses the Checkout page
// without paying. The booking remains in pending_payment for up to 30 minutes
// so they can retry without losing their slot.

import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Payment Cancelled',
  description: 'Your @ Studio ON booking slot is held for 30 minutes. Resume payment any time.',
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  alternates: { canonical: '/book/cancelled' },
};

export default function CheckoutCancelledPage() {
  return (
    <main className="min-h-screen bg-[#fcfcfc] text-black pt-24 md:pt-32 pb-20 md:pb-24">
      <div className="w-full max-w-xl mx-auto px-4 md:px-6 text-center py-12">
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight mb-4">Payment Not Completed</h1>
        <p className="text-gray-500 font-medium max-w-md mx-auto mb-10">
          Your slot is being held for 30 minutes. You can complete payment from the booking page or restart the flow at any time.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/book"
            className="px-10 py-4 bg-black text-white rounded-full font-medium hover:bg-black/80 transition-colors inline-block"
          >
            Try Again
          </Link>
          <Link
            href="/"
            className="px-10 py-4 border border-black/10 rounded-full font-medium text-black hover:bg-black/5 transition-colors inline-block"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
