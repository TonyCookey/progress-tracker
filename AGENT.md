# AGENT.md — DA Progress Tracker

> Operating guide for AI agents (and humans) working on this codebase.
> Read this fully before making changes. Keep it up to date when architecture or conventions change.

---

## 1. What this system is

A **progress-tracking system for a church teens ministry ("DA")**. Its purpose is to track the
**growth and progress of the ministry — in attendance, people, and money — across two church
locations ("bases")**, so leaders (pastors) can see what is working, why, and improve.

The single most important goal of the product: **generate accurate monthly reports for each base
to send to the main church**, using a predefined template (new converts, offering, attendance, etc.).
Everything else exists to feed that reporting.

### Core value loop
Capture people + attendance + offerings → aggregate into trends → surface insight to leaders →
produce the monthly report. When in doubt about a feature, ask: *"does this help leaders see growth,
or help produce the monthly report?"*

---

## 2. Domain glossary (READ THIS — the code uses military metaphors)

The ministry uses a military theme. The **database models are generic**, but the **UI and business
language are military**. Do not confuse them.

| UI / business term | Meaning | Underlying model |
|---|---|---|
| **Base** | A church location. Exactly two: **Alpha** and **Bravo**. In reports these use **location labels** — Bravo = "Island", Alpha = "Mainland" (confirm). | `Base` |
| **Teen** | A young member of the ministry. | `Teen` |
| **Lieutenant** | A teen with rank `LIEUTENANT` (the general/regular teen). The UI often says "Lieutenant" when it means "Teen". | `Teen` where `rank = LIEUTENANT` |
| **Captain** | A teen with rank `CAPTAIN` (a teen leader). | `Teen` where `rank = CAPTAIN` |
| **General** | A leader/worker/adult (has a login). "Generals" in the UI = `User` records. | `User` |
| **Platoon** | A group a teen belongs to (primary group). One teen has at most one platoon. | `Group` where `type = PLATOON` |
| **Squad** | A smaller/secondary group; a teen can be in many squads. | `Group` where `type = SQUAD` |
| **Activity / Event** | Any gathering: service, Bible study, hangout, outreach. **"Events" and "Activities" are the same thing** — there is no separate Event concept. | `Activity` |
| **Offering** | Money collected at a service/activity. | `Offering` |

> ⚠️ **"Lieutenant" in route/file names means Teen.** e.g. `/api/lieutenants` returns `Teen` rows,
> `/dashboard/lieutenants` lists teens. `/api/generals` returns `User` rows.

---

## 3. Tech stack

- **Next.js 14** (App Router, server + client components)
- **Prisma 6** ORM → **PostgreSQL**
- **NextAuth 4** (Credentials provider, JWT session strategy)
- **Tailwind CSS 3**
- **Chart.js 4** + `react-chartjs-2` (charts)
- **Cloudflare R2** for image storage, accessed via the **AWS S3 SDK** (`@aws-sdk/client-s3`, presigned URLs)
- **react-hook-form**, **react-select**, **zod** (installed; validation largely NOT wired up yet), **papaparse** (CSV bulk upload), **date-fns**, **bcrypt**, **nanoid**

---

## 4. Directory map

```
app/
  api/                        # All backend route handlers (REST-ish)
    activities/               # Activities CRUD + [id]/participation (attendance)
    auth/[...nextauth]/       # NextAuth handler (authOptions is INLINE here — see §8)
    auth/register/            # Leader (User) registration
    bases/                    # Base list/create
    birthdays/                # Upcoming birthdays (uses lib/getUpcomingBirthdays)
    bulk-upload/teens/        # CSV bulk upload of teens
    dashboard/                # Dashboard aggregate counts (HAS BUGS — see §9)
    generals/                 # User CRUD (NO PUT/edit yet), [id]/change-password
    groups/                   # Group CRUD (GET/POST only; [id] is GET-only)
    lieutenants/              # Teen CRUD + image upload (upload-url/save-image/get-image-url)
    offerings/                # Offering list/create (no edit/delete)
    platoons/                 # Platoon helpers
    users/                    # User list
  auth/                       # Login / register pages
  dashboard/                  # All authenticated app pages
    activities/ birthdays/ generals/ lieutenants/ offerings/
    platoons/ squads/ reports/ (STUB) settings/ (STUB) events/ (STUB, redundant) profile/
components/                   # React components, grouped by domain
lib/                          # prisma singleton, r2 client, date/age/gender helpers
prisma/                       # schema.prisma, migrations, seeds (bases, admins, squads)
middleware.ts                 # Auth gate for /dashboard pages ONLY (NOT /api — see §8)
types/next-auth.d.ts          # Session type augmentation (adds id, username, role, baseId)
```

---

## 5. Data model (Prisma) — summary

See `prisma/schema.prisma` for the source of truth. Key points:

- **Base** 1─* User, Teen, Group, Activity, Offering.
- **User** (General): `role` ∈ {SUPERADMIN, GENERAL, COLONEL, VOLUNTEER}, belongs to one Base,
  leads Groups (`leadingGroups`), supports Groups (`GroupSupport`), teaches at Activities
  (`TeacherParticipation`). **Has no `gender` field** (gap — see §9).
- **Teen**: `rank` ∈ {LIEUTENANT, CAPTAIN}, `gender` (string "Male"/"Female"), belongs to one Base,
  one optional Platoon (`groupId` → Group), many Squads (`GroupMember`), attendance
  (`ActivityParticipation`), optional `imageKey` (R2 object key).
- **Group**: `type` ∈ {PLATOON, SQUAD}, one leader (`User`), supporters, members, teens, activities.
- **Activity**: `type` (free string), `date`, `isCrossBase`, optional Base, connected Groups,
  teen attendance + teacher attendance.
- **ActivityParticipation**: unique `(activityId, teenId)`, `attended` bool, notes.
- **TeacherParticipation**: unique `(activityId, userId)`, `attended`, role, notes.
- **Offering**: `amount` Decimal(12,2), `date`, `service`, `type` ("Cash" | "Online"/Transfer),
  `isCrossBase`, optional Base, notes.

### Not yet modeled (needed — see roadmap)
- **NewConvert / first-timer** (critical for the monthly report).
- **MonthlyReport** (narrative + manual finance inputs + snapshot archive) — see S3.
- **Base label** (report location name: Alpha = Mainland, Bravo = Island).
- **Household** (grouping teens by family/household).
- Soft-delete / archive fields (all deletes are currently hard deletes).

> **Deliberately NOT modeled:** expenses and account/bank balances are **not** tracked in-app — the
> app is not the source of truth for them. In the monthly report the admin types opening balance,
> official income, and expense line items **from the bank statement**; closing is computed. No
> Expense/AccountBalance models. Bank-statement ingestion is deferred to S10 (AI-assisted, optional).

### Offerings & income
- The app records offering **events**: today only **Sunday cash**; S2 adds **Transfer** offerings
  (generals transfer their offering to the account, often batched at month start). `Offering.type` =
  Cash | Transfer.
- The account also receives more than the app sees, and timing/charges mean app totals **won't match**
  the bank. So the **monthly report's official income comes from the bank statement (manual)**; the
  app offerings total (Cash vs Transfer) is only a **reconciliation reference** that pre-fills the field.

### Money & locale
- Currency is **Nigerian Naira (₦)**. Amounts are large (millions). Render via the shared
  `lib/formatMoney.ts` (added in S3). Never hardcode `$`.

### The monthly report (product's reason for existing)
- Per-base **PowerPoint (.pptx)** deck, 8 slides, sent to the main church monthly. Generated with
  `pptxgenjs`, must stay **editable**. It mixes **auto-computed** figures (membership, weekly Sunday
  attendance, offerings/income, expenses, opening/closing balance) with **leader-written narrative**
  (theme, executive summary, issues, alternative churches, victories, challenges, plans, update on
  teens). Expenses + opening balance are **manual inputs on the report form** (not tracked); income
  is auto and closing is computed. "Estimated membership" = count of active teens.
  Real template lives at `~/Downloads/DA BRAVO REPORT - JUNE 2026....pptx`. Full spec in S3.

---

## 6. Commands

```bash
npm run dev            # start dev server (localhost:3000)
npm run build          # prisma generate + migrate deploy + next build
npm run lint           # next lint
npm run seed           # prisma/seed.ts
npm run seed:bases     # create Alpha + Bravo bases (REQUIRED before dashboard works)
npm run seed:admins    # create admin users
npm run seed:squads    # seed squads

npx prisma migrate dev --name <desc>   # create + apply a migration in dev
npx prisma studio                      # inspect the DB
```

---

## 7. Environment variables

Required (see `.env.example`, but note it is **incomplete**):

```
DATABASE_URL=            # postgres connection string
NEXTAUTH_SECRET=         # NextAuth JWT secret
NEXT_PUBLIC_BASE_URL=    # e.g. http://localhost:3000 (dashboard page fetches its own API with this)
ADMIN_PASSWORD=          # used by admin seed

# Cloudflare R2 (image storage) — MISSING from .env.example, add them:
R2_ENDPOINT=
R2_ACCESS_KEY=
R2_SECRET_KEY=
R2_BUCKET=
```

---

## 8. Auth & security model

- Login is **NextAuth Credentials** (email + bcrypt password), **JWT sessions**.
- The session is augmented (`types/next-auth.d.ts`) with `id`, `username`, `role`, `baseId`.
- `authOptions` lives in **`lib/auth.ts`** (exported) and is imported by
  `app/api/auth/[...nextauth]/route.ts`. Any server code can call `getServerSession(authOptions)`.

### `lib/auth.ts` helpers (implemented in S0)
- `getSession()` → `getServerSession(authOptions)`.
- `requireSession()` → returns the session or throws `ApiError(401)`.
- `requireRole(roles: UserRole[])` → throws `ApiError(401)` if unauthenticated, `ApiError(403)` if
  the role isn't in `roles`.
- `assertBaseAccess(session, baseId)` → non-`SUPERADMIN` users may only mutate data whose `baseId`
  equals their own `session.user.baseId`. A `null`/missing `baseId` (cross-base data) is
  **SUPERADMIN-only** — a base-scoped leader cannot create/edit cross-base records.
- `ApiError` + `handleApiError(e)` → routes `try { ... } catch (e) { return handleApiError(e); }`
  and get a consistent `{ error, fieldErrors? }` JSON body with the right status.

### Enforcement applied to every route under `app/api/*`
- All `GET`s require a valid session (`requireSession()`).
- All mutations (`POST`/`PUT`/`PATCH`/`DELETE`) require a session, plus `assertBaseAccess` where the
  body/record carries a `baseId` (teens, groups, activities, offerings, bulk-upload, image save).
- `SUPERADMIN`-only: creating a base (`POST /api/bases`), deleting a general
  (`DELETE /api/generals/[id]`), deleting a teen (`DELETE /api/lieutenants/[id]`), and registering a
  new leader (`POST /api/auth/register`).
- `generals/[id]/change-password`: requires session AND (`session.user.id === params.id` OR
  `SUPERADMIN`).
- Request bodies are validated with `zod` schemas in `lib/validation/*.ts` (offerings, teens,
  activities, groups, register) via `parseOrThrow()`, returning `400` with `fieldErrors` on failure.

### Registration hardening (decision)
Self-registration is now **SUPERADMIN-only** — `POST /api/auth/register` calls
`requireRole(["SUPERADMIN"])` before touching the body, and `/auth/register` (the page) is gated by
a `RequireRole` client component plus added to `middleware.ts`'s matcher (so it 302s to login before
the form ever renders for an unauthenticated visitor). This was chosen over an env signup code
because the seed scripts already provision `SUPERADMIN` accounts (`npm run seed:admins`) — there is
always an existing admin to create subsequent leaders. The client still submits `role` in the body,
but it's only trusted now because the caller is already an authenticated `SUPERADMIN`; the value is
still validated against the `UserRole` enum via zod.

### Self-fetching server components (fixed)
`app/dashboard/page.tsx`, `.../birthdays/page.tsx`, `.../platoons/page.tsx`, `.../squads/page.tsx`
no longer `fetch()` their own `/api/*` routes over HTTP (which doesn't forward the auth cookie and
would 401 once GETs require a session). They call shared `lib/` functions directly instead:
`lib/dashboard.ts` (`getDashboardCards`), `lib/bases.ts` (`getBases`), `lib/users.ts` (`getUsers`),
`lib/groups.ts` (`getGroups`), `lib/getUpcomingBirthdays.ts`. The corresponding API routes call the
same `lib/` functions, so there's one source of truth for each query.

### Conventions to adopt (when you touch auth)
- Thin pattern at the top of a handler: `const session = await requireRole([...]);` (or
  `requireSession()`), wrapped in `try { ... } catch (e) { return handleApiError(e); }`.
- Scope data by `session.user.baseId` via `assertBaseAccess` where appropriate.
- New self-fetching server components should call a `lib/` function directly, not `fetch()` their
  own API route.

---

## 9. Known bugs & gotchas (verified — do not reintroduce)

- **Dashboard counts** (`app/api/dashboard/route.ts`):
  - "Total Generals" uses `prisma.user.count()` = ALL users, not `role = GENERAL`.
  - Alpha/Bravo **platoon** counts use `base: alphaBase` (whole object) instead of `baseId: alphaBase.id`.
  - Base names are hardcoded `"Alpha"`/`"Bravo"`; a rename 404s the entire dashboard.
- **Birthdays** (`lib/getUpcomingBirthdays.ts`): uses `EXTRACT(DOY)` + hardcoded `365`; drifts on leap
  years and mishandles year-end wrap. `daysToBirthday` extracts the day component of an interval
  (meaningless). Rewrite with proper next-birthday date math.
- **Cross-base records**: both forms already convert the `"cross-base"` sentinel client-side to
  `{ baseId: null, isCrossBase: true }`. **Activities POST persists `isCrossBase` correctly.**
  **Only Offerings POST is broken** — it doesn't destructure/persist `isCrossBase`, so cross-base
  offerings save with `isCrossBase = false`. Fixed in S1.
- **Prisma singleton**: `app/api/lieutenants/[id]/route.ts` **and** `app/api/auth/register/route.ts`
  each do `new PrismaClient()` — WRONG. Always `import { prisma } from "@/lib/prisma"`.
- **Server-component self-fetch (breaks under auth)**: `app/dashboard/page.tsx`,
  `.../birthdays/page.tsx`, `.../platoons/page.tsx`, `.../squads/page.tsx` are server components that
  `fetch` their own `/api/*` via `NEXT_PUBLIC_BASE_URL` without forwarding cookies. Prefer calling the
  data logic directly. Must be fixed alongside API auth (S0) or these pages 401.
- **`User` has no `gender`** but UI (generals detail page) expects it. (Added in S1.)
- **Offering `type` values** are the free strings `"Cash"` and `"Online"` ("Online" = online/transfer).
  Don't rename stored values without a backfill.
- **Groups can't be edited/deleted** (`/api/groups/[id]` is GET-only).
- **Generals can't be edited** (`/api/generals/[id]` has GET/DELETE, no PUT).
- **Offerings can't be edited/deleted**.
- **All deletes are hard deletes** with no cascade handling → FK errors or orphaned rows.
- **`DashboardChart.tsx` is built but never imported** — no charts render anywhere yet.
- **`/dashboard/events` and `/dashboard/settings` are empty stubs.** Events is redundant (events =
  activities) and should be removed/merged. **Reports & Settings sidebar links are commented out**
  in `components/navigation/Sidebar.tsx` — enable when those pages are built.

---

## 10. Conventions & style

- **Match the surrounding code.** This is a young codebase with some inconsistency; prefer the
  cleaner existing pattern (e.g. shared `lib/prisma`, `NextResponse.json`).
- API routes return `NextResponse.json(...)`; errors as `{ error | message }` with a status code.
- Money is `Decimal(12,2)` in Prisma; serialize carefully (Decimal → string/number) for the client.
- Dates from forms arrive as strings; wrap in `new Date(...)` before writing.
- Client components start with `"use client"`. Data pages often fetch their own API via `fetch`.
- Images: never store URLs — store the R2 **object key** (`imageKey`) and mint presigned URLs on demand.
- Keep the military metaphor consistent in **UI copy**; keep model/field names generic.

### ⚠️ Migration safety (non-negotiable — there is live production data)
Every schema change must be **additive and non-destructive**. Existing rows must survive untouched.
- **Only add** tables/columns. Do **not** drop or rename columns/tables that hold data (a rename is a
  drop+add in Postgres and loses data). To rename, add-new → backfill → cut over in a later release.
- New columns on existing tables must be **nullable** or have a **default** — never `NOT NULL` without
  a default (it fails on existing rows).
- Backfill in the same migration where a value is expected (e.g. `Teen.status → 'ACTIVE'`,
  `Teen.dateJoined → createdAt`).
- New models/relations are inherently safe (additive).
- **Review the generated SQL** in `prisma/migrations/**/migration.sql` before applying — confirm no
  `DROP`/destructive `ALTER`. Test the migration against a **copy of production data** first.
- Prod deploy path is `prisma migrate deploy` (see `build` script). **Never** run `migrate reset` or
  `db push --force-reset` against prod.

### Definition of done for a change
1. Type-checks and lints clean.
2. Mutating API routes are auth-guarded and validated (once §8 helpers exist).
3. New data-model changes have a Prisma migration that is **additive/non-destructive** (see above).
4. Verified by exercising the actual flow, not just reading code.
5. This file updated if architecture/conventions changed.

---

## 11. Roadmap context (so agents understand where things are going)

Work is organized into **sprint prompt files** (see `/.docs/sprints/` — hidden docs folder). High-level order:
1. Security hardening (auth on API + roles) + core bug patches (dashboard, birthdays, cross-base, singleton).
2. **Monthly report engine** (add NewConvert model, report template, export) — the core goal.
3. Offerings & attendance analytics with charts.
4. Edit Generals, Group edit/delete, Households.
5. Detail-page analytics (lieutenant/general/platoon/squad).
6. UI/UX reskin & design system (clean/white, Origin+Quicken inspired) → then full mobile responsiveness.
7. AI assistance features (last — only once the system is stable).

Always re-read this file's glossary (§2) and known-bugs list (§9) before starting a sprint.
