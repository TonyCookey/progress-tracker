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
    new-converts/             # NewConvert CRUD (S3)
    reports/monthly/          # Draft save/load, [id], [id]/download, generate (S3)
  auth/                       # Login / register pages
  dashboard/                  # All authenticated app pages
    activities/ birthdays/ generals/ lieutenants/ offerings/
    platoons/ squads/ new-converts/ reports/ (Monthly Report builder, S3)
    settings/ (STUB) events/ (STUB, redundant) profile/
components/                   # React components, grouped by domain
lib/                          # prisma singleton, r2 client, date/age/gender helpers,
                               # formatMoney, reports/monthly.ts (aggregation), reports/generatePptx.ts
prisma/                       # schema.prisma, migrations, seeds (bases, admins, squads)
middleware.ts                 # Auth gate for /dashboard pages ONLY (NOT /api — see §8)
types/next-auth.d.ts          # Session type augmentation (adds id, username, role, baseId)
```

---

## 5. Data model (Prisma) — summary

See `prisma/schema.prisma` for the source of truth. Key points:

- **Base** 1─* User, Teen, Group, Activity, Offering, NewConvert, MonthlyReport. `label` (nullable
  string, added S3) is the report location name: Alpha = "Mainland", Bravo = "Island" (backfilled
  in the S3 migration; also set by `prisma/seeds/bases.seed.ts` for fresh seeds).
- **User** (General): `role` ∈ {SUPERADMIN, GENERAL, COLONEL, VOLUNTEER}, belongs to one Base,
  leads Groups (`leadingGroups`), supports Groups (`GroupSupport`), teaches at Activities
  (`TeacherParticipation`), soft-delete via `deletedAt`.
- **Teen**: `rank` ∈ {LIEUTENANT, CAPTAIN}, `gender` (string "Male"/"Female"), belongs to one Base,
  one optional Platoon (`groupId` → Group), many Squads (`GroupMember`), attendance
  (`ActivityParticipation`), optional `imageKey` (R2 object key), soft-delete via `deletedAt`.
  Pastoral/growth fields (added S2, all nullable): `phone`, `address`, `school`, `guardianName`,
  `guardianPhone`, `dateJoined` (defaults to `createdAt` for pre-S2 rows, defaults to "now" on
  create when omitted), `status` ∈ {ACTIVE, INACTIVE, LEFT} (default `ACTIVE`).
- **Group**: `type` ∈ {PLATOON, SQUAD}, one leader (`User`), supporters (`GroupSupport`), members
  (`GroupMember`, squads only — platoon membership is via `Teen.groupId`), teens, activities,
  soft-delete via `deletedAt`. Deleting a group with active (non-deleted) teens is blocked (409).
- **Activity**: `type` (free string), `date`, `isCrossBase`, optional Base, connected Groups,
  teen attendance + teacher attendance, soft-delete via `deletedAt` (no edit/delete UI yet).
- **ActivityParticipation**: unique `(activityId, teenId)`, `attended` bool, notes.
- **TeacherParticipation**: unique `(activityId, userId)`, `attended`, role, notes.
- **Offering**: `amount` Decimal(12,2), `date`, `service`, `type` (`"Cash"` | `"Online"`),
  `isCrossBase`, optional Base, notes, soft-delete via `deletedAt`. **Canonical `type` values are
  the literal strings `"Cash"` and `"Online"`** — `"Online"` is the transfer/online type (UI label
  is "Transfer", but the stored value stays `"Online"` to avoid orphaning existing data).
- **NewConvert** (added S3): `name`, `gender?`, `phone?`, `dateOfBirth?`, optional Base
  (`isCrossBase` flag, same convention as Activity/Offering), `date` (when they came/converted),
  `activityId?`, `invitedBy?`, `followedUp`/`becameTeen` bools, `teenId?` (once converted to a
  Teen), `notes?`, soft-delete via `deletedAt`.
- **MonthlyReport** (added S3): unique per `(baseId, month, year)`. `status` ∈ {DRAFT, FINAL},
  `dataJson` = snapshot of the **auto** figures taken at generation time, `fileKey` = R2 object key
  of the generated .pptx. Manual finance inputs from the bank statement: `openingBalance`,
  `income`, `expenseItems` (JSON array of `{ description, amount }`). Narrative fields: `theme`,
  `executiveSummary`, `issues`, `alternativeChurches`, `sundayTeaching`, `description`,
  `victories`/`challenges`/`plans` (JSON string arrays, one bullet per entry), `updateOnTeens`.

### Soft delete (added S2)
Every model above with a `deletedAt DateTime?` field is soft-deleted: `DELETE` routes set
`deletedAt = new Date()` instead of removing the row. `lib/softDelete.ts` exports
`notDeleted(includeArchived: boolean)`, spread into `where` clauses to exclude archived rows by
default; pass `?includeArchived=true` on list/detail GETs to include them. Historical/report data
therefore survives a "delete".

### Not yet modeled (needed — see roadmap)
- **Household** (grouping teens by family/household) — see S6.

> NewConvert, MonthlyReport, and Base.label were modeled in S3 (see above).

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

### The monthly report (product's reason for existing) — implemented S3
- Per-base **PowerPoint (.pptx)** deck, 8 slides, sent to the main church monthly. Generated with
  `pptxgenjs` via `lib/reports/generatePptx.ts` (`buildMonthlyReportPptx`), must stay **editable**
  (native text boxes/tables, not flattened images). It mixes **auto-computed** figures (membership,
  weekly Sunday attendance, offerings/income, expenses, opening/closing balance) with
  **leader-written narrative** (theme, executive summary, issues, alternative churches, victories,
  challenges, plans, update on teens). Expenses + opening balance are **manual inputs on the report
  form** (not tracked); income is auto-suggested but editable, and closing is computed.
  "Estimated membership" = count of active teens.
  - `lib/reports/monthly.ts` (`getMonthlyReport`) computes the **auto** (app-owned) figures only.
  - `POST /api/reports/monthly` saves/loads a DRAFT (upsert on `baseId`+`month`+`year`).
  - `POST /api/reports/monthly/generate` re-saves the draft, builds the .pptx, uploads it to R2
    (`reports/monthly/<baseId>/<year>-<month>.pptx`), snapshots the auto figures into `dataJson`,
    flips `status` to FINAL, and streams the file back for immediate download.
  - `GET /api/reports/monthly/[id]/download` mints a presigned R2 GET URL for re-download.
  - Brand colors/fonts/logo were extracted directly from the provided template
    (`~/Downloads/DA BRAVO REPORT - JUNE 2026....pptx`); the logo lives at
    `public/assets/da-logo.png`. Layout is 16:9 widescreen (13.333in × 7.5in) to match the template.
  - **R2 credentials must be set** (`R2_ENDPOINT`/`R2_ACCESS_KEY`/`R2_SECRET_KEY`/`R2_BUCKET` in
    `.env`) for `/generate` to succeed — without them the R2 upload step throws (verified: the pptx
    build logic itself is independent of R2 and was tested directly).
  - `app/dashboard/reports/page.tsx` (sidebar: "Monthly Report") hosts the builder UI
    (`components/reports/MonthlyReportBuilder.tsx`); reused the pre-existing `/dashboard/reports`
    stub route rather than adding a new one. A future S4 analytics dashboard should use a different
    route if it needs its own page.

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

- **Prisma singleton**: `app/api/lieutenants/[id]/route.ts` **and** `app/api/auth/register/route.ts`
  each do `new PrismaClient()` — WRONG. Always `import { prisma } from "@/lib/prisma"`.
- **Server-component self-fetch (breaks under auth)**: `app/dashboard/page.tsx`,
  `.../birthdays/page.tsx`, `.../platoons/page.tsx`, `.../squads/page.tsx` are server components that
  `fetch` their own `/api/*` via `NEXT_PUBLIC_BASE_URL` without forwarding cookies. Prefer calling the
  data logic directly. Must be fixed alongside API auth (S0) or these pages 401.
- **Offering `type` values** are the free strings `"Cash"` and `"Online"` ("Online" = online/transfer,
  labeled "Transfer" in the UI). Don't rename stored values without a backfill.
- **`DashboardChart.tsx` is built but never imported** — no charts render anywhere yet.
- **Async `<select>` options + react-hook-form `setValue`/`defaultValues` (fixed S2, watch for
  recurrence)**: when a select's `<option>` list is populated from an API call *after* mount, calling
  `setValue`/setting `defaultValue` before that fetch resolves silently fails — the browser can't
  select a value that has no matching `<option>` in the DOM yet, and React doesn't retroactively fix
  it. Every edit form with an async-loaded select (`EditGeneralForm`, `EditGroupForm`,
  `EditLieutenantsForm`, `RecordOfferingForm`) now re-applies `setValue` in a `useEffect` keyed off
  the options array (`useEffect(() => { if (options.length) setValue(...) }, [options])`). Follow
  this pattern for any new async-select edit form.
- **Field-name mismatch silently wiped Teen platoon assignment (fixed S2)**: `EditLieutenantsForm`
  registered the platoon field as `groupId`, but `updateTeenSchema`/the PUT route expect
  `platoonId` — every prior edit sent `platoonId: undefined`, which the route coerced to
  `groupId: null`, clearing the teen's platoon. Now fixed by renaming the form field to `platoonId`.
  If you add more editable relations, double-check the client field name matches the zod schema key,
  not just the Prisma column name.
- **`/dashboard/events` and `/dashboard/settings` are empty stubs.** Events is redundant (events =
  activities) and should be removed/merged. **Settings sidebar link is commented out** in
  `components/navigation/Sidebar.tsx` — enable when that page is built. The Reports link is now
  live (S3, relabeled "Monthly Report").

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
1. Security hardening (auth on API + roles) + core bug patches (dashboard, birthdays, cross-base, singleton). ✅ done.
2. **Monthly report engine** (NewConvert model, report template, .pptx export) — the core goal. ✅ done (S3).
3. Offerings & attendance analytics with charts (reuses `lib/reports/monthly.ts`).
4. Edit Generals, Group edit/delete, Households.
5. Detail-page analytics (lieutenant/general/platoon/squad).
6. UI/UX reskin & design system (clean/white, Origin+Quicken inspired) → then full mobile responsiveness.
7. AI assistance features (last — only once the system is stable).

Always re-read this file's glossary (§2) and known-bugs list (§9) before starting a sprint.
