import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';
import { PLANS } from '@/lib/plans';
import { LOCATION_SLUGS } from '@/lib/locations-content';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${SITE_URL}/about`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/book`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/locations`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/commercial-law`, lastModified, changeFrequency: 'yearly', priority: 0.2 },
  ];

  const planEntries: MetadataRoute.Sitemap = PLANS.map((plan) => ({
    url: `${SITE_URL}/plan/${plan.slug}`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.85,
  }));

  const locationEntries: MetadataRoute.Sitemap = LOCATION_SLUGS.map((slug) => ({
    url: `${SITE_URL}/locations/${slug}`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.85,
  }));

  return [...staticEntries, ...planEntries, ...locationEntries];
}
