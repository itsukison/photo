import Image from 'next/image';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#fcfcfc] text-black selection:bg-black selection:text-white pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-medium tracking-tight mb-12">About SHION STUDIO</h1>
        
        <div className="relative w-full aspect-video mb-16 rounded-3xl overflow-hidden bg-black/5 shadow-lg">
          <Image 
            src="https://picsum.photos/seed/shion/1200/600" 
            alt="Photographer in Seoul" 
            fill 
            className="object-cover grayscale"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="space-y-8 text-xl text-gray-600 leading-relaxed">
          <p>
            <strong className="text-black font-medium">SHION STUDIO</strong> was founded to capture the fleeting, cinematic spirit of Seoul. Our city is a living canvas of contrasts—where imperial palaces meet neon-drenched skyscrapers, and quiet tradition thrives amidst hyper-modernity.
          </p>
          <p>
            Led by founder Shion Park, our studio specializes in crafting aesthetic, high-end visual narratives specifically tailored for international travelers and those seeking a professional edge. We believe a photo session should be an unforgettable experience—a guided journey through Seoul where your authentic story is brought to life.
          </p>
          
          <h2 className="text-3xl font-medium text-black mt-16 mb-6 tracking-tight">Our Philosophy</h2>
          <p>
            We focus on natural mastery of light, authentic candid moments, and the unique architecture of Seoul&apos;s urban landscape. Whether we&apos;re crafting a quick solo portrait in the heart of Myeongdong or a full-day cinematic editorial at the Han River, our mission is to deliver timeless images that resonate.
          </p>
          
          <h2 className="text-3xl font-medium text-black mt-16 mb-6 tracking-tight">The Experience</h2>
          <ul className="list-disc pl-6 space-y-4">
            <li><strong className="text-black font-medium">Iconic & Hidden Locations:</strong> We guide you to the secret alleys, the most vibrant sunset peaks, and Seoul&apos;s most breathtaking backdrops.</li>
            <li><strong className="text-black font-medium">Natural Direction:</strong> No modeling experience needed. We provide refined, gentle direction to ensure you feel comfortable and look stunning.</li>
            <li><strong className="text-black font-medium">Premium Art Direction:</strong> Every image is meticulously color-graded and curated to reflect our signature, high-end aesthetic.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
