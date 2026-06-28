# @ru/web

Next.js 16 App Router public site for Resources Unlimited.

- Runs on `http://localhost:3000`
- Uses React Server Components by default
- Pulls data from `@ru/api` via the typed client in `src/lib/api.ts`

## Pages

| Route                  | Description                                |
| ---------------------- | ------------------------------------------ |
| `/`                    | Home — hero, categories, featured products |
| `/about`               | About Resources Unlimited                  |
| `/products`            | Product catalog (filter, search, paginate) |
| `/products/[slug]`     | Product detail + related                   |
| `/category/[slug]`     | Category landing page                      |
| `/contact`             | Contact form                               |
| `/quote`               | Quote request form + quote cart            |
| `/sitemap.xml`         | Auto-generated sitemap                     |
| `/robots.txt`          | Auto-generated robots                      |

## Server-side mutation proxies

| Route                  | Forwards to                |
| ---------------------- | -------------------------- |
| `POST /api/web/quote`  | `POST /api/v1/quotes`      |
| `POST /api/web/contact`| `POST /api/v1/contact`     |

These let us keep the NestJS host private and avoid CORS by handling form posts on the Next.js origin.

## Folder layout

```
src/
├── app/                            # Next.js App Router
│   ├── layout.tsx                  # root layout + QuoteCartProvider
│   ├── page.tsx                    # home
│   ├── about/
│   ├── products/
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx
│   ├── category/[slug]/page.tsx
│   ├── contact/{page,ContactForm}.tsx
│   ├── quote/{page,QuoteForm}.tsx
│   ├── api/web/{quote,contact}/route.ts
│   ├── sitemap.ts
│   ├── robots.ts
│   ├── not-found.tsx
│   ├── error.tsx
│   └── loading.tsx
├── components/
│   ├── SiteHeader.tsx
│   ├── SiteFooter.tsx
│   ├── ProductCard.tsx
│   ├── AddToQuoteButton.tsx
│   └── quote-cart/
│       ├── QuoteCartContext.tsx
│       └── QuoteCartBadge.tsx
└── lib/
    ├── api.ts                      # typed client
    └── site.ts                     # site-wide config (name, nav, contact)
```

## Run

```bash
pnpm --filter @ru/web dev
pnpm --filter @ru/web build
pnpm --filter @ru/web start
```
