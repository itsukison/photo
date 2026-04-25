// Central SEO/GEO constants and helpers used across metadata exports,
// JSON-LD payloads, sitemap, robots, and llms.txt. Keep all canonical
// business facts here so they stay consistent everywhere they appear.

export const SITE_URL = 'https://studio-on.org';
export const SITE_NAME = '@ Studio ON';
export const SITE_LEGAL_NAME = '@ Studio ON Tokyo';

export const STUDIO = {
  name: SITE_NAME,
  legalName: SITE_LEGAL_NAME,
  description:
    '@ Studio ON is a Tokyo-based photography studio that produces cinematic, editorial portraits at Shibuya Crossing, Shinjuku, Harajuku, and Akihabara for travelers, couples, and creators.',
  founder: 'Shion Park',
  foundingDate: '2024',
  email: 'shionpark06@gmail.com',
  phone: '+81-90-1295-4319',
  priceRange: '$150–$300',
  currenciesAccepted: 'USD, JPY',
  paymentAccepted: 'Credit Card (Stripe)',
  address: {
    streetAddress: 'Sakura 3-9-24',
    addressLocality: 'Setagaya',
    addressRegion: 'Tokyo',
    postalCode: '156-0053',
    addressCountry: 'JP',
  },
  geo: {
    latitude: 35.6464,
    longitude: 139.6500,
  },
  areaServed: [
    'Shibuya',
    'Shinjuku',
    'Harajuku',
    'Asakusa',
    'Akihabara',
    'Ginza',
    'Roppongi',
    'Shimokitazawa',
    'Setagaya',
    'Tokyo',
  ],
  sameAs: [
    'https://www.instagram.com/studio.on.snap/',
  ],
  openingHours: 'Mo-Su 09:00-21:00',
  image: `${SITE_URL}/mainportrait.jpg`,
  logo: `${SITE_URL}/logo.png`,
} as const;

export function absoluteUrl(path = '/'): string {
  if (path.startsWith('http')) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function canonical(path: string): { canonical: string } {
  return { canonical: absoluteUrl(path) };
}

// Default OpenGraph block applied at the layout level.
export const DEFAULT_OG = {
  type: 'website' as const,
  siteName: SITE_NAME,
  locale: 'en_US',
  images: [
    {
      url: '/opengraph-image',
      width: 1200,
      height: 630,
      alt: '@ Studio ON — Tokyo cinematic photoshoot studio',
    },
  ],
};

export const DEFAULT_TWITTER = {
  card: 'summary_large_image' as const,
  site: '@studio.on.snap',
  creator: '@studio.on.snap',
};

// JSON-LD payload for the studio. Used in the root layout so every page
// inherits a single LocalBusiness/Photograph entity.
export function studioJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'PhotographyBusiness'],
    '@id': `${SITE_URL}/#studio`,
    name: STUDIO.name,
    legalName: STUDIO.legalName,
    description: STUDIO.description,
    url: SITE_URL,
    image: STUDIO.image,
    logo: STUDIO.logo,
    email: STUDIO.email,
    telephone: STUDIO.phone,
    priceRange: STUDIO.priceRange,
    currenciesAccepted: STUDIO.currenciesAccepted,
    paymentAccepted: STUDIO.paymentAccepted,
    foundingDate: STUDIO.foundingDate,
    founder: { '@type': 'Person', name: STUDIO.founder },
    address: {
      '@type': 'PostalAddress',
      streetAddress: STUDIO.address.streetAddress,
      addressLocality: STUDIO.address.addressLocality,
      addressRegion: STUDIO.address.addressRegion,
      postalCode: STUDIO.address.postalCode,
      addressCountry: STUDIO.address.addressCountry,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: STUDIO.geo.latitude,
      longitude: STUDIO.geo.longitude,
    },
    areaServed: STUDIO.areaServed.map((name) => ({
      '@type': 'AdministrativeArea',
      name,
    })),
    sameAs: STUDIO.sameAs,
    openingHours: STUDIO.openingHours,
    knowsLanguage: ['en', 'ja', 'ko'],
    serviceType: [
      'Tokyo photoshoot',
      'Shibuya photoshoot',
      'Couple photoshoot Tokyo',
      'Proposal photographer Tokyo',
      'Editorial portrait Tokyo',
      'Night neon photoshoot Tokyo',
    ],
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function serviceJsonLd(args: {
  name: string;
  description: string;
  url: string;
  price: number;
  duration: number;
  image?: string;
  areaServed?: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: args.name,
    description: args.description,
    url: absoluteUrl(args.url),
    image: args.image ? absoluteUrl(args.image) : STUDIO.image,
    serviceType: 'Photography session',
    provider: { '@id': `${SITE_URL}/#studio` },
    areaServed: (args.areaServed ?? ['Tokyo']).map((name) => ({
      '@type': 'AdministrativeArea',
      name,
    })),
    offers: {
      '@type': 'Offer',
      price: args.price,
      priceCurrency: 'USD',
      url: absoluteUrl(args.url),
      availability: 'https://schema.org/InStock',
    },
    termsOfService: absoluteUrl('/commercial-law'),
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'Session duration (minutes)',
        value: args.duration,
      },
    ],
  };
}
