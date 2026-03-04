# Architectural Patterns

Patterns that appear consistently across multiple files in this codebase.

---

## 1. Server Actions

**Files**: `actions/calendars.ts`, `actions/events.ts`

All server actions follow this structure:

1. `"use server"` directive at the top of the file
2. Call `await getSession()` from `@/lib/session` first — return `{ error: "Not authenticated" }` if null (`actions/calendars.ts:12-13`)
3. Authorization check (ownership or membership) before any mutation (`actions/calendars.ts:45-47`)
4. Perform the Prisma mutation
5. Call `revalidatePath()` to invalidate Next.js cache (`actions/calendars.ts:34`)
6. Return `{ success: true }` on success, `{ error: "message" }` on failure

**Authorization patterns**:
- Owner check: `calendar.ownerId !== session.userId` → return error (`actions/calendars.ts:46`)
- Membership check: `CalendarMember.findUnique({ where: { calendarId_userId: ... } })` → return error if null (`actions/events.ts:37-40`)
- Event edit: creator OR calendar owner can act (`actions/events.ts:110-112`)

---

## 2. Async Server Components with Auth Guard

**Files**: `app/(app)/layout.tsx`, all page files under `app/(app)/`

Layouts and pages are `async` functions. Data is fetched directly with Prisma — no API layer.

```
getSession() + redirect pattern — app/(app)/layout.tsx:11-12
Prisma query → passed as props to client component — app/(app)/layout.tsx:14-22
```

Auth redirect: `if (!session?.userId) redirect("/login")` (`app/(app)/layout.tsx:12`)

`getSession()` is defined in `lib/session.ts`. It reads the `__session` HttpOnly cookie and verifies it using Firebase Admin SDK (`adminAuth.verifySessionCookie`). Returns `AppSession | null`.

---

## 3. Route Groups for Auth Separation

**Files**: `app/(app)/`, `app/(auth)/`

- `(app)` group: all routes require authentication; guard in `app/(app)/layout.tsx`
- `(auth)` group: public routes (login); no auth check
- Route group names don't affect URL paths

---

## 4. Shared UI State via Context

**File**: `components/layout/AppShell.tsx`

Calendar visibility is shared across the sidebar, mobile nav, and the calendar view using React Context:

- `VisibleCalendarsContext` — `createContext<Set<string>>(new Set())` (`AppShell.tsx:66`)
- `useVisibleCalendars()` hook exported for consumers (`AppShell.tsx:68-70`)
- State (`useState<Set<string>>`) lives in `AppShell` and is initialized from all calendar IDs (`AppShell.tsx:17-19`)
- Provider wraps `{children}` in the main content area (`AppShell.tsx:47-49`)

---

## 5. FormData for Server Actions

**Files**: `components/calendars/CalendarForm.tsx`, `components/calendar/EventForm.tsx`, `actions/calendars.ts`, `actions/events.ts`

Client components build a `FormData` object and pass it directly to server actions:

- Scalar values: `fd.set("name", name)` (`CalendarForm.tsx:37-39`)
- Arrays serialized as JSON strings: `fd.set("attendeeEmails", JSON.stringify(emails))`
- Server parses arrays: `JSON.parse(formData.get("attendeeEmails") as string)` (`actions/events.ts:28-30`)

---

## 6. `useTransition` for Loading State

**Files**: `components/calendars/CalendarForm.tsx`, `components/calendars/MemberManager.tsx`

Pattern for async server action calls from client components:

```
const [isPending, startTransition] = useTransition()  — CalendarForm.tsx:29
startTransition(async () => { ... })                  — CalendarForm.tsx:41
disabled={isPending}                                   — CalendarForm.tsx:132
```

Submit buttons and destructive actions are disabled while `isPending` to prevent double-submit.

---

## 7. Singleton Prisma Client

**File**: `lib/prisma.ts`

Prevents multiple `PrismaClient` instances during Next.js dev hot-reload:

- Uses `globalThis` as a cache (`lib/prisma.ts:4`)
- Only assigns to global in non-production (`lib/prisma.ts:17`)
- Uses `@prisma/adapter-pg` with the `DATABASE_URL` env var (`lib/prisma.ts:11`)

Import everywhere as: `import { prisma } from "@/lib/prisma"`

---

## 8. Email + Invite Token Flow

**Files**: `actions/calendars.ts:111-126`, `actions/events.ts:70-87`, `app/api/invites/[token]/route.ts`

1. Create an `InviteToken` record in the DB with `type`, `targetId`, `inviteeId`, `expiresAt`
2. Pass `token.token` to a send-email helper in `lib/emails/`
3. Email contains a link to `/api/invites/[token]`
4. GET handler at that route looks up the token, validates expiry and `usedAt`, then updates attendance status

Calendar invites expire in 30 days (`actions/calendars.ts:116`); event invites expire in 7 days (`actions/events.ts:75`).

---

## 9. shadcn/ui + `cn()` Usage

**Files**: All feature components, `lib/utils.ts`

- Primitive components live in `components/ui/` — built on Radix UI, do not modify directly; re-run `npx shadcn add <component>` to add new ones
- `cn()` merges Tailwind classes: `import { cn } from "@/lib/utils"` (`lib/utils.ts`)
- All imports use the `@/` alias

---

## 10. Dynamic Route Params (Next.js 16+)

**Files**: `app/(app)/calendars/[id]/page.tsx`, `app/(app)/events/[id]/edit/page.tsx`

In Next.js 16, `params` is a Promise — pages must `await` it:

```typescript
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  ...
}
```

All dynamic route pages are `async` functions.
