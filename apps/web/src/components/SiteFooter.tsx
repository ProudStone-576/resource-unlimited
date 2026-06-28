import Link from 'next/link';
import { Container } from '@ru/ui';
import { site } from '@/lib/site';
import { LocaleSwitcher } from './LocaleSwitcher';
import { NewsletterSignup } from './NewsletterSignup';

export async function SiteFooter() {
  return (
    <footer className="bg-[#1A1A2E] text-white">
      {/* CMYK registration stripe */}
      <div className="cmyk-stripe" aria-hidden />

      {/* Main footer grid */}
      <Container className="grid gap-12 py-16 md:grid-cols-4">

        {/* Brand */}
        <div className="md:col-span-1">
          <Link href="/" className="mb-5 flex items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#FFD200] font-display text-sm font-black text-[#1A1A2E]">
              RU
            </span>
            <span className="font-display text-sm font-black tracking-wide text-white">
              {site.name}
            </span>
          </Link>
          <p className="text-xs leading-relaxed text-white/50">{site.tagline}</p>
          {/* ink dots */}
          <div className="mt-4 flex gap-1.5" aria-hidden>
            {['#00B8D9', '#EC008C', '#FFD200', '#FF6B35', '#10B981'].map((c) => (
              <span key={c} className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div>
          <h4 className="mb-5 text-[9px] font-black uppercase tracking-[0.35em] text-[#FFD200]">
            Explore
          </h4>
          <ul className="space-y-3">
            {site.nav.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  className="text-xs font-medium text-white/55 transition-colors hover:text-[#00B8D9]"
                >
                  {n.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/quote"
                className="text-xs font-medium text-white/55 transition-colors hover:text-[#00B8D9]"
              >
                Request Quote
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="mb-5 text-[9px] font-black uppercase tracking-[0.35em] text-[#EC008C]">
            Contact
          </h4>
          <address className="not-italic space-y-1 text-xs leading-relaxed text-white/55">
            <p>{site.address.line1}</p>
            <p>{site.address.city}, {site.address.province} {site.address.postalCode}</p>
            <p>{site.address.country}</p>
            <p className="mt-3">
              <a href={`mailto:${site.contactEmail}`} className="transition-colors hover:text-[#FFD200]">
                {site.contactEmail}
              </a>
            </p>
            <p>
              <a
                href={`tel:${site.contactPhone.replace(/[^+\d]/g, '')}`}
                className="transition-colors hover:text-[#FFD200]"
              >
                {site.contactPhone}
              </a>
            </p>
          </address>
        </div>

        {/* Newsletter */}
        <div>
          <h4 className="mb-5 text-[9px] font-black uppercase tracking-[0.35em] text-[#00B8D9]">
            Stay in Touch
          </h4>
          <NewsletterSignup />
        </div>
      </Container>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <Container className="flex flex-col items-start justify-between gap-3 py-5 md:flex-row md:items-center">
          <p className="text-[10px] text-white/35">
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
          <LocaleSwitcher />
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">
            Premium Printing &amp; Packaging.
          </p>
        </Container>
      </div>

    </footer>
  );
}
