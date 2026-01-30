# Project Plan — UK Booking Calendar

## Status: Requirements gathered — ready for implementation

---

## Architecture

All services, APIs, UIs, and background jobs are implemented within a **single Next.js application** (App Router, TypeScript). There is no separate backend or microservice — the Next.js app handles:

- API routes (booking calendar, AI chat bot, auth, calendar sync, SMS/email)
- Server-side rendering and client pages (customer-facing, management dashboard)
- Background/scheduled tasks (calendar sync polling, SMS reminders, GDPR auto-anonymisation)
- Static assets (embeddable chat widget JS bundle)

---

## Decisions

### 1. Database & Data Layer

| Decision | Choice |
|---|---|
| Database | SQLite |
| Query builder | Knex |
| Hosting | Self-hosted |
| Job notes/photos on bookings | No |
| GDPR data retention period | 90 days |

### 2. Authentication & Authorisation

| Decision | Choice |
|---|---|
| Auth approach | Custom JWT |
| User roles | Admin, tradesman, manager |
| Customer accounts | Email-only (no accounts) |
| OAuth sign-in | No — email/password only |
| Multi-tenancy | No — single business |

### 3. Booking Calendar

| Decision | Choice |
|---|---|
| Booking granularity | 1 hour slots |
| Working hours | Admin/team manager decides per tradesman |
| Recurring bookings | Yes |
| Multi-day bookings | Yes |
| Buffer time between bookings | Optional/customizable |
| Customer cancel/reschedule | Yes — with customizable notice period |
| Booking statuses | Pending, confirmed, in-progress, completed, cancelled, no-show |
| Payments/deposits | No — purely scheduling |
| Service area / travel radius | Yes — displayed on calendar |

### 4. AI Chat Bot

| Decision | Choice |
|---|---|
| LLM provider | Customizable via API key (start with Gemini) |
| Bot tone | Formal |
| Conversation paths | Customizable beyond booking + callback |
| FAQ / knowledge base | Yes — per tradesman |
| Handle payments | No — schedule bookings only |
| Unresolved queries | Leave a message |
| Abuse prevention | Rate limiting |
| Chat history | Standalone sessions (not persisted) |

### 4a. Embeddable Chat Widget

The chat bot must be embeddable on any third-party website via a single script tag.

| Decision | Choice |
|---|---|
| Embedding method | Single `<script>` tag with a `data-tradesman-id` attribute |
| Bundle format | Self-contained JS bundle (no external dependencies at runtime) |
| Rendering | Widget creates its own shadow DOM container to avoid CSS conflicts with host site |
| Position | Fixed bottom-right floating button that opens a chat panel |
| Styling | Self-contained styles within shadow DOM; no leakage to/from host page |
| Communication | Widget talks to the Next.js API routes via HTTPS (CORS-enabled for registered domains) |
| Authentication | Public — no login required; identified by tradesman ID in the script tag |
| Configuration | Minimal: tradesman ID required; optional overrides for position, theme colour, greeting message |
| Loading | Async/deferred script load — must not block host page rendering |
| Size target | < 50 KB gzipped for the widget bundle |
| Browser support | Modern browsers (last 2 versions of Chrome, Firefox, Safari, Edge) |
| Mobile | Responsive — full-screen chat panel on small viewports |
| Security | CORS allowlist per tradesman; rate limiting by IP; no customer PII stored in widget |

**Example embed code:**
```html
<script src="https://yourdomain.com/widget.js" data-tradesman-id="abc123" async></script>
```

**Optional attributes:**
- `data-position` — `bottom-right` (default), `bottom-left`
- `data-accent-colour` — hex colour for the chat button and header
- `data-greeting` — custom greeting message

### 5. Calendar Sync (Google / Outlook / Office 365)

| Decision | Choice |
|---|---|
| Sync direction | Two-way |
| Sync frequency | Every 30 minutes |
| External event blocking | TBD — needs clarification |
| Google Calendar | Yes — required alongside Outlook |
| Conflict resolution | Flag conflicts for manual resolution (for now) |

### 6. SMS (Plivo) & Email (Resend)

| Decision | Choice |
|---|---|
| SMS messages | Booking confirmation, reminder, cancellation, custom |
| Reminder timing | Both 1 hour and 24 hours before |
| SMS direction | Send-only (no two-way) |
| Email templates | Confirmation, reminder, cancellation, callback request to staff |
| SMS cost model | Plivo/supplier/platform pays |

### 7. Management Dashboard

| Decision | Choice |
|---|---|
| Key metrics | Bookings |
| Super-admin role | Yes — manages all tradesmen |
| Reporting / export | Yes — CSV and PDF |
| Team calendar view | Yes — all tradesmen side by side |
| Booking approval workflow | Optional |

### 8. GDPR Compliance

| Decision | Choice |
|---|---|
| Cookie consent banner | Yes |
| Subject Access Request via UI | Yes |
| Right-to-deletion in admin | Yes |
| Privacy policy hosting | On this service |
| DPA template for sign-up | No |
| Auto-anonymise after retention | Yes |

### 9. Deployment & Infrastructure

| Decision | Choice |
|---|---|
| Deployment target | Docker (not Vercel) |
| Data residency | UK |
| Staging environment | No |
| CI/CD | GitHub Actions |
| Logging / monitoring | None yet |
| Custom domain | No (not yet) |

### 10. Design & UX

| Decision | Choice |
|---|---|
| Design system / Figma | None |
| UI component library | shadcn/ui |
| CSS approach | Tailwind CSS |
| Layout priority | Mobile-first |
| White-label / themeable | No |

### 11. Scope & Prioritisation

| Decision | Choice |
|---|---|
| MVP | AI chatbot |
| Priority order | AI chatbot API/UI first, then calendar |
| Hard deadlines | No |
| Team / contributors | Open source |

### 12. Dev Tools & External Connections

Dev tooling should not make external connections except for AI endpoints. The chosen stack is well-suited for this constraint.

**Fully local (no external connections at runtime):**

| Tool | Notes |
|---|---|
| TypeScript compiler | Local-only, no telemetry |
| ESLint / Prettier | Local-only, no telemetry |
| Tailwind CSS | JIT compiler runs locally |
| SQLite | Filesystem database, zero network activity |
| Knex | Local query builder, no phone-home behaviour |

**Require opt-out or one-time external access:**

| Tool | Action Required |
|---|---|
| Next.js | Disable telemetry: `npx next telemetry disable` (persists across runs; without this it reports anonymous usage to Vercel) |
| npm / yarn / pnpm | Connects to npm registry on `install` and `audit`; use `--prefer-offline` after initial install to minimise |
| shadcn/ui CLI | Fetches component source from GitHub on `npx shadcn-ui add`; one-time per component, local files thereafter |
| Docker | Pulls base images from registries during build; cache and pin images to avoid repeated fetches |

**External by design (accepted exceptions):**

| Tool | Reason |
|---|---|
| GitHub Actions CI/CD | Runs on GitHub infrastructure; use a self-hosted runner if fully local CI is needed |
| AI endpoints (Gemini etc.) | Only planned runtime external connection; isolated to a single integration point; stub with a mock endpoint for offline dev |

**Additional safeguards:**

- Pin dependency versions in `package-lock.json` to avoid unexpected fetches of new packages
- Audit `postinstall` scripts in dependencies — some packages make network calls during install; use `--ignore-scripts` if needed and selectively allow trusted ones
- Keep `.npmrc` configured with `audit=false` and `fund=false` to suppress optional network calls during installs

---

## Implementation Plan

Based on the priority order (AI chatbot first, then calendar), the implementation phases are:

### Phase 1 — Project Setup

1. Initialise Next.js project with TypeScript, ESLint, and Tailwind CSS
2. Set up shadcn/ui component library
3. Configure SQLite database with Knex
4. Set up Docker deployment configuration
5. Set up GitHub Actions CI/CD pipeline

### Phase 2 — Authentication

1. Implement custom JWT authentication (email/password)
2. Create role-based access control (admin, tradesman, manager)
3. Build login/register pages

### Phase 3 — Booking Schema & Core API

The chatbot (Phase 4) needs to create bookings, so the data model and core API must exist first.

1. Design booking database schema (1-hour slots, recurring, multi-day, statuses)
2. Build booking calendar API (CRUD, status management)
3. Implement UK timezone (GMT/BST) and public holiday awareness

### Phase 4 — AI Chat Bot (MVP)

1. Build chat bot API with Gemini integration (customizable API key)
2. Implement rate limiting for public-facing widget (by IP)
3. Add FAQ/knowledge base support per tradesman
4. Implement "leave a message" fallback for unresolved queries
5. Create formal-tone conversation flows for booking creation and callback requests
6. Build embeddable chat widget as a self-contained JS bundle:
   - Set up a separate build pipeline (e.g. esbuild/Rollup) to produce a single `widget.js` file
   - Widget reads `data-tradesman-id` from its own script tag to identify the tradesman
   - Render into a shadow DOM container to isolate styles from the host page
   - Floating button (bottom-right by default) that opens a chat panel
   - Full-screen chat panel on mobile viewports
   - Support optional `data-position`, `data-accent-colour`, `data-greeting` attributes
   - Async loading — must not block host page rendering
   - Target < 50 KB gzipped bundle size
7. Configure CORS on chat API routes to allow requests from registered domains per tradesman
8. Serve `widget.js` as a static asset from the Next.js app (`/public` or a dedicated route)

### Phase 5 — Booking Calendar (Remaining)

1. Add customizable working hours (set by admin/team manager)
2. Implement optional buffer time between bookings
3. Build customer cancel/reschedule with configurable notice period
4. Build customer-facing booking UI
5. Add service area / travel radius display

### Phase 6 — GDPR Fundamentals

Customer-facing features (chatbot, booking UI) are now live, so consent and privacy must be in place before wider rollout.

1. Add cookie consent banner
2. Host privacy policy and terms of service
3. Establish data-handling practices (minimisation, retention rules in code)

### Phase 7 — Calendar Sync (Google / Outlook / Office 365)

1. Implement two-way Outlook / Office 365 sync (30-min polling)
2. Implement two-way Google Calendar sync (30-min polling)
3. Add conflict flagging for clashing events

### Phase 8 — SMS & Email

1. Integrate Plivo for SMS (confirmation, reminder at 1h + 24h, cancellation)
2. Integrate Resend for email (confirmation, reminder, cancellation, callback request)

### Phase 9 — Management Dashboard

1. Build dashboard with booking metrics
2. Add super-admin view for managing all tradesmen
3. Implement team calendar (side-by-side view)
4. Add CSV and PDF export
5. Add optional booking approval workflow

### Phase 10 — GDPR Automation

1. Implement Subject Access Request flow (customer UI)
2. Implement right-to-deletion flow (admin panel)
3. Build auto-anonymisation after 90-day retention period

### Phase 11 — Testing & Launch

1. Security review (OWASP top 10, GDPR audit)
2. End-to-end testing
3. Docker production build and deployment
