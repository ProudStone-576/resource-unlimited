import type { MetadataRoute } from 'next';
import { api } from '@/lib/api';
import { site } from '@/lib/site';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = site.url.replace(/\/$/, '');
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/products`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/about`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/contact`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/quote`, changeFrequency: 'monthly', priority: 0.7 },
  ];

  try {
    const [cats, prods] = await Promise.all([
      api.listCategories(),
      api.listProducts({ pageSize: 100 }),
    ]);
    const dyn: MetadataRoute.Sitemap = [
      ...cats.map((c) => ({
        url: `${base}/category/${c.slug}`,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
      ...prods.data.map((p) => ({
        url: `${base}/products/${p.slug}`,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
    ];
    return [...staticRoutes, ...dyn];
  } catch {
    return staticRoutes;
  }
}
