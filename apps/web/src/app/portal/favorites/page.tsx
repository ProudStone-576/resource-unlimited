import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Container, Section, Card, CardBody, CardTitle, Badge } from '@ru/ui';
import { portalFetch, type FavoriteDTO } from '@/lib/portal-api';

export const metadata: Metadata = {
  title: 'Favorites',
  robots: { index: false, follow: false },
};

export default async function FavoritesPage() {
  const favorites = await portalFetch<FavoriteDTO[]>('/portal/favorites').catch(() => []);

  return (
    <Container>
      <Section eyebrow="Portal" heading="Saved products">
        {favorites.length === 0 ? (
          <Card>
            <CardBody>
              <p className="text-sm text-steel-600">
                No favorites yet. Save products as you browse the{' '}
                <Link href="/products" className="text-brand-700 underline">catalog</Link>.
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((f) => {
              const img = f.product.images[0];
              return (
                <Card key={f.productId}>
                  <Link href={`/products/${f.product.slug}`}>
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-lg bg-steel-100">
                      {img ? (
                        <Image src={img.url} alt={img.alt ?? f.product.name} fill className="object-cover" />
                      ) : null}
                    </div>
                    <CardBody>
                      <Badge tone="brand">{f.product.category.name}</Badge>
                      <CardTitle className="mt-2 line-clamp-2">{f.product.name}</CardTitle>
                      <p className="mt-1 text-xs text-steel-500">SKU: {f.product.sku}</p>
                    </CardBody>
                  </Link>
                </Card>
              );
            })}
          </div>
        )}
      </Section>
    </Container>
  );
}
