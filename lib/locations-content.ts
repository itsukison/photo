// Source of truth for the /locations/[slug] landing pages. Each entry is
// long-form content tuned for SEO + GEO: a definition-lead intro, a list
// of concrete shooting spots (LLMs love these), best-time guidance, FAQ
// pairs, and a hero image pulled from /public.
//
// Adding a new location: append an entry below and the sitemap, /locations
// index page, and the dynamic [slug] route will pick it up automatically.

export type LocationContent = {
  slug: string;
  name: string;
  shortLabel: string;
  metaTitle: string;
  metaDescription: string;
  heroImage: string;
  heroAlt: string;
  galleryImages: { src: string; alt: string }[];
  intro: string;
  bestFor: string[];
  spots: { name: string; description: string }[];
  bestTime: string;
  pairsWith: string[];
  surchargeNote: string;
  faq: { question: string; answer: string }[];
};

export const LOCATIONS: LocationContent[] = [
  {
    slug: 'shibuya',
    name: 'Shibuya',
    shortLabel: 'Shibuya, Tokyo',
    metaTitle: 'Shibuya Photoshoot — Cinematic Portraits at Shibuya Crossing',
    metaDescription:
      'Book a Shibuya photoshoot at Shibuya Crossing, Hachiko, and Center Gai with @ Studio ON. English-speaking Tokyo photographer, editorial style, from $150.',
    heroImage: '/crossingsinglemain1.jpg',
    heroAlt: 'Editorial portrait of a solo traveler at Shibuya Crossing in Tokyo',
    galleryImages: [
      { src: '/crossingjeans1.JPG', alt: 'Streetwear portrait at Shibuya Crossing' },
      { src: '/crossingpinkhair1.jpg', alt: 'Pink-hair fashion portrait near Shibuya at night' },
      { src: '/crossingfriendship2.jpg', alt: 'Friends group photoshoot in Shibuya' },
      { src: '/crossingcouple1.JPG', alt: 'Couple photoshoot at Shibuya Crossing' },
    ],
    intro:
      'A Shibuya photoshoot with @ Studio ON is a guided cinematic portrait session that uses the world\'s busiest pedestrian crossing as a living backdrop. Sessions move on foot between Shibuya Crossing, the Hachiko Statue, the Center Gai arcade, and the alleyways behind Bunkamura, so a single 50-minute slot covers a wide editorial range without leaving Shibuya.',
    bestFor: [
      'First-time visitors who want the iconic Tokyo skyline shot',
      'Solo travelers seeking confident editorial portraits',
      'Couples on their first Tokyo trip',
      'Content creators who need a recognizable establishing shot',
    ],
    spots: [
      { name: 'Shibuya Crossing', description: 'The five-way scramble at peak flow, shot from street level for motion-blur backgrounds.' },
      { name: 'Hachiko Statue', description: 'The classic meeting-point portrait with softer afternoon light.' },
      { name: 'Center Gai', description: 'Neon storefronts and signage for after-dark editorial frames.' },
      { name: 'Shibuya Sky rooftop', description: 'For clients who add a Shibuya Sky ticket: unobstructed Tokyo skyline portraits.' },
      { name: 'Nonbei Yokocho', description: 'Hidden lantern-lit alley a two-minute walk from the crossing — a quieter contrast frame.' },
    ],
    bestTime:
      'Late afternoon into blue hour (roughly 16:30–19:00 in winter, 17:30–20:00 in summer). The crossing reads cleanly without midday sun, and storefront neon kicks in by the second half of the session.',
    pairsWith: ['shinjuku', 'harajuku'],
    surchargeNote: 'Shibuya is the studio\'s default location and carries no location surcharge on any plan.',
    faq: [
      {
        question: 'Do I need a permit to photograph at Shibuya Crossing?',
        answer:
          'No permit is required for handheld portrait photography at Shibuya Crossing. We work without tripods or lighting rigs, which keeps every session within the bounds of normal pedestrian use.',
      },
      {
        question: 'How long should I plan for a Shibuya photoshoot?',
        answer:
          'A 50-minute Full Portrait or Signature session covers the crossing plus two adjacent backdrops. Tight 30-minute Quick Shot sessions stay within the crossing-and-Hachiko radius.',
      },
      {
        question: 'Is Shibuya Crossing too crowded for clean photos?',
        answer:
          'The crowd is the shot. We frame portraits with the scramble in motion behind you and use a wider aperture to let the foreground stay sharp while the crowd softens.',
      },
      {
        question: 'Can we shoot at Shibuya Sky?',
        answer:
          'Yes — Shibuya Sky requires its own entry ticket which clients buy separately. The session continues on the rooftop after the street portion.',
      },
    ],
  },
  {
    slug: 'shinjuku',
    name: 'Shinjuku',
    shortLabel: 'Shinjuku, Tokyo',
    metaTitle: 'Shinjuku Photoshoot — Neon Nights & Kabukicho Portraits',
    metaDescription:
      'Shinjuku photoshoot in Omoide Yokocho, Kabukicho neon, and Shinjuku Gyoen with @ Studio ON. English-speaking Tokyo photographer, editorial neon portraits.',
    heroImage: '/redneonportrait3.jpg',
    heroAlt: 'Red-neon portrait in Shinjuku, Tokyo',
    galleryImages: [
      { src: '/redneonportrait1.jpg', alt: 'Neon portrait under red signage in Shinjuku' },
      { src: '/redneonportrait2.jpg', alt: 'Editorial portrait against Shinjuku neon storefronts' },
      { src: '/neonvandingportrait1.jpg', alt: 'Vending-machine neon portrait in Shinjuku at night' },
      { src: '/redneonfriendship1.jpg', alt: 'Friends portrait under Shinjuku neon' },
    ],
    intro:
      'A Shinjuku photoshoot with @ Studio ON is a night-leaning portrait session built around neon, narrow alleys, and the layered signage that defines Tokyo\'s after-dark skyline. We move between Omoide Yokocho, Kabukicho, and the side streets near Shinjuku Station to give every frame a different signage palette.',
    bestFor: [
      'Travelers who specifically want the neon-Tokyo aesthetic',
      'Couples shooting after dinner',
      'Content creators building a moody editorial set',
      'Returning Tokyo visitors who already have a Shibuya shot',
    ],
    spots: [
      { name: 'Omoide Yokocho', description: 'Red lantern alley behind west Shinjuku — warm tungsten tones and tight framing.' },
      { name: 'Kabukicho Gate', description: 'The iconic red archway with high-density neon behind.' },
      { name: 'Golden Gai', description: 'Hand-painted bar facades, ideal for textured background portraits.' },
      { name: 'Shinjuku Gyoen perimeter', description: 'Greenery contrast for golden-hour frames before the night portion.' },
      { name: 'Vending-machine alleys', description: 'Cool-blue ambient light for cyberpunk-style editorial frames.' },
    ],
    bestTime:
      'Blue hour through full dark (roughly 18:00–21:00). Neon signage reads strongest once ambient light drops below the storefront output.',
    pairsWith: ['shibuya', 'akihabara'],
    surchargeNote: 'Shinjuku adds a $50 location surcharge on all plans to cover travel time from the studio base in Setagaya.',
    faq: [
      {
        question: 'Is Kabukicho safe for an after-dark photoshoot?',
        answer:
          'Yes. Kabukicho is heavily trafficked and well-policed throughout the evening. We stick to the main signage corridors and avoid host-club entrances out of professional courtesy.',
      },
      {
        question: 'Can we shoot inside Omoide Yokocho?',
        answer:
          'We shoot in the public lanes between bars. Individual bar interiors require the owner\'s permission, which we don\'t arrange as part of a standard session.',
      },
      {
        question: 'Will my photos look noisy because it\'s shot at night?',
        answer:
          'No. We use fast prime lenses and modern full-frame sensors specifically tuned for low-light Tokyo work. Night frames are cleaned and color-graded in our signature edit.',
      },
      {
        question: 'Do I need to wear anything specific for neon photos?',
        answer:
          'Solid colors that contrast with red and pink neon read best. Avoid all-white tops, which clip under saturated signage.',
      },
    ],
  },
  {
    slug: 'harajuku',
    name: 'Harajuku',
    shortLabel: 'Harajuku, Tokyo',
    metaTitle: 'Harajuku Photoshoot — Takeshita St & Omotesando Portraits',
    metaDescription:
      'Harajuku photoshoot at Takeshita Street, Omotesando, and Meiji Shrine with @ Studio ON. Cinematic Tokyo fashion photographer, editorial portraits.',
    heroImage: '/crossingpinkhair1.jpg',
    heroAlt: 'Fashion-forward portrait in Harajuku, Tokyo',
    galleryImages: [
      { src: '/crossingpinkhair2.jpg', alt: 'Pink-hair Harajuku street style portrait' },
      { src: '/crossingpinkhair3.jpg', alt: 'Editorial Harajuku fashion portrait' },
      { src: '/crossingfriendship5.jpg', alt: 'Friends group photo in Harajuku' },
    ],
    intro:
      'A Harajuku photoshoot with @ Studio ON is a fashion-leaning portrait session along the Takeshita-to-Omotesando spine, built around the contrast between hyper-colorful youth culture on one side and tree-lined luxury architecture on the other. The session moves on foot through Cat Street and ends near Meiji Shrine for a green, quiet contrast frame.',
    bestFor: [
      'Fashion-driven content creators',
      'Travelers who want a colorful, daytime aesthetic',
      'Solo creatives looking for street-style portraits',
      'Friend groups who want both kawaii and editorial frames',
    ],
    spots: [
      { name: 'Takeshita Street', description: 'High-saturation kawaii storefronts and pastel signage.' },
      { name: 'Cat Street', description: 'Quieter pedestrian alley between Harajuku and Shibuya — boutique facades, brick textures.' },
      { name: 'Omotesando architecture', description: 'Award-winning glass-and-concrete flagship stores for luxury editorial frames.' },
      { name: 'Meiji Shrine torii', description: 'Wooden torii gate and cypress forest for a calmer closing frame.' },
    ],
    bestTime:
      'Mid-morning to early afternoon (roughly 10:00–14:00). Takeshita Street reads brightest with overhead light, and crowds thin earliest in this window.',
    pairsWith: ['shibuya', 'shinjuku'],
    surchargeNote: 'Harajuku is available on request. Reach out via the booking flow and the studio will confirm a slot.',
    faq: [
      {
        question: 'How far is Harajuku from Shibuya for a single session?',
        answer:
          'About a 15-minute walk along Cat Street. Many clients book a Signature Session and split the time between the two neighborhoods.',
      },
      {
        question: 'Can we photograph inside Meiji Shrine?',
        answer:
          'We frame portraits at the torii and along the approach path. Photography inside the inner shrine area is restricted out of respect for the religious site.',
      },
      {
        question: 'Is Takeshita Street too crowded for clean shots?',
        answer:
          'It is busy by design — that energy is part of the frame. We work with a longer focal length to compress the storefronts behind you.',
      },
      {
        question: 'Do you shoot kimono rentals in Harajuku?',
        answer:
          'We photograph clients in their own kimono, but we don\'t handle the rental and dressing. For those, Asakusa is a more practical pairing.',
      },
    ],
  },
  {
    slug: 'asakusa',
    name: 'Asakusa',
    shortLabel: 'Asakusa, Tokyo',
    metaTitle: 'Asakusa Photoshoot — Senso-ji Temple & Kimono Portraits',
    metaDescription:
      'Asakusa photoshoot at Senso-ji, Nakamise Street, and the Sumida riverside with @ Studio ON. English-speaking Tokyo photographer for traditional portraits.',
    heroImage: '/mainportrait.jpg',
    heroAlt: 'Traditional Asakusa portrait in Tokyo',
    galleryImages: [
      { src: '/crossingfriendship8.jpg', alt: 'Friends group photo in Asakusa' },
      { src: '/vandingfriendship1.jpg', alt: 'Editorial group portrait in Asakusa' },
    ],
    intro:
      'An Asakusa photoshoot with @ Studio ON is a traditional, daytime-leaning portrait session built around Senso-ji Temple, the Nakamise shopping street, and the Sumida River. It is the studio\'s recommended location for kimono portraits and family or anniversary frames that lean cultural rather than urban.',
    bestFor: [
      'Travelers in rented kimono or yukata',
      'Family and multi-generation portraits',
      'Anniversaries and quieter couple sessions',
      'Clients who want a non-neon, daylight aesthetic',
    ],
    spots: [
      { name: 'Kaminarimon (Thunder Gate)', description: 'The giant red lantern entrance to Senso-ji — the iconic Asakusa frame.' },
      { name: 'Nakamise-dori', description: 'Lantern-lined approach to the temple, lined with traditional storefronts.' },
      { name: 'Senso-ji main hall', description: 'Five-story pagoda backdrop with incense smoke for atmospheric frames.' },
      { name: 'Sumida River promenade', description: 'Tokyo Skytree across the water for a wide cityscape closing shot.' },
    ],
    bestTime:
      'Early morning (07:30–10:00) for clean temple frames before tourist density peaks, or just before sunset for warm light on the pagoda.',
    pairsWith: ['ginza'],
    surchargeNote: 'Asakusa is available on request. Contact the studio via booking to confirm availability.',
    faq: [
      {
        question: 'Can we wear kimono for the shoot?',
        answer:
          'Yes — Asakusa is the studio\'s recommended kimono location. Several rental shops near Senso-ji handle dressing in 30–45 minutes; clients arrive at the meeting point already changed.',
      },
      {
        question: 'Is photography allowed inside Senso-ji Temple?',
        answer:
          'Yes, in the outer courtyard and at the main hall steps. Photography of the inner sanctum and during active prayer is restricted.',
      },
      {
        question: 'How early should we start to avoid crowds?',
        answer:
          'A 07:30 or 08:00 start gives roughly 90 minutes of relatively empty temple grounds, especially on weekdays.',
      },
      {
        question: 'Can we include Tokyo Skytree in the frame?',
        answer:
          'Yes — the Sumida River promenade gives a clean Skytree backdrop about a five-minute walk from the temple.',
      },
    ],
  },
  {
    slug: 'akihabara',
    name: 'Akihabara',
    shortLabel: 'Akihabara, Tokyo',
    metaTitle: 'Akihabara Photoshoot — Electric Town Neon Portraits',
    metaDescription:
      'Akihabara photoshoot in Electric Town, neon arcades, and retro storefronts with @ Studio ON. Cinematic Tokyo cyberpunk and anime-aesthetic portraits.',
    heroImage: '/neonvandingportrait3.jpg',
    heroAlt: 'Neon Akihabara portrait with vending machines',
    galleryImages: [
      { src: '/neonvandingportrait2.jpg', alt: 'Akihabara neon vending-machine portrait' },
      { src: '/neonvandingportrait4.jpg', alt: 'Cyberpunk-style portrait in Akihabara' },
      { src: '/neonvandingportrait5.jpg', alt: 'Editorial Akihabara neon portrait' },
    ],
    intro:
      'An Akihabara photoshoot with @ Studio ON is a cyberpunk-leaning portrait session through Electric Town, built around vending-machine alleys, multi-storey arcades, and the saturated neon storefronts that line Chuo-dori. It is the studio\'s recommended location for clients who want an anime-aesthetic or sci-fi editorial.',
    bestFor: [
      'Anime and gaming culture enthusiasts',
      'Content creators with a cyberpunk aesthetic',
      'Solo travelers who want a non-touristy nightscape',
      'Cosplay portraits',
    ],
    spots: [
      { name: 'Chuo-dori arcade strip', description: 'The main neon-storefront avenue, especially at the weekend pedestrian-zone hours.' },
      { name: 'Electric Town side alleys', description: 'Dense vending-machine corridors with cool-blue ambient light.' },
      { name: 'Radio Kaikan facade', description: 'Multi-storey neon facade — a recognizable Akihabara establishing shot.' },
      { name: 'Manseibashi bridge area', description: 'Riverside contrast frame between the neon and Kanda waterway.' },
    ],
    bestTime:
      'Blue hour into full dark (roughly 18:00–21:00), or Sunday afternoon during the pedestrian-zone hours when Chuo-dori is closed to cars.',
    pairsWith: ['shinjuku', 'ginza'],
    surchargeNote: 'Akihabara adds a $100 location surcharge on all plans to cover travel time from the studio base in Setagaya.',
    faq: [
      {
        question: 'Can we shoot in cosplay in Akihabara?',
        answer:
          'Yes. Cosplay portraits are common in Akihabara. We recommend changing into costume at a nearby cafe or hotel and meeting on Chuo-dori already in look.',
      },
      {
        question: 'Are vending-machine alleys safe at night?',
        answer:
          'Yes. Akihabara remains one of central Tokyo\'s safest neighborhoods well into the evening, and the alleys we shoot in stay busy with foot traffic.',
      },
      {
        question: 'Do storefronts mind being in the background?',
        answer:
          'No. Storefront signage is part of the public streetscape. We photograph from the public sidewalk and don\'t obstruct entrances.',
      },
      {
        question: 'Is the fish-eye lens worth it for Akihabara?',
        answer:
          'Yes — Akihabara is the location where the fish-eye glass earns its surcharge. The wide-angle distortion exaggerates the multi-storey signage in a way standard lenses can\'t replicate.',
      },
    ],
  },
  {
    slug: 'ginza',
    name: 'Ginza',
    shortLabel: 'Ginza, Tokyo',
    metaTitle: 'Ginza Photoshoot — Luxury Editorial Tokyo Portraits',
    metaDescription:
      'Ginza photoshoot at the Wako Building, luxury flagship facades, and Yurakucho with @ Studio ON. Refined editorial Tokyo portraits.',
    heroImage: '/crossingsinglemain2.JPG',
    heroAlt: 'Editorial luxury portrait in Ginza, Tokyo',
    galleryImages: [
      { src: '/crossingsinglemain3.jpg', alt: 'Ginza editorial portrait' },
      { src: '/crossingsinglemain4.jpg', alt: 'Luxury Ginza fashion portrait' },
    ],
    intro:
      'A Ginza photoshoot with @ Studio ON is a refined editorial session along Tokyo\'s luxury-flagship corridor, built around clean architectural lines, Wako\'s clock tower, and the wider sidewalks of Chuo-dori. It is the studio\'s recommended location for clients who want a polished, fashion-magazine aesthetic without the kawaii density of Harajuku.',
    bestFor: [
      'Couples celebrating an anniversary or honeymoon',
      'Business travelers who want a polished portrait',
      'Engagement and proposal sessions in a quieter setting',
      'Fashion clients who prefer minimalist architecture',
    ],
    spots: [
      { name: 'Wako Building clock tower', description: 'The Ginza 4-chome intersection — Tokyo\'s most recognizable luxury landmark.' },
      { name: 'Ginza flagship facades', description: 'Dior, Hermes, Chanel, and Uniqlo flagships line a single walkable block.' },
      { name: 'Yurakucho underpass', description: 'Brick-arch backdrop next to the train viaduct for a textured contrast frame.' },
      { name: 'Hibiya Park edge', description: 'Greenery contrast and the Imperial Hotel for a softer closing frame.' },
    ],
    bestTime:
      'Saturday or Sunday afternoon during the pedestrian-only hours on Chuo-dori (12:00–17:00 in winter, 12:00–18:00 in summer), when the avenue is closed to traffic.',
    pairsWith: ['asakusa', 'shibuya'],
    surchargeNote: 'Ginza is available on request. Contact the studio via booking to confirm availability.',
    faq: [
      {
        question: 'Can we shoot inside the luxury flagships?',
        answer:
          'Interiors require store-by-store permission, which we don\'t arrange. We frame the architecture from the public sidewalk, where the facades read cleanly.',
      },
      {
        question: 'Is Ginza good for a proposal photoshoot?',
        answer:
          'Yes. The Wako clock tower at 4-chome is a quieter, more elegant setting than Shibuya for a surprise proposal, and the studio handles a discreet meeting plan in advance.',
      },
      {
        question: 'How does Ginza compare to Omotesando for luxury frames?',
        answer:
          'Ginza skews older-money and architectural; Omotesando skews fashion-flagship and tree-lined. Both work for refined portraits — pick by the building palette you want behind you.',
      },
      {
        question: 'Is there parking nearby for a quick changeover?',
        answer:
          'Yes — multiple paid parking towers along Harumi-dori. We meet at the Wako intersection and clients use the parking towers for outfit changes.',
      },
    ],
  },
];

export const LOCATION_SLUGS = LOCATIONS.map((l) => l.slug);

export function findLocation(slug: string): LocationContent | null {
  return LOCATIONS.find((l) => l.slug === slug) ?? null;
}
