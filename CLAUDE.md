# Calendar App

## Project Overview
Collaborative calendar web app where users create personal and group calendars, manage events, and invite others via email. Built with Next.js App Router following server-first patterns.

## Tech Stack
- **Framework**: Next.js 16.1.6 (App Router), React 19, TypeScript 5
- **Styling**: Tailwind CSS 4, shadcn/ui (new-york preset), Radix UI, Lucide icons
- **Calendar UI**: FullCalendar 6 with daygrid/timegrid/list/rrule plugins
- **Database**: PostgreSQL via Prisma 7 + `@prisma/adapter-pg`
- **Auth**: Firebase Auth (Google OAuth via `signInWithPopup`) + Firebase Admin SDK (session cookies)
- **Email**: Resend + `@react-email/components`
- **Notifications**: Sonner toasts
- **Date utilities**: date-fns 4, date-fns-tz, rrule

## Key Directories

| Path | Purpose |
|------|---------|
| `app/(app)/` | Protected routes — auth guard enforced in `layout.tsx:11` |
| `app/(auth)/` | Public auth routes (login page) |
| `app/api/auth/` | NextAuth catch-all handler |
| `app/api/invites/[token]/` | Invite acceptance/decline endpoint |
| `actions/` | Server actions: `calendars.ts`, `events.ts` |
| `components/calendar/` | `CalendarClient.tsx`, `EventForm.tsx`, `EventModal.tsx` |
| `components/calendars/` | `CalendarForm.tsx`, `CalendarSidebar.tsx`, `MemberManager.tsx` |
| `components/layout/` | `AppShell.tsx` (+ `VisibleCalendarsContext`), `Header.tsx`, `MobileSidebar.tsx` |
| `components/ui/` | shadcn/ui primitives — do not edit directly |
| `lib/` | `firebase-client.ts`, `firebase-admin.ts`, `session.ts`, `prisma.ts`, `resend.ts`, `utils.ts`, `emails/` |
| `prisma/` | `schema.prisma` — 5 models (User, Calendar, CalendarMember, Event, EventAttendee, InviteToken) |
| `types/` | (empty — `AppSession` type is defined in `lib/session.ts`) |

## Build & Test Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm start        # Start production server
npm run lint     # ESLint check
```

No test suite is configured. Manual testing via the dev server is the primary verification path.

## Environment Setup
Copy `.env.example` and fill in:
- `DATABASE_URL` / `DIRECT_URL` — Supabase PostgreSQL connection strings
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` — Firebase Admin SDK (server-side)
- `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID` — Firebase client SDK
- `RESEND_API_KEY` / `RESEND_FROM_EMAIL` — email service
- `NEXT_PUBLIC_BASE_URL` — base URL for invite links (e.g. `http://localhost:3000`)

After setting up `.env`, run `npx prisma migrate deploy` to apply migrations.

## Path Alias
All imports use `@/` mapping to the repo root (configured in `tsconfig.json`).

## Adding New Features or Fixing bugs

## Additional Documentation
Check these files when relevant:

| File | When to consult |
|------|----------------|
| `.claude/docs/architectural_patterns.md` | Adding server actions, auth checks, new routes, shared state, email invites, or FormData handling |
