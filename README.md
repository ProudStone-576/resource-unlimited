# Resources Unlimited — B2B Packaging Platform

Monorepo for the **Resources Unlimited** platform — the authorized Canadian distributor of Grafico Packaging.

> **Phase 1** delivers the public marketing + catalog site, quote request, and contact form. Authentication, client portal, admin CMS, and analytics ship in later phases.

## Stack

- **apps/web** — Next.js 16 (App Router, RSC) + TypeScript + Tailwind CSS
- **apps/api** — NestJS 10 + Express + Zod + Prisma
- **packages/db** — Prisma schema + client (PostgreSQL)
- **packages/ui** — Shared React + Tailwind component library
- **pnpm workspaces** + TypeScript project references

## Quick start

```bash
# 1. Install
pnpm install

# 2. Configure env
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local

# 3. Start Postgres locally (Docker example)
docker run --name ru-postgres -p 5432:5432 \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=resources_unlimited -d postgres:16

# 4. Migrate + seed
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# 5. Run both apps
pnpm dev
# → web:  http://localhost:3000
# → api:  http://localhost:4000/api/v1
```

## Workspace scripts

| Command            | What it does                                        |
| ------------------ | --------------------------------------------------- |
| `pnpm dev`         | Runs `web` and `api` in parallel                    |
| `pnpm dev:web`     | Only Next.js                                        |
| `pnpm dev:api`     | Only NestJS                                         |
| `pnpm build`       | Builds packages, then apps                          |
| `pnpm typecheck`   | TS check across the whole workspace                 |
| `pnpm lint`        | ESLint across the workspace                         |
| `pnpm db:migrate`  | Apply Prisma migrations (dev mode)                  |
| `pnpm db:seed`     | Seed reference categories + sample products        |
| `pnpm db:studio`   | Open Prisma Studio                                  |

## Documents

- [ARCHITECTURE.md](./ARCHITECTURE.md) — system design, conventions, future-proofing
- [ROADMAP.md](./ROADMAP.md) — phased delivery plan (Phase 1 → Phase 6)
- [apps/api/README.md](./apps/api/README.md) — API conventions
- [apps/web/README.md](./apps/web/README.md) — web app conventions
- [packages/db/README.md](./packages/db/README.md) — Prisma + migrations
