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
- **Resend** (`resend` package, added S7) — transactional email (password reset today; reusable for
  future notifications). Needs `RESEND_API_KEY`/`EMAIL_FROM` — see §7.

---

## 4. Directory map

```
app/
  api/                        # All backend route handlers (REST-ish)
    activities/               # Activities CRUD + [id]/participation (attendance)
    auth/[...nextauth]/       # NextAuth handler (authOptions is INLINE here — see §8)
    auth/register/            # Leader (User) registration
    auth/forgot-password/     # Self-service reset request (S7, public)
    auth/reset-password/      # Token consumption → new password (S7, public)
    bases/                    # Base list/create, [id] rename/edit (PUT, S7)
    birthdays/                # Upcoming birthdays (uses lib/getUpcomingBirthdays)
    bulk-upload/teens/        # CSV bulk upload of teens
    dashboard/                # Dashboard aggregate counts (HAS BUGS — see §9)
    generals/                 # User CRUD: GET/PUT/PATCH (activate/deactivate)/DELETE, [id]/change-password,
                               # [id]/send-reset (admin-triggered password reset email, S7)
    groups/                   # Group CRUD (GET/POST only; [id] is GET-only)
    lieutenants/              # Teen CRUD + image upload (upload-url/save-image/get-image-url)
    offerings/                # Offering list/create (no edit/delete)
    platoons/                 # Platoon helpers
    users/                    # User list
    new-converts/             # NewConvert CRUD (S3)
    refdata/                  # Managed dropdown values (activity/offering types), [id] (S7)
    reports/monthly/          # Draft save/load, [id], [id]/download, generate (S3)
    settings/report-template/ # Monthly report section toggles, GET/PUT (S7)
  auth/                       # Login / register pages, forgot-password / reset-password/[token] (S7)
  dashboard/                  # All authenticated app pages
    activities/ birthdays/ generals/ lieutenants/ offerings/
    platoons/ squads/ new-converts/ reports/ (Monthly Report builder, S3)
    settings/ (Settings area, S7 — SUPERADMIN-only, see §8) events/ (STUB, redundant) profile/
components/                   # React components, grouped by domain
  settings/                  # SettingsTabs, BasesPanel, UsersSettingsTable, RefDataPanel,
                              # ReportTemplatePanel (S7)
lib/                          # prisma singleton, r2 client, date/age/gender helpers,
                               # formatMoney, reports/monthly.ts (aggregation), reports/generatePptx.ts
                               # email.ts (Resend wrapper), passwordReset.ts (token issue/consume),
                               # refdata.ts (getRefData/slugifyKey/nextSortOrder) — all added S7
prisma/                       # schema.prisma, migrations, seeds (bases, admins, squads, refdata)
middleware.ts                 # Auth gate for /dashboard pages ONLY (NOT /api — see §8)
types/next-auth.d.ts          # Session type augmentation (adds id, username, role, baseId)
```

---

## 5. Data model (Prisma) — summary

See `prisma/schema.prisma` for the source of truth. Key points:

- **Base** 1─* User, Teen, Group, Activity, Offering, NewConvert, MonthlyReport. `label` (nullable
  string, added S3) is the report location name: Alpha = "Mainland", Bravo = "Island" (backfilled
  in the S3 migration; also set by `prisma/seeds/bases.seed.ts` for fresh seeds). `name` is
  **`@unique`** (added S7) — creating/renaming a base to a name that already exists returns a
  friendly 400, not a 500 (see `app/api/bases/route.ts` / `[id]/route.ts`).
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
- **Activity**: `type` (free string — options now sourced from `RefData` category `activity_type`,
  S7, see below), `date`, `isCrossBase`, optional Base, connected Groups, teen attendance + teacher
  attendance, soft-delete via `deletedAt` (no edit/delete UI yet).
- **ActivityParticipation**: unique `(activityId, teenId)`, `attended` bool, notes.
- **TeacherParticipation**: unique `(activityId, userId)`, `attended`, role, notes.
- **Offering**: `amount` Decimal(12,2), `date`, `service`, `type` (`"Cash"` | `"Online"`, options
  now sourced from `RefData` category `offering_type`, S7), `isCrossBase`, optional Base, notes,
  soft-delete via `deletedAt`. **Canonical `type` values are the literal strings `"Cash"` and
  `"Online"`** — `"Online"` is the transfer/online type (UI label is "Transfer", but the stored
  value stays `"Online"` to avoid orphaning existing data).
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

- **Household** (added S6): `name`, `address?`, `primaryContactName?`, `primaryContactPhone?`,
  optional Base (nullable `baseId`, same convention as Activity/Offering/NewConvert — a household
  is typically tied to one base but isn't required to be), member `teens` (`Teen.householdId`, a
  teen belongs to at most one household), soft-delete via `deletedAt`. **Deliberately kept
  independent from `Teen.address`/`guardianName`/`guardianPhone` (added S2)** — a teen may have no
  household, and even within a household a guardian can legitimately differ per teen (divorced
  parents, foster care, a sibling living with a relative). No sync/fallback/override display
  between the two; both are separately editable and both remain visible on the teen detail page and
  household detail page. Deleting a household with active (non-deleted) member teens is blocked
  (409), same pattern as Group.

- **RefData** (added S7): generic managed-dropdown table backing `Activity.type` and
  `Offering.type`, `@@unique([category, key])`. `category` ∈ `"activity_type" | "offering_type"`;
  `key` is the **immutable, stable value actually stored** in `Activity.type`/`Offering.type` —
  `lib/reports/monthly.ts` hardcodes matches on the literal strings `"Sunday Service"`, `"Cash"`,
  `"Online"`, so the seeded rows' `key` is set to those exact strings and **must never change**.
  `label` is the admin-editable display text (e.g. key `"Online"` / label `"Transfer"`), `sortOrder`
  controls dropdown order, `active` toggles visibility (soft "delete" — no `deletedAt`, since
  `active:false` already means "hidden but the key slot is reserved for reactivation"). Managed from
  **Settings → Reference Data** (`components/settings/RefDataPanel.tsx`); `app/api/refdata/route.ts`
  POST reactivates a matching inactive row instead of colliding on the unique constraint, and
  computes `sortOrder` as append-at-end (via `lib/refdata.ts`'s `nextSortOrder`) when the caller
  doesn't supply one. The UI never exposes `key` as editable.
- **PasswordResetToken** (added S7): `userId` → User, `tokenHash` (SHA-256 of the raw token — the
  raw token is never persisted), `expiresAt` (1 hour TTL), `usedAt`. Issued by
  `lib/passwordReset.ts`'s `issuePasswordResetToken` (self-service via `POST
  /api/auth/forgot-password`, or admin-triggered via `POST /api/generals/[id]/send-reset`), which
  also invalidates any other outstanding tokens for that user first — only the newest issued token
  is ever valid. Consumed by `POST /api/auth/reset-password`.
- **ReportTemplateConfig** (added S7): singleton row (`key: "default"`), `sectionsJson` (which
  monthly-report sections are enabled). Managed from **Settings → Report Template**
  (`components/settings/ReportTemplatePanel.tsx`, `app/api/settings/report-template/route.ts`).
  **Not yet consumed by report generation** — `lib/reports/monthly.ts`/`generatePptx.ts` always
  render every section regardless of this config; wiring it in is unfinished follow-up work.

> NewConvert, MonthlyReport, Base.label were modeled in S3 (see above); Household in S6; RefData,
> PasswordResetToken, ReportTemplateConfig, and Base.name uniqueness in S7.

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
npm run build          # prisma generate + migrate deploy + seed:refdata + next build
npm run lint           # next lint
npm run seed           # prisma/seed.ts
npm run seed:bases     # create Alpha + Bravo bases (REQUIRED before dashboard works)
npm run seed:admins    # create admin users
npm run seed:squads    # seed squads
npm run seed:refdata   # upsert Activity/Offering type RefData rows + default ReportTemplateConfig
                        # (S7 — idempotent, runs on every `npm run build` so a fresh deploy never
                        # ships with empty Activity/Offering type dropdowns)

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

# Resend (transactional email — password reset, S7)
RESEND_API_KEY=
EMAIL_FROM=              # e.g. "DA Progress Tracker <no-reply@yourdomain.com>"
```

---

## 8. Auth & security model

- Login is **NextAuth Credentials** (email + bcrypt password), **JWT sessions**.
- The session is augmented (`types/next-auth.d.ts`) with `id`, `username`, `role`, `baseId`.
- `authOptions` lives in **`lib/auth.ts`** (exported) and is imported by
  `app/api/auth/[...nextauth]/route.ts`. Any server code can call `getServerSession(authOptions)`.

### `lib/auth.ts` helpers (implemented in S0)
- `getSession()` → `getServerSession(authOptions)`.
- `requireSession()` → returns the session or throws `ApiError(401)`. **(S7)** Also re-checks the
  user's `deletedAt` against the DB on every call — a user deactivated mid-session is rejected on
  their very next request, rather than only being blocked at their next login. `authorize()` in the
  Credentials provider separately blocks a deactivated user from signing in at all.
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

### Settings area & SUPERADMIN self-lockout guards (added S7)
`/dashboard/settings` (Bases, Users, Reference Data, Report Template tabs) is gated
**client-side** by `RequireRole roles={["SUPERADMIN"]}` and the sidebar link is SUPERADMIN-only, but
**every underlying API route re-enforces `requireRole(["SUPERADMIN"])` independently** — the
client-side gate is UX only, never the security boundary. There is no shared registry tying the
sidebar/page/route checks together; when adding a new settings sub-page or route, add all three
gates by hand and don't assume one implies another.

Three mutation paths on `app/api/generals/[id]/route.ts` can affect the acting SUPERADMIN's own
account, and **all three** must reject a self-inflicted lockout (a change made once, then found
incomplete, then completed — see history if this needs touching again):
- `PATCH` (activate/deactivate) and `DELETE` (soft-delete) reject `session.user.id === params.id`
  when deactivating.
- `PUT` (profile edit, reused by `EditGeneralForm`) rejects a SUPERADMIN changing their own `role`
  away from `"SUPERADMIN"`.

If a fourth mutation path is ever added here (or a "last active SUPERADMIN" count-based invariant
replaces these per-self checks), update all of the above together.

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
- **`/dashboard/events` removed (S10)** — it was an empty stub, redundant with Activities (events =
  activities); the page and any nav link are gone. The Reports link is live (S3, relabeled "Monthly
  Report"). **Settings is now fully built (S7)** — do not re-stub it or re-comment its sidebar link.
- **Report offerings total only summed `Cash`+`Online` (fixed S10)** — `lib/reports/monthly.ts`
  computed `offeringsTotal.total` as `cash + online`, silently dropping offerings recorded under any
  admin-added custom `type` (Settings → RefData `offering_type`). `total` now sums **all** offerings
  for the base+month regardless of `type`; `cash`/`online` stay as the type-specific breakdown. Note:
  `lib/analytics.ts`'s `splitCashOnline` (used by the offerings trend/by-service analytics) still has
  the same `cash+online` pattern for its `total` and was **not** touched by S10 — same bug likely
  applies there, watch for it.
- **Attendance-taking list included soft-deleted/LEFT teens (fixed S10)** —
  `app/api/activities/[id]/participation/route.ts` GET's `teenWhere` never filtered `deletedAt`/
  `status`; a soft-deleted or LEFT teen could still be marked present. All three branches
  (cross-base/group/base) now merge in `{ deletedAt: null, status: { not: "LEFT" } }`. This only
  affects the **live** list — historical participation/analytics counts for already-deleted teens are
  intentionally left untouched (see next bullet).
- **New-vs-returning attendance ignored `baseId` for prior attendance (fixed S10)** —
  `lib/analytics.ts`'s `getAttendanceTrend` scoped `activities` by `baseId` but `priorAttended` looked
  across all bases, so a teen who attended at another base was wrongly counted "returning". Now
  `priorAttended` is scoped by the same `baseId`. Historical Sunday-attendance counts and analytics
  still intentionally include soft-deleted teens' past records — do not add `deletedAt` filters there.
- **SUPERADMIN excluded from birthdays (fixed S10)** — `lib/getUpcomingBirthdays.ts`'s generals role
  filter didn't list `SUPERADMIN`. Fixed via a shared `GENERAL_ROLES` constant
  (`'SUPERADMIN','GENERAL','COLONEL','VOLUNTEER'`) used by both the birthdays and anniversaries
  queries.
- **Anniversaries feature (S10)** — sibling to Birthdays for Generals. `User.anniversaryDate`
  (nullable `DateTime`), editable via register/`EditGeneralForm`. `getUpcomingBirthdays()` now also
  returns `anniversaries`, computed by calling the same `nextOccurrenceExpr()` helper with
  `u."anniversaryDate"` (same 0–30 day window / Feb 29 handling as birthdays). Surfaced as a third tab
  in `BirthdaysTabs` (`GeneralAnniversariesTable`), generals only.
- **RefData `key` must never be edited after creation (S7)** — `lib/reports/monthly.ts` hardcodes
  string matches on `"Sunday Service"`, `"Cash"`, `"Online"`; those are the literal seeded `key`
  values. `updateRefDataSchema` deliberately excludes `key`/`category` so the Settings UI can't touch
  them. If you ever add a "rename key" feature or let the report engine read RefData dynamically
  instead of hardcoded strings, update both sides together — don't change one without the other.
- **Deactivating a RefData row (Settings → Reference Data) doesn't hide it from historical
  records** — it only stops it appearing as a *new* selectable option; existing Activities/Offerings
  keep whatever `type` they already had. The edit form for an Offering fetches with
  `includeInactive=true` so a since-deactivated type still shows (labeled "(inactive)") rather than
  silently reassigning the record to a different type on save.

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
6. Settings admin area (bases, users/roles, managed activity/offering types, password reset,
   report-template config) ✅ done (S7) — see §5, §8, §9.
7. UI/UX reskin & design system (clean/white, Origin+Quicken inspired) → then full mobile responsiveness.
8. AI assistance features (last — only once the system is stable).

Always re-read this file's glossary (§2) and known-bugs list (§9) before starting a sprint.
