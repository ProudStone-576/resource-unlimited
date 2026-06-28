# Delivery Roadmap

The platform ships in six phases. Each phase is independently deployable and additive to the schema — no migrations rename or drop columns introduced in a prior phase.

---

## Phase 1 — Foundation + Public Website  ✅ (this branch)

**Goal:** Ship a fast, SEO-friendly public site with a working quote and contact funnel.

- Monorepo (`pnpm` workspaces), shared TS config, ESLint, Prettier
- `apps/web` — Next.js 16 App Router pages:
  Home, About, Products, Category, Product Detail, Contact, Request Quote
- `apps/api` — NestJS with modules:
  `health`, `categories`, `products`, `quotes`, `contact`, `mail`
- `packages/db` — Prisma schema for `Product`, `ProductCategory`, `ProductImage`, `ProductDocument`, `QuoteRequest`, `QuoteItem`, `ContactInquiry`, `User` (stub)
- `packages/ui` — Shared components + Tailwind preset
- Quote cart (localStorage, client context) → POST to API
- SEO: per-page metadata, OG, `sitemap.ts`, `robots.ts`, ISR
- Mail notifications (sales inbox + buyer confirmation, dev stub)

**Exit criteria:**
- All public pages render against seeded DB
- `pnpm typecheck`, `pnpm lint`, `pnpm build` all green
- Quote + contact submissions persist and trigger mail

---

## Phase 2 — Quote System v2  ✅

**Goal:** Turn the public lead funnel into a real B2B quoting workflow.

- API: `AdminQuotesModule` (list, filter, get, status transitions, assign, regenerate PDF)
  - Gated by `X-Admin-Token` header (interim until Phase 3 JWT replaces it)
- PDF quote generation (`pdfkit`) — served via `/static/quotes/<number>.pdf`
- Buyer-side **tokenised tracking** — `GET /api/v1/quotes/track/:number?token=…`
- HTML email templates: buyer confirmation, sales notification, status-changed
- Rate limit: `@nestjs/throttler` global + per-route (5 quote POSTs / hour, 10 contact POSTs / hour)
- Recaptcha v3 on `/quotes` and `/contact` (no-op if `RECAPTCHA_SECRET` empty in dev)
- Web: tracking page `/quote/[number]?token=…` (SSR, `noindex`)

**Schema additions:**
- `QuoteRequest` extended: `viewToken`, `validUntil`, `totalEstimate`, `currency`, `quotePdfUrl`, `salesRepId`
- New: `QuoteEvent` (audit trail: CREATED, STATUS_CHANGED, PDF_GENERATED, EMAIL_SENT, ASSIGNED, NOTE_ADDED)
- `User` gains reverse relation `assignedQuotes` (no breaking change)

---

## Phase 3 — Authentication & RBAC  ✅

**Goal:** Secure login, refresh tokens, and role-aware API.

- NestJS `AuthModule`:
  - `POST /auth/register` (public — CLIENT role only; verification email sent)
  - `POST /auth/login` — issues access JWT + rotating refresh token (httpOnly cookies)
  - `POST /auth/refresh` — refresh-token rotation with **family-wide revocation on reuse**
  - `POST /auth/logout` / `POST /auth/logout-all`
  - `POST /auth/verify-email`, `POST /auth/password-reset/request` (uniform response), `POST /auth/password-reset/confirm`
  - `GET /auth/me` (JwtAuthGuard)
- **argon2id** password hashing (19 MB / 2 iters)
- **Account lockout**: 5 failed attempts → 15-minute lock (configurable)
- **Password policy**: min 10 chars + 3 of 4 character classes
- `JwtAuthGuard` (cookie or `Authorization: Bearer …`)
- `RolesGuard` + `@Roles()` decorator + `@CurrentUser()` param decorator
- `AdminTokenGuard` retired; `/admin/quotes` now `JwtAuthGuard + Roles(SALES_REP, ADMIN, SUPER_ADMIN)`
- Auth email templates: verify-email, password-reset
- Next.js middleware gates `/portal/*` and `/admin/*` (cookie presence at the edge); page-level RSCs verify the JWT via `getSessionUser()` and do role checks
- Web pages: `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-email`, `/portal`, `/admin`
- Server proxy routes under `/api/web/auth/*` forward cookies to the API

**Schema additions:**
- `User` extended: `passwordHash`, `emailVerifiedAt`, `lastLoginAt`, `failedLoginAttempts`, `lockedUntil`
- New: `RefreshToken` (hashed, with `family` + `replacedById` lineage), `PasswordResetToken`, `EmailVerificationToken`
- New: `Company`, `UserOnCompany`, `CompanyRole` enum (membership stub; expanded in Phase 4)

---

## Phase 4 — Client Portal  ✅

**Goal:** Approved business clients can place orders directly, see history, and manage their company.

- **PortalContextService** resolves the active company from the authenticated user (primary `UserOnCompany` membership). Reused across all portal endpoints.
- **PricingService** with precedence: `ClientPrice` per-company override → company `PriceList` → product `listPrice`. Returns source so UI can label "Negotiated price" vs list.
- `/portal/addresses` — CRUD (per-company), default per `AddressType`
- `/portal/favorites` — add / remove / list (per-user)
- `/portal/orders` — list / get / create / **reorder** / self-cancel (PENDING only)
- `/portal/orders/invoices/list` + `/portal/orders/invoices/:id` — invoices (auto-issued on SHIPPED, PDF via `InvoicePdfService` at `/static/invoices/<number>.pdf`)
- `/portal/quotes` — list / get my quotes (matches by `submittedByUserId` or `contactEmail`)
- `POST /portal/orders` with `sourceQuoteId` performs quote→order conversion (logs `QuoteEvent CONVERTED_TO_ORDER` and snapshots pricing)
- `/portal/company` — view company, members, pending invites; **invite** (ADMIN/OWNER), revoke invite, update member role (OWNER only), remove member, accept invite
- Email: invite, order placed (buyer + sales), invoice ready
- Web pages: `/portal` overview, `/portal/orders`, `/portal/orders/[id]`, `/portal/invoices`, `/portal/addresses`, `/portal/favorites`, `/portal/quotes`, `/portal/quotes/[id]/convert`, `/portal/company`
- Web proxy: catch-all `/api/web/portal/[...path]` forwards cookies
- `FavoriteButton` on product detail when signed in

**Schema additions:**
- `Order`, `OrderItem`, `OrderEvent`, `OrderStatus`, `OrderEventType` enums
- `Invoice`, `InvoiceStatus` enum
- `Address`, `AddressType` enum
- `PriceList`, `ClientPrice` (per-company override OR per-list pricing)
- `FavoriteProduct` (user+product composite key)
- `CompanyInvite`, `CompanyInviteStatus` enum
- `QuoteEventType.CONVERTED_TO_ORDER`
- `QuoteRequest.orders` reverse relation
- `Company.priceListId`, `Company.addresses/orders/invoices/invites/clientPrices` reverse relations
- `Product.favorites/clientPrices/orderItems` reverse relations

---

## Phase 5 — Admin CMS  ✅

**Goal:** Replace developer-only data entry with full self-serve administration.

- `/admin` portal gated by `JwtAuthGuard + Roles(SALES_REP, ADMIN, SUPER_ADMIN)`; deeper routes scoped to `ADMIN`/`SUPER_ADMIN`
- **Product CRUD** (`/api/v1/admin/products`) + **bulk XLSX import/export** via `exceljs`
- Image / document attachment endpoints on products
- **Category** CRUD with cycle prevention + reorder
- **Brand** CRUD (new `Brand` model + `Product.brandId`)
- **Cloudinary signed upload** + **S3-compatible presigned PUT** signing endpoints — uploads bypass the API, only signatures are issued
- **Order pipeline** for staff: list/filter, detail, status transitions (auto-issues invoice on SHIPPED via Phase 4's `InvoicePdfService`)
- **Client approval workflow** — `Company` + `CompanyApplication` (approve/reject with reviewer + reason), set custom `PriceList`
- **Promotions** + **Banners** (placement, schedule windows, public-scoped or company-targeted via `PromotionTarget`)
- **Blog** + **CMS Pages** (markdown body, status, publishedAt, tags). Public read endpoints (`GET /blog`, `GET /blog/:slug`, `GET /pages/:slug`)
- **Public banner endpoint** (`GET /promotions/banners?placement=…`) returning only currently-active banners
- **AuditLog** captured automatically via `AuditInterceptor` + `@Audit({entityType, action})` decorator. Carries actor user, request id, IP, UA, and `before`/`after` JSON. Read-only `/admin/audit` UI with filters
- Admin web pages: `/admin` overview, `/admin/{quotes,orders,clients,products,categories,brands,promotions,banners,blog,pages,audit}` + `/admin/products/import` (xlsx upload)
- Generic admin proxy `/api/web/admin/[...path]` forwards cookies + body to NestJS

**Schema additions (all additive):**
- `Brand` + `Product.brandId` link
- `Promotion` + `PromotionTarget` + `Banner` + enums `PromotionStatus`, `PromotionScope`, `DiscountType`, `BannerPlacement`
- `Page`, `BlogPost` + enum `PageStatus`
- `CompanyApplication` + enum `CompanyApplicationStatus`; `Company.applications` reverse relation
- `AuditLog` + enum `AuditAction`
- User reverse relations: `authoredPosts`, `auditLogs`, `reviewedApps`

---

## Phase 6 — Analytics, Promotions, Integrations  ✅

**Goal:** Make the platform self-improving and connect to surrounding systems.

- **Analytics dashboard** — `GET /admin/analytics/overview?days=…` returns revenue, AOV, order-status mix, quote→won conversion, top SKUs by revenue, top sales reps by activity. In-memory TTL cache (default 120s, env-tunable).
- **Promotions engine** — `PromotionsEngineService.resolveForCart()` picks the best applicable `Promotion` for a (company, subtotal, currency). Honours `scope`, `targets`, schedule window, `minOrderTotal`. Applied at order-create time (reduces `grandTotal`, snapshots applied promotion to order notes).
- **Newsletter** — public `POST /newsletter/subscribe` (recaptcha-gated, throttled) + `POST /newsletter/unsubscribe` (tokenised) + admin `GET /admin/newsletter`. CRM upsert fires on subscribe.
- **CRM** — `CrmService` (HubSpot Contacts v3 wrapper); no-op stub when `HUBSPOT_API_TOKEN` empty.
- **Webhooks (outbound)** — `WebhookEndpoint` registry + HMAC-SHA256 signed dispatcher + `WebhookDelivery` audit table (status, attempts, response code, body, error). Auto-fired on `ORDER_CREATED`, `ORDER_STATUS_CHANGED`, `INVOICE_ISSUED`; extensible via `WebhookEvent` enum.
- **i18n EN/FR** — `next-intl` with cookie-based locale (`ru_locale`) and Accept-Language fallback. Locale switcher in footer. Message catalogs for common/nav/home/newsletter. `User.locale` preference.
- Admin web pages: `/admin/analytics`, `/admin/newsletter`, `/admin/webhooks`.
- Public footer: newsletter signup + locale switcher.

**Schema additions:**
- `NewsletterSubscriber` + `NewsletterStatus` enum
- `WebhookEndpoint` + `WebhookDelivery` + `WebhookEvent`/`WebhookDeliveryStatus` enums
- `Locale` enum + `User.locale`
- (Discount fields live on the Phase 5 `Promotion` model; no separate `Campaign`/`Discount` tables.)
