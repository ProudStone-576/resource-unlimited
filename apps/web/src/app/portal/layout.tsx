import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Container } from '@ru/ui';
import { getSessionUser } from '@/lib/auth';

const tabs = [
  { href: '/portal', label: 'Overview' },
  { href: '/portal/quotes', label: 'My Quotes' },
  { href: '/portal/orders', label: 'Orders' },
  { href: '/portal/invoices', label: 'Invoices' },
  { href: '/portal/favorites', label: 'Favorites' },
  { href: '/portal/addresses', label: 'Addresses' },
  { href: '/portal/company', label: 'Company' },
];

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/portal');

  return (
    <div>
      <div className="border-b border-steel-100 bg-white">
        <Container>
          <nav className="flex gap-1 overflow-x-auto py-1" aria-label="Portal">
            {tabs.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-steel-700 hover:bg-steel-100 hover:text-brand-700"
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
