# @ru/db

Shared Prisma schema, client wrapper, and seed data.

## Layout

```
prisma/
├── schema.prisma         # source of truth
└── seed.ts               # category tree + sample products
src/
├── client.ts             # singleton PrismaClient
└── index.ts              # public exports
```

## Phase 1 tables

| Model            | Notes                                                   |
| ---------------- | ------------------------------------------------------- |
| `ProductCategory`| Self-referential tree (parent/children), SEO meta       |
| `Product`        | Slug + SKU unique, `specs`/`dimensions` are JSON        |
| `ProductImage`   | Cloudinary-ready fields                                 |
| `ProductDocument`| Spec sheets, datasheets (S3-ready)                      |
| `QuoteRequest`   | Anonymous-friendly lead, optional `submittedByUserId`   |
| `QuoteItem`      | Snapshot fields preserve quote history                  |
| `ContactInquiry` | Lead-capture form submissions                           |
| `User` (stub)    | Minimal; full auth lands in Phase 3                     |

## Future tables

Schemas reserved for: `Order`, `OrderItem`, `Invoice`, `Address`, `PriceList`, `ClientPrice`, `Company`, `Brand`, `Promotion`, `Campaign`, `AuditLog`, `RefreshToken`, etc. All will reference existing IDs (`User.id`, `Product.id`) — Phase 1 tables don't need to change.

## Commands

```bash
pnpm db:generate      # generate Prisma Client
pnpm db:migrate       # create + apply a dev migration
pnpm db:seed          # seed categories + sample products
pnpm db:studio        # open Prisma Studio
```

`DATABASE_URL` is read from `apps/api/.env` (and root `.env` for tooling).
