import Link from 'next/link';
import { Container, Button } from '@ru/ui';
import { site } from '@/lib/site';
import { getSessionUser, hasRole } from '@/lib/auth';
import { QuoteCartBadge } from './quote-cart/QuoteCartBadge';

export async function SiteHeader() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-40 bg-white shadow-[0_2px_12px_rgba(26,26,46,0.08)]">
      {/* CMYK registration stripe — the press identity */}
      <div className="cmyk-stripe" aria-hidden />

      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg border-2 border-[#1A1A2E] bg-[#FFD200] font-display text-sm font-black text-[#1A1A2E] shadow-[3px_3px_0_#1A1A2E] transition-transform group-hover:-rotate-6">
            RU
          </span>
          <span className="font-display text-base font-black tracking-wide text-[#1A1A2E]">
            {site.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          {site.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs font-bold uppercase tracking-[0.15em] text-[#1A1A2E]/60 transition-colors duration-200 hover:text-[#EC008C]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <QuoteCartBadge />
          {user ? (
            <>
              {hasRole(user, 'SALES_REP', 'ADMIN', 'SUPER_ADMIN') ? (
                <Link
                  href="/admin"
                  className="hidden text-xs font-bold uppercase tracking-[0.15em] text-[#1A1A2E]/60 transition-colors hover:text-[#EC008C] md:inline"
                >
                  Admin
                </Link>
              ) : null}
              <Link href="/portal">
                <Button size="sm" variant="outline">Portal</Button>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-xs font-bold uppercase tracking-[0.15em] text-[#1A1A2E]/60 transition-colors hover:text-[#EC008C] md:inline"
              >
                Sign in
              </Link>
              <Link
                href="/quote"
                className="inline-flex items-center rounded-full border-2 border-[#1A1A2E] bg-[#EC008C] px-5 py-2 text-xs font-black uppercase tracking-widest text-white shadow-[3px_3px_0_#1A1A2E] transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1A1A2E]"
              >
                Get Quote
              </Link>
            </>
          )}
        </div>
      </Container>
    </header>
  );
}
