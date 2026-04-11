'use client';

import { useParams } from 'next/navigation';
import { fetchPlans, type Plan } from '@/lib/data';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Clock, MapPin, Camera } from 'lucide-react';
import { useEffect, useState } from 'react';

const planImages: Record<string, string> = {
  'quick': 'https://picsum.photos/seed/seoul1/1200/800',
  'fisheye': 'https://picsum.photos/seed/seoul2/1200/800',
  'golden': 'https://picsum.photos/seed/seoul3/1200/800',
  'neon': 'https://picsum.photos/seed/seoul4/1200/800',
  'full': 'https://picsum.photos/seed/seoul5/1200/800',
  'vintage': 'https://picsum.photos/seed/seoul6/1200/800',
};

export default function PlanDetailPage() {
  const params = useParams();
  const planSlug = params.id as string;
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans()
      .then((plans) => setPlan(plans.find((p) => p.slug === planSlug) ?? null))
      .catch(() => setPlan(null))
      .finally(() => setLoading(false));
  }, [planSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] pt-40 px-6 flex flex-col items-center text-center">
        <p className="text-gray-500 font-medium">Loading…</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] pt-40 px-6 flex flex-col items-center text-center">
        <h1 className="text-4xl font-medium tracking-tight mb-4 text-black">Plan not found</h1>
        <Link href="/#plans" className="text-gray-500 hover:text-black transition-colors underline">
          Return to plans
        </Link>
      </div>
    );
  }

  const imageSrc = planImages[plan.slug] || 'https://picsum.photos/seed/seoul1/1200/800';

  return (
    <main className="min-h-screen bg-[#fcfcfc] text-black selection:bg-black selection:text-white pt-32 pb-24">
      <div className="max-w-5xl mx-auto px-6">
        {/* Back Link */}
        <Link href="/#plans" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-black transition-colors mb-12">
          <ArrowRight className="rotate-180" size={16} />
          Back to all plans
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left: Image */}
          <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden shadow-lg">
            <Image
              src={imageSrc}
              alt={plan.name}
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Right: Details */}
          <div className="flex flex-col justify-center">
            <span className="text-sm font-bold tracking-[0.2em] uppercase mb-4 text-gray-500">
              Package Details
            </span>
            <h1 className="text-5xl md:text-6xl font-medium tracking-tight mb-6 text-black leading-[1.1]">
              {plan.name}
            </h1>
            
            <p className="text-xl text-gray-600 mb-10 leading-relaxed">
              {plan.description}
            </p>

            <div className="space-y-6 mb-12">
              <div className="flex items-center gap-4 py-4 border-b border-black/10">
                <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center shrink-0">
                  <Clock size={20} className="text-black" />
                </div>
                <div>
                  <div className="text-sm text-gray-500 font-medium">Duration</div>
                  <div className="text-lg font-medium">{plan.duration} minutes</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 py-4 border-b border-black/10">
                <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center shrink-0">
                  <Camera size={20} className="text-black" />
                </div>
                <div>
                  <div className="text-sm text-gray-500 font-medium">Deliverables</div>
                  <div className="text-lg font-medium">High-resolution digital gallery</div>
                </div>
              </div>

              <div className="flex items-center gap-4 py-4 border-b border-black/10">
                <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center shrink-0">
                  <MapPin size={20} className="text-black" />
                </div>
                <div>
                  <div className="text-sm text-gray-500 font-medium">Location</div>
                  <div className="text-lg font-medium">Multiple options available</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-auto pt-8">
              <div>
                <div className="text-sm text-gray-500 font-medium mb-1">Starting at</div>
                <div className="text-4xl font-medium tracking-tight">${plan.price}</div>
              </div>
              <Link
                href={`/book?plan=${plan.slug}`}
                className="h-14 px-8 rounded-full bg-black text-white flex items-center justify-center text-base font-medium hover:bg-black/80 transition-colors shadow-lg"
              >
                Book this session
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
