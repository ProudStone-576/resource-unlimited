# @ru/api

NestJS REST API for Resources Unlimited.

- Runs on `http://localhost:4000`
- All routes are prefixed with `/api/v1`
- Documents structure under `src/modules/<feature>/`

## Endpoints

### Phase 1 — public catalog + lead capture

| Method | Path                                  | Description                          |
| ------ | ------------------------------------- | ------------------------------------ |
| GET    | `/api/v1/health`                      | App + DB health                      |
| GET    | `/api/v1/products`                    | List products (paginated, filtered)  |
| GET    | `/api/v1/products/:slug`              | Product detail + related             |
| GET    | `/api/v1/products/categories`         | All visible categories (tree root)   |
| GET    | `/api/v1/products/categories/:slug`   | Category detail + children           |
| POST   | `/api/v1/quotes`                      | Create a public quote request        |
| POST   | `/api/v1/contact`                     | Create a public contact inquiry      |

### Phase 2 — quote pipeline

| Method | Path                                            | Description                                  |
| ------ | ----------------------------------------------- | -------------------------------------------- |
| GET    | `/api/v1/quotes/track/:number?token=…`          | Buyer-side tokenised tracking view           |
| GET    | `/api/v1/admin/quotes`                          | List quotes (filter by status, search)       |
| GET    | `/api/v1/admin/quotes/:id`                      | Quote detail + items + event audit           |
| PATCH  | `/api/v1/admin/quotes/:id/status`               | Status transition + optional buyer email     |
| PATCH  | `/api/v1/admin/quotes/:id/assign`               | Assign / unassign sales rep                  |
| POST   | `/api/v1/admin/quotes/:id/regenerate-pdf`       | Re-render quote PDF                          |
| GET    | `/static/quotes/<number>.pdf`                   | Public PDF (requires guessing number+access) |

All `/admin/*` routes are gated by `JwtAuthGuard + RolesGuard` (see Phase 3).

### Phase 3 — authentication & RBAC

| Method | Path                                       | Auth   | Description                                  |
| ------ | ------------------------------------------ | ------ | -------------------------------------------- |
| POST   | `/api/v1/auth/register`                    | public | Create CLIENT account; sends verify email    |
| POST   | `/api/v1/auth/login`                       | public | Sets `ru_access` + `ru_refresh` httpOnly     |
| POST   | `/api/v1/auth/refresh`                     | cookie | Rotates refresh, reissues access             |
| POST   | `/api/v1/auth/logout`                      | cookie | Revoke current refresh, clear cookies        |
| POST   | `/api/v1/auth/logout-all`                  | bearer | Revoke all refresh tokens for the user       |
| POST   | `/api/v1/auth/verify-email`                | public | Consume one-shot verification token          |
| POST   | `/api/v1/auth/password-reset/request`      | public | Always 200; sends reset email if user exists |
| POST   | `/api/v1/auth/password-reset/confirm`      | public | Set new password (consumes one-shot token)   |
| GET    | `/api/v1/auth/me`                          | bearer | Current authenticated user                   |

Cookies (`ru_access` 15min, `ru_refresh` 30d) are `httpOnly`, `SameSite=Lax`, and `Secure` when `AUTH_COOKIE_SECURE=true`.

### Phase 4 — client portal

All `/portal/*` routes require JWT (cookie or bearer) and a `UserOnCompany` membership.

| Method | Path                                              | Description                                  |
| ------ | ------------------------------------------------- | -------------------------------------------- |
| GET    | `/api/v1/portal/company`                          | Current company + members + pending invites  |
| POST   | `/api/v1/portal/company/invites`                  | Invite member (ADMIN/OWNER)                  |
| POST   | `/api/v1/portal/company/invites/accept`           | Accept invite (matches signed-in email)      |
| DELETE | `/api/v1/portal/company/invites/:id`              | Revoke pending invite                        |
| PATCH  | `/api/v1/portal/company/members/:userId/role`     | OWNER only                                   |
| DELETE | `/api/v1/portal/company/members/:userId`          | Remove a member (ADMIN/OWNER)                |
| GET    | `/api/v1/portal/addresses`                        | List company addresses                       |
| POST   | `/api/v1/portal/addresses`                        | Create                                       |
| PATCH  | `/api/v1/portal/addresses/:id`                    | Update                                       |
| DELETE | `/api/v1/portal/addresses/:id`                    | Delete                                       |
| GET    | `/api/v1/portal/favorites`                        | Saved products (per-user)                    |
| POST   | `/api/v1/portal/favorites/:productId`             | Add favorite                                 |
| DELETE | `/api/v1/portal/favorites/:productId`             | Remove favorite                              |
| GET    | `/api/v1/portal/quotes`                           | My quotes                                    |
| GET    | `/api/v1/portal/quotes/:id`                       | My quote detail                              |
| GET    | `/api/v1/portal/orders`                           | My company's orders                          |
| GET    | `/api/v1/portal/orders/:id`                       | Order detail + items + events + invoices     |
| POST   | `/api/v1/portal/orders`                           | Place order (also handles quote→order)       |
| POST   | `/api/v1/portal/orders/:id/reorder`               | Re-place a previous order                    |
| PATCH  | `/api/v1/portal/orders/:id/cancel`                | Self-cancel (PENDING only)                   |
| GET    | `/api/v1/portal/orders/invoices/list`             | My company's invoices                        |
| GET    | `/api/v1/portal/orders/invoices/:id`              | Invoice detail                               |
| GET    | `/static/invoices/<number>.pdf`                   | Invoice PDF (issued on SHIPPED)              |

### Rate limits

- Global: `THROTTLE_LIMIT` / `THROTTLE_TTL` (default 20 per 60s)
- `POST /quotes`: 5 per hour per IP
- `POST /contact`: 10 per hour per IP
- All admin routes: not throttled

### Query params — `GET /products`

| Param      | Type      | Default | Notes                                              |
| ---------- | --------- | ------- | -------------------------------------------------- |
| `page`     | int ≥ 1   | 1       | Pagination page                                    |
| `pageSize` | 1..100    | 24      | Page size                                          |
| `search`   | string    | —       | Matches name, sku, shortDesc                       |
| `category` | string    | —       | Category slug                                      |
| `brand`    | string    | —       | Case-insensitive equals                            |
| `featured` | bool      | —       | Pass `true` to filter homepage-featured items      |
| `sort`     | enum      | newest  | `name` \| `newest` \| `sku`                        |

## Folder layout

```
src/
├── main.ts                         # bootstrap
├── app.module.ts                   # root module + middleware wiring
├── config/env.validation.ts        # zod env validation
├── prisma/                         # PrismaService + module
├── common/
│   ├── filters/                    # AllExceptionsFilter
│   ├── middleware/                 # RequestContextMiddleware
│   ├── pipes/                      # ZodValidationPipe
│   └── dto/                        # shared DTOs (pagination, etc.)
└── modules/
    ├── health/
    ├── categories/
    ├── products/
    ├── quotes/
    ├── contact/
    └── mail/
```

Every feature module follows: `controller → service → repository`.

## Run

```bash
pnpm --filter @ru/api dev      # watch mode
pnpm --filter @ru/api build    # build to dist/
pnpm --filter @ru/api start    # run dist/main.js
```

## Future modules

`auth`, `users`, `clients`, `orders`, `invoices`, `promotions`, `cms`, `audit` land in later phases without touching Phase 1 modules.
