# Brand Guidelines — UK Booking Calendar

---

## Mission Statement

To give UK tradespeople a straightforward, self-hosted platform that handles appointment booking, customer communication, and calendar management — so they can spend less time on admin and more time on the job.

---

## Brand Values

### 1. Simplicity

The product exists to reduce complexity, not add to it. Every feature, screen, and interaction should earn its place. If a tradesperson can't figure it out between jobs, it's too complicated.

### 2. Reliability

Tradespeople stake their reputation on showing up. The platform must be equally dependable — accurate scheduling, timely reminders, and no lost bookings.

### 3. Privacy-First

Customer and business data stays under the operator's control. Self-hosted, UK data residency, GDPR-compliant by design. No selling data, no third-party tracking, no surprises.

### 4. Practicality

Built for people who work with their hands, not in front of screens all day. Mobile-first, fast-loading, and designed around real-world workflows — not theoretical ones.

### 5. Transparency

Open source, honest communication, clear pricing (free). No dark patterns, no hidden upsells, no lock-in.

---

## Brand Voice & Tone

### Voice Characteristics

| Attribute | Description |
|---|---|
| **Direct** | Say what needs saying without waffle. Use plain English. |
| **Professional** | Respectful and competent, but never corporate or stiff. |
| **Helpful** | Guide the user toward success without being patronising. |
| **Confident** | Clear and assured, but not arrogant. |

### Writing Rules

- Use British English throughout (colour, organise, centre, cancelled).
- Prefer short sentences. One idea per sentence where possible.
- Use active voice: "We send a reminder" not "A reminder is sent".
- Address the user as "you". Refer to the platform as "we" or by name.
- Avoid jargon. Say "booking" not "appointment resource allocation". Say "customer" not "end-user".
- Avoid superlatives and marketing fluff. No "revolutionary", "game-changing", or "cutting-edge".
- Use contractions naturally (you'll, we've, it's) — the tone is professional, not formal.

### Tone by Context

| Context | Tone |
|---|---|
| **Onboarding / setup** | Encouraging, step-by-step, patient |
| **Dashboard / daily use** | Minimal, factual, efficient |
| **Error messages** | Honest, specific, actionable ("We couldn't save that booking. Check the date isn't in the past and try again.") |
| **AI chatbot (customer-facing)** | Formal, polite, clear — represents the tradesperson's business |
| **Success states** | Brief confirmation, no celebration ("Booking confirmed for 14 March at 10:00.") |
| **Empty states** | Helpful prompt, not decorative ("No bookings this week. Share your booking link to get started.") |

---

## Visual Identity

### Colour Palette

The palette is functional and restrained. Colours serve UI purposes first and branding second.

| Role | Colour | Hex | Usage |
|---|---|---|---|
| **Primary** | Slate Blue | `#3B5998` | Primary buttons, active states, links |
| **Primary Dark** | Deep Slate | `#2C4373` | Hover states, headers |
| **Secondary** | Warm Grey | `#6B7280` | Secondary text, borders, subtle UI |
| **Accent** | Amber | `#F59E0B` | Highlights, badges, attention indicators |
| **Success** | Green | `#10B981` | Confirmed bookings, success messages |
| **Warning** | Orange | `#F97316` | Pending states, caution notices |
| **Danger** | Red | `#EF4444` | Cancellations, destructive actions, errors |
| **Background** | Off-White | `#F9FAFB` | Page backgrounds |
| **Surface** | White | `#FFFFFF` | Cards, panels, modals |
| **Text Primary** | Near Black | `#111827` | Headings, body text |
| **Text Secondary** | Grey | `#6B7280` | Supporting text, labels |

### Colour Usage Rules

- Primary colour is used sparingly — only for the most important action on any given screen.
- Never rely on colour alone to convey meaning. Always pair with text, icons, or patterns.
- Status colours (success, warning, danger) are reserved for their semantic meanings. Don't repurpose them for decoration.
- The embeddable widget supports a `data-accent-colour` override — the tradesperson's chosen colour replaces the primary in widget context only.

### Typography

| Role | Font | Weight | Size |
|---|---|---|---|
| **Headings** | Inter | 600 (Semi-bold) | 1.5rem - 2.25rem |
| **Body** | Inter | 400 (Regular) | 0.875rem - 1rem |
| **Labels / captions** | Inter | 500 (Medium) | 0.75rem - 0.875rem |
| **Monospace (codes, IDs)** | JetBrains Mono | 400 | 0.875rem |

- Inter is the primary typeface across all interfaces. It is legible at small sizes, works well on mobile, and is freely available.
- Line height for body text: 1.5 (24px at 16px base).
- Maximum content width: 72ch for readability.

### Spacing & Layout

- Base spacing unit: 4px (0.25rem). All spacing derives from multiples of this unit.
- Standard page padding: 16px on mobile, 24px on tablet, 32px on desktop.
- Card padding: 16px on mobile, 24px on larger screens.
- Consistent vertical rhythm: space between sections is always a multiple of 8px.

### Border Radius

| Element | Radius |
|---|---|
| Buttons | 6px (rounded-md) |
| Cards / panels | 8px (rounded-lg) |
| Inputs | 6px (rounded-md) |
| Badges / chips | 9999px (rounded-full) |
| Modals | 12px (rounded-xl) |

### Shadows

Use shadows sparingly. They indicate elevation, not decoration.

| Level | Usage | Value |
|---|---|---|
| **sm** | Cards, dropdowns | `0 1px 2px rgba(0,0,0,0.05)` |
| **md** | Modals, popovers | `0 4px 6px rgba(0,0,0,0.07)` |
| **lg** | Chat widget (floating) | `0 10px 25px rgba(0,0,0,0.1)` |

---

## Iconography

- Use Lucide icons (bundled with shadcn/ui) as the standard icon set.
- Icons are functional, not decorative. Every icon should have a clear purpose.
- Standard icon size: 16px inline with text, 20px for buttons, 24px for standalone navigation.
- Icons must always have an accessible label (aria-label or adjacent text).

---

## Logo

### Usage

The logo is the product name set in **Inter Semi-bold** with no icon or symbol. This reflects the product's no-nonsense, utility-first character.

**Primary mark:** `UK Booking Calendar`
**Short mark:** `UKBC` (for favicons, compact UI elements)

### Logo Rules

- Always render the logo in the primary text colour (#111827) on light backgrounds, or white (#FFFFFF) on dark backgrounds.
- Minimum clear space around the logo: equal to the height of the "U" in "UK".
- Do not add drop shadows, gradients, outlines, or effects to the logo.
- Do not rotate, stretch, or recolour the logo beyond the two approved colour treatments.

---

## Component Guidelines

Built on shadcn/ui and Tailwind CSS. These rules ensure consistency across the application.

### Buttons

| Variant | Usage |
|---|---|
| **Primary** (filled, primary colour) | One per screen — the main action (e.g. "Confirm Booking") |
| **Secondary** (outlined) | Supporting actions (e.g. "Cancel", "Back") |
| **Ghost** (no background) | Tertiary actions, navigation links |
| **Destructive** (filled, danger colour) | Irreversible actions (e.g. "Delete Account") — always require confirmation |

### Forms

- Every input has a visible label. No placeholder-only labels.
- Error messages appear directly below the relevant field, in the danger colour, with a specific description of what's wrong.
- Required fields are the default. Mark optional fields with "(optional)" — not the other way round.
- Group related fields logically. Use fieldsets with legends for accessibility.

### Tables

- Zebra striping for rows with more than 5 items.
- Sticky headers on scroll.
- Actions column aligned to the right.
- Mobile: tables collapse to card-based layouts.

### Empty States

- Centred layout with a short message and a single call-to-action.
- No illustrations or mascots. Keep it functional.

### Loading States

- Skeleton loaders for content areas (not spinners).
- Button loading: disable the button and show a spinner inside it.
- Page-level loading: skeleton of the page layout.

---

## Accessibility

- WCAG 2.1 AA compliance as the minimum standard.
- All interactive elements must be keyboard-accessible.
- Colour contrast ratios: minimum 4.5:1 for normal text, 3:1 for large text.
- Focus indicators must be clearly visible (use a 2px ring in the primary colour).
- All images and icons must have alt text or aria-labels.
- Forms must be navigable and submittable via keyboard alone.
- Screen reader announcements for dynamic content changes (toast notifications, status updates).

---

## Responsive Behaviour

| Breakpoint | Width | Layout |
|---|---|---|
| **Mobile** | < 640px | Single column, full-width components, bottom navigation |
| **Tablet** | 640px - 1024px | Two-column where appropriate, side navigation |
| **Desktop** | > 1024px | Full layout, sidebar navigation, multi-panel views |

- Touch targets: minimum 44px x 44px on mobile.
- No horizontal scrolling at any breakpoint.
- The calendar view switches from a weekly grid (desktop) to a daily list (mobile).

---

## File & Asset Naming

- All filenames in kebab-case: `booking-calendar.tsx`, `brand-guidelines.md`.
- Component files match their export name in PascalCase: `BookingCard.tsx` exports `BookingCard`.
- Image assets: `logo-dark.svg`, `logo-light.svg`, `icon-favicon.png`.
- No spaces, no uppercase in filenames outside of component files.

---

## Summary

This brand is defined by restraint. The product is a tool, not a lifestyle brand. Every visual and verbal choice should make the platform easier to use, easier to trust, and easier to maintain. When in doubt, leave it out.
