# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UK Booking Calendar — a self-hosted booking platform for UK tradespeople. Single Next.js application (App Router, TypeScript) handling API routes, SSR pages, background jobs, and a static embeddable chat widget. SQLite database, Docker deployment, no microservices.

## Commands

```bash
npm run dev              # Dev server with Turbopack (http://localhost:3000)
npm run build            # Production build
npm run start            # Start production server
npm run lint             # ESLint (flat config, ESLint 9)
npm run db:migrate       # Run all pending Knex migrations
npm run db:rollback      # Roll back last migration batch
npm run db:migrate:make -- <name>  # Create a new migration file
```

No test framework is configured yet.

## Architecture

- **Framework:** Next.js 16 with App Router, React 19, TypeScript 5
- **Styling:** Tailwind CSS 4 (via `@tailwindcss/postcss`) + shadcn/ui (`new-york` style, Lucide icons)
- **Database:** SQLite via better-sqlite3, queried through Knex. Connection configured in `src/lib/db/index.ts`. Migrations live in `src/lib/db/migrations/` as `.ts` files. Knex config in `knexfile.ts`
- **Auth:** Custom JWT with three roles: admin, tradesman, manager. Email/password only, no OAuth
- **Deployment:** Docker (standalone Next.js output). `docker compose up --build` runs on port 3000
- **CI:** GitHub Actions — lint + build on all pushes/PRs to main; Docker image build on main only

### Path alias

`@/*` maps to `./src/*` (configured in tsconfig.json).

### Key directories

- `src/app/` — Next.js App Router pages, layouts, and API routes
- `src/components/ui/` — shadcn/ui components
- `src/lib/db/` — Database connection and migrations
- `src/lib/utils.ts` — Shared utilities (`cn()` for class merging)
- `src/hooks/` — Custom React hooks
- `docs/PLAN.md` — Full implementation plan with architecture decisions
- `docs/BRAND.md` — Brand guidelines and design system
- `data/` — SQLite database files (gitignored)

## Conventions

- **British English** throughout — colour, organise, centre, cancelled
- **Filenames:** kebab-case for all files except React components which use PascalCase exports
- **shadcn/ui:** Add components via `npx shadcn-ui add <component>`. Components land in `src/components/ui/`
- **Fonts:** Inter (sans) and JetBrains Mono (mono), loaded in root layout via `next/font/google`
- **CSS variables:** Brand colours and theme tokens defined in `src/app/globals.css` with light/dark mode support
- **Next.js config:** `output: "standalone"` for Docker; `serverExternalPackages` includes knex and better-sqlite3
- **Privacy:** `.npmrc` sets `audit=false` and `fund=false`. Next.js telemetry should be disabled (`npx next telemetry disable`). Dev tooling should avoid external connections except AI endpoints

## Implementation Phases

The project follows an 11-phase plan (see `docs/PLAN.md`). Phase 1 (scaffolding) is complete. Priority order: authentication → booking schema → AI chatbot (MVP) → calendar features → GDPR → calendar sync → SMS/email → dashboard → GDPR automation → testing/launch.

## Agent-Specific Notes

This repository includes a compiled documentation database/knowledgebase at `AGENTS.db`.
For context for any task, you MUST use MCP `agents_search` to look up context including architectural, API, and historical changes.
Treat `AGENTS.db` layers as immutable; avoid in-place mutation utilities unless required by the design.
