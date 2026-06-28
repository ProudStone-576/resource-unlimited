import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Container, Section } from '@ru/ui';
import { api } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; sort?: string; search?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const cat = await api.getCategory(slug);
    return {
      title: cat.name,
      description: cat.description ?? `Browse ${cat.name} from Resources Unlimited.`,
    };
  } catch {
    return { title: 'Category not found' };
  }
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;

  const cat = await api.getCategory(slug).catch(() => null);
  if (!cat) notFound();

  const page = Math.max(1, Number(sp.page ?? '1') || 1);
  const products = await api
    .listProducts({ category: slug, page, pageSize: 24, sort: sp.sort, search: sp.search })
    .catch(() => ({ data: [], meta: { page, pageSize: 24, total: 0, totalPages: 0 } }));

  return (
    <Container>
      <Section eyebrow="Category" heading={cat.name} description={cat.description ?? undefined}>
        {cat.children && cat.children.length > 0 ? (
          <div className="mb-8 flex flex-wrap gap-2">
            {cat.children.map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className="rounded-full border border-steel-200 px-4 py-1.5 text-sm text-steel-700 hover:border-brand-400 hover:text-brand-700"
              >
                {c.name}
              </Link>
            ))}
          </div>
        ) : null}

        {products.data.length === 0 ? (
          <p className="rounded-md border border-dashed border-steel-200 p-10 text-center text-sm text-steel-500">
            No products listed in this category yet.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.data.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {products.meta.totalPages > 1 ? (
          <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
            {Array.from({ length: products.meta.totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/category/${slug}?page=${p}`}
                className={`inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm ${
                  p === products.meta.page
                    ? 'border-brand-700 bg-brand-700 text-white'
                    : 'border-steel-200 text-steel-700 hover:border-brand-400'
                }`}
              >
                {p}
              </Link>
            ))}
          </nav>
        ) : null}
      </Section>
    </Container>
  );
}
