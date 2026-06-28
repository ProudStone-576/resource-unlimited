import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Container } from '@ru/ui';
import { getSessionUser, hasRole } from '@/lib/auth';

const tabs = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/analytics', label: 'Analytics' },
  { href: '/admin/quotes', label: 'Quotes' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/clients', label: 'Clients' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/brands', label: 'Brands' },
  { href: '/admin/promotions', label: 'Promotions' },
  { href: '/admin/banners', label: 'Banners' },
  { href: '/admin/blog', label: 'Blog' },
  { href: '/admin/pages', label: 'Pages' },
  { href: '/admin/newsletter', label: 'Newsletter' },
  { href: '/admin/webhooks', label: 'Webhooks' },
  { href: '/admin/audit', label: 'Audit' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/admin');
  if (!hasRole(user, 'SALES_REP', 'ADMIN', 'SUPER_ADMIN')) redirect('/portal');

  return (
    <div>
      <div className="border-b border-steel-100 bg-white">
        <Container>
          <nav className="flex gap-1 overflow-x-auto py-1" aria-label="Admin">
            {tabs.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-steel-700 hover:bg-steel-100 hover:text-brand-700"
              >
                {t.label}
              </Link>
            ))}
          </nav>
        </Container>
      </div>
      {children}
    </div>
  );
}
