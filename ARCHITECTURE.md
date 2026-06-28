# Architecture — Resources Unlimited

## Overview

```
┌──────────────────────────────────────────────────────────────┐
│                      Public Visitors                          │
│                  (later: Clients, Sales, Admins)              │
└────────────────────────────┬─────────────────────────────────┘
                             │ HTTPS
              ┌──────────────▼──────────────┐
              │    apps/web (Next.js 16)    │
              │  - App Router, RSC          │
              │  - SEO, ISR, sitemap        │
              │  - Server proxies POSTs to  │
              │    API via /api/web/*       │
              └──────────────┬──────────────┘
                             │ REST (JSON)
              ┌──────────────▼──────────────┐
              │     apps/api (NestJS)       │
              │  - /api/v1                  │
              │  - Modules: products,       │
              │    categories, quotes,      │
              │    contact, health, mail    │
              │  - JWT + RBAC scaffolded    │
              │    (live in Phase 3)        │
              └──────────────┬──────────────┘
                             │ Prisma
              ┌──────────────▼──────────────┐
              │       PostgreSQL            │
              │   (packages/db schema)      │
              └─────────────────────────────┘

              External (Phase 2+):
              ──────────────────────────────
              • SMTP (sales notifications, password reset)
              • Cloudinary (product images)
              • S3-compatible (PDFs, datasheets, invoices)
              • Stripe / payment processor (Phase: Payments)
              • CRM (HubSpot/Salesforce) — Phase 6
```

## Monorepo layout

```
resources-unlimited/
├── apps/
│   ├── api/                NestJS service
│   │   └── src/
│   │       ├── main.ts
│   │       ├── app.module.ts
│   │       ├── config/             # env validation (zod)
│   │       ├── common/             # filters, pipes, middleware, DTOs
│   │       ├── prisma/             # PrismaService + Module
│   │       └── modules/
│   │           ├── health/
│   │           ├── categories/
│   │           ├── products/
│   │           ├── quotes/
│   │           ├── contact/
│   │           └── mail/
│   └── web/                Next.js 16 app
│       └── src/
│           ├── app/                # App Router (RSC)
│           │   ├── (public site pages)
│           │   └── api/web/        # server proxies → NestJS
│           ├── components/
│           └── lib/                # api client, site config
├── packages/
│   ├── db/                 Prisma schema + client wrapper
│   │   ├── prisma/schema.prisma
│   │   ├── prisma/seed.ts
│   │   └── src/{client,index}.ts
│   └── ui/                 Shared React + Tailwind
│       ├── tailwind-preset.cjs
│       └── src/{Button, Input, Card, …}
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── eslint.config.mjs
└── .prettierrc
```

## Conventions

### Frontend (Next.js)
- **App Router** + **React Server Components** by default; mark interactive UI with `'use client'`.
- **Server-side data fetch** through the `api` client in `apps/web/src/lib/api.ts`. The client picks an internal base when running on the server and the public base in the browser.
- **Mutations** (quote, contact) flow through **Next.js route handlers** in `app/api/web/*` so the browser never talks cross-origin and the NestJS API host can stay private behind the network boundary.
- **SEO**: metadata API in every page, `sitemap.ts` + `robots.ts` at the root.
- **Caching**: `revalidate` per route — 60s for taxonomy, 30s for product lists. Tagged with `products`, `categories` so future admin mutations can `revalidateTag()`.
- **Forms** validate with Zod both client-side and on the API.

### Backend (NestJS)
- **Feature-module pattern**: each domain owns `controller`, `service`, `repository`, `schema/dto`, `module`.
- **Repository pattern** keeps Prisma calls out of services. Services do business logic and orchestration; controllers just bind HTTP.
- **Validation**: Zod for request bodies (`ZodValidationPipe`), `class-validator` for query strings (better integration with `@Query()` DTOs + `class-transformer`).
- **Global error filter** normalises HttpException, ZodError, and Prisma errors into a single JSON shape.
- **Logging**: every request gets an `x-request-id` and a single log line on `finish` (method, path, status, latency).
- **Mail**: side-effect notifications (`quotes`, `contact`) are dispatched *fire-and-forget* with `.catch()` — submission must not fail if SMTP is down.

### Database (Prisma)
- **CUIDs** for all primary keys. Migration-safe across replicas, opaque to users.
- **Snapshot fields on QuoteItem** (`productSku`, `productName`) so quote history is stable when products are renamed or deleted (`onDelete: SetNull`).
- **`UserRole` enum** and minimal `User` model exist in Phase 1 but are not wired into any flow — Phase 3 auth attaches without altering the table.
- **Self-referential `ProductCategory`** supports unlimited subcategory depth (Grafico-style nav trees).
- **`Json` columns** (`specs`, `dimensions`) keep the catalog flexible as the product mix grows; promoted to typed columns later if a field becomes universal.

### RBAC future-proofing
- All write endpoints are designed to accept an authenticated `User` from a JWT in later phases. Each entity that needs ownership already has nullable `submittedByUserId` (or equivalent) fields.
- `UserRole` enum is shared. Guards will check `role >= X` at controller level via decorators.

## Future-proofing checklist

- ✅ Schema accommodates Orders/Invoices/Promotions without renaming columns (will be added as new tables linking to existing `User`, `Product`, `ProductCategory`).
- ✅ Prisma `Decimal` for money fields (precision-safe).
- ✅ Snapshot fields prevent history loss on product edits.
- ✅ Categories tree → supports admin reordering, depth growth.
- ✅ Mail abstraction → swap SMTP for a transactional provider via a single service.
- ✅ Storage envs reserved (Cloudinary + S3) — modules added in the upload phase.
- ✅ JWT secrets in env validation already.
- ✅ Multi-tenant *Company* model can extend `User` via a future `Company` and `UserOnCompany` join table.

## Security baseline (Phase 1)
- `helmet` on the API
- CORS allowlist via env (`API_CORS_ORIGINS`)
- Next.js security headers (`X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`)
- All public-write endpoints accept anonymous traffic but require Zod validation
- Rate limiting (NestJS `ThrottlerModule`) — planned for Phase 2 when the form endpoints become higher value
