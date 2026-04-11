import Link from 'next/link';
import { Camera } from 'lucide-react';
import { fetchPlans } from '@/lib/data';

export default async function Footer() {
  const plans = await fetchPlans().catch(() => []);
  return (
    <footer className="border-t border-black/10 py-20 px-6 bg-[#fcfcfc]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
        <div className="space-y-6">
          <Link href="/" className="flex items-center gap-2 font-medium tracking-tight text-notion-text text-lg">
            <Camera size={24} />
            <span>SHION STUDIO</span>
          </Link>
          <p className="text-sm text-notion-text-muted leading-relaxed font-medium">
            Premium K-photography tailored for international visitors. Capture your Seoul story with aesthetic, high-end memories that last.
          </p>
        </div>
        
        <div>
          <h3 className="font-medium mb-6 tracking-tight text-black">Navigation</h3>
          <ul className="space-y-4 text-sm text-gray-500 font-medium">
            <li><Link href="/" className="hover:text-black transition-colors">Home</Link></li>
            <li><Link href="/#plans" className="hover:text-black transition-colors">Book Session</Link></li>
            <li><Link href="/profile" className="hover:text-black transition-colors">Profile</Link></li>
            <li><Link href="/about" className="hover:text-black transition-colors">About Us</Link></li>
          </ul>
        </div>
        
        <div>
          <h3 className="font-medium mb-6 tracking-tight text-black">Our Plans</h3>
          <ul className="space-y-4 text-sm text-gray-500 font-medium">
            {plans.map(plan => (
              <li key={plan.id}>
                <Link href={`/plan/${plan.slug}`} className="hover:text-black transition-colors">
                  {plan.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h3 className="font-medium mb-6 tracking-tight text-black">Legal</h3>
          <ul className="space-y-4 text-sm text-gray-500 font-medium">
            <li><a href="#" className="hover:text-black transition-colors">Terms of Service</a></li>
            <li><a href="#" className="hover:text-black transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-black transition-colors">Cancellation Policy</a></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-black/10 text-sm text-gray-500 font-medium flex flex-col md:flex-row justify-between items-center gap-4">
        <div>&copy; {new Date().getFullYear()} Shion Photography. All rights reserved.</div>
        <div className="flex gap-8">
          <a href="#" className="hover:text-black transition-colors">Instagram</a>
          <a href="#" className="hover:text-black transition-colors">Twitter</a>
        </div>
      </div>
    </footer>
  );
}
