# UK Booking Calendar

Appointment booking and AI chat bot platform for UK tradesmen. Self-hosted, GDPR-compliant, and built for both independent tradespeople and team-based operations.

## Features

- **Booking calendar** — 1-hour slot scheduling aware of UK working hours and public holidays. Supports recurring bookings, multi-day jobs, and configurable buffer time.
- **AI chat bot** — Embeddable widget for any website via a single `<script>` tag. Handles booking creation, callback requests, and FAQ responses. Powered by Gemini (configurable LLM provider).
- **Authentication** — Email/password login with JWT. Roles: admin, tradesman, manager.
- **Calendar sync** — Two-way sync with Google Calendar and Outlook/Office 365.
- **SMS & email** — Booking confirmations, reminders (1h + 24h), and cancellation notices via Plivo (SMS) and Resend (email).
- **Management dashboard** — Booking metrics, team calendar view, CSV/PDF export, optional approval workflow.
- **GDPR compliance** — Cookie consent, subject access requests, right-to-deletion, auto-anonymisation after 90 days.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| UI | shadcn/ui, Tailwind CSS 4 |
| Database | SQLite (better-sqlite3) |
| Query builder | Knex |
| Deployment | Docker (self-hosted) |
| CI/CD | GitHub Actions |

## Getting started

### Prerequisites

- Node.js 22+
- npm

### Install and run

```bash
npm install
npm run dev
```

The app starts at [http://localhost:3000](http://localhost:3000).

### Available scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Run all pending migrations |
| `npm run db:migrate:make` | Create a new migration file |
| `npm run db:rollback` | Roll back the last migration batch |

### Database

SQLite databases are stored in the `data/` directory. The dev server uses `data/dev.sqlite3` and production uses `data/production.sqlite3`.

To create a new migration:

```bash
npm run db:migrate:make -- my_migration_name
```

### Docker

Build and run with Docker Compose:

```bash
docker compose up --build
```

The SQLite database is persisted via a named Docker volume (`app-data`).

## Project structure

```
src/
  app/            # Next.js App Router pages and layouts
  components/     # React components
    ui/           # shadcn/ui components
  lib/            # Shared utilities and modules
    db/           # Database connection and migrations
      migrations/ # Knex migration files
  hooks/          # React hooks
data/             # SQLite database files (git-ignored)
public/           # Static assets
```

## Licence

See [LICENSE](LICENSE).
