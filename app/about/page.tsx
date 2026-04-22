import Image from 'next/image';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#fcfcfc] text-black selection:bg-black selection:text-white pt-24 md:pt-32 pb-16 md:pb-24 px-4 md:px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-medium tracking-tight mb-8 md:mb-12">About @ STUDIO ON</h1>

        <div className="relative w-full aspect-[4/3] md:aspect-video mb-12 md:mb-16 rounded-3xl overflow-hidden bg-black/5 shadow-lg">
          <Image
            src="https://picsum.photos/seed/studioon/1200/600"
            alt="Photographer in Tokyo"
            fill
            className="object-cover grayscale"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="space-y-7 md:space-y-8 text-[1.06rem] md:text-xl text-gray-600 leading-relaxed">
          <p>
            <strong className="text-black font-medium">@ STUDIO ON</strong> was founded to capture the fleeting, cinematic spirit of Tokyo. Our city is a living canvas of contrasts—where ancient shrines meet neon-drenched skyscrapers, and quiet tradition thrives amidst hyper-modernity.
          </p>
          <p>
            Led by our team of founding photographers, our studio specializes in crafting aesthetic, high-end visual narratives specifically tailored for international travelers and those seeking a professional edge. We believe a photo session should be an unforgettable experience—a guided journey through Tokyo where your authentic story is brought to life.
          </p>

          <h2 className="text-2xl md:text-3xl font-medium text-black mt-12 md:mt-16 mb-4 md:mb-6 tracking-tight">Our Philosophy</h2>
          <p>
            We focus on natural mastery of light, authentic candid moments, and the unique architecture of Tokyo&apos;s urban landscape. Whether we&apos;re crafting a quick solo portrait in the heart of Shibuya or a full-day cinematic editorial at the Sumida River, our mission is to deliver timeless images that resonate.
          </p>

          <h2 className="text-2xl md:text-3xl font-medium text-black mt-12 md:mt-16 mb-4 md:mb-6 tracking-tight">The Experience</h2>
          <ul className="list-disc pl-5 md:pl-6 space-y-3 md:space-y-4">
            <li><strong className="text-black font-medium">Iconic & Hidden Locations:</strong> We guide you to the secret alleys, the most vibrant sunset peaks, and Tokyo&apos;s most breathtaking backdrops.</li>
            <li><strong className="text-black font-medium">Natural Direction:</strong> No modeling experience needed. We provide refined, gentle direction to ensure you feel comfortable and look stunning.</li>
            <li><strong className="text-black font-medium">Premium Art Direction:</strong> Every image is meticulously color-graded and curated to reflect our signature, high-end aesthetic.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
