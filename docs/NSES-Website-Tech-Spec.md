# Technical Specification: NSES Society Website (V1)

Written to be handed directly to an AI coding agent for implementation. Pairs with `NSES-Website-PRD.md`.

---

## 1. Architecture Overview

Single **Next.js** application (App Router) deployed on **Vercel**, using **MongoDB Atlas** for data and **Cloudinary** for photo storage. No separate backend service — API routes live inside the Next.js app itself.

```
┌─────────────────────────────┐
│         Vercel (host)        │
│  ┌─────────────────────────┐ │
│  │   Next.js App Router     │ │
│  │  - Public pages          │ │
│  │  - Admin pages (guarded) │ │
│  │  - API routes            │ │
│  └───────────┬───────────────┘ │
└──────────────┼───────────────┘
               │
     ┌─────────┴──────────┐
     │                     │
┌────▼─────┐       ┌───────▼───────┐
│ MongoDB   │       │  Cloudinary   │
│ Atlas     │       │  (photos)     │
│ (free)    │       │  (free)       │
└───────────┘       └───────────────┘
```

**Why this stack:** one deployment target (no cold-start backend to babysit), free tiers cover 150 profiles comfortably, and it matches your existing MERN/JS background.

---

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 14+ (App Router)** | React + API routes in one project |
| Language | **TypeScript** | Catches import/schema mistakes early — worth it even for a small team |
| Styling | **Tailwind CSS** | Fast to build with, easy for an AI agent to generate consistently |
| Database | **MongoDB Atlas (free M0 cluster)** | Document model fits profile data well |
| ODM | **Mongoose** | Schema validation for student ID uniqueness etc. |
| Auth | **NextAuth.js (Credentials provider)** or a simple custom JWT + `httpOnly` cookie | Single admin account, no need for OAuth/social login |
| File storage | **Cloudinary** (free tier) | Photo upload + on-the-fly resizing via URL transforms |
| Excel parsing | **`xlsx` (SheetJS)** | Reads `.xlsx`/`.csv` uploads in the API route |
| QR generation | **`qrcode`** (npm) | Generates SVG/PNG server-side per profile |
| ZIP export | **`jszip`** | Bundles all QR codes for one download |
| Validation | **Zod** | Validates Excel rows and form input before saving |
| Deployment | **Vercel (free/Hobby)** | Auto-deploys from GitHub |
| Version control | **GitHub** | Required for Vercel's git-based deploys |

---

## 3. Dependencies (package.json)

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "mongoose": "^8.5.0",
    "next-auth": "^4.24.0",
    "bcryptjs": "^2.4.3",
    "cloudinary": "^2.4.0",
    "xlsx": "^0.18.5",
    "qrcode": "^1.5.3",
    "jszip": "^3.10.1",
    "zod": "^3.23.0",
    "clsx": "^2.1.1"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/node": "^20.14.0",
    "@types/react": "^18.3.0",
    "@types/bcryptjs": "^2.4.6",
    "@types/qrcode": "^1.5.5",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.0"
  }
}
```

*(An AI agent should still run `npm install` and let package managers resolve exact minor/patch versions — pin majors as above.)*

---

## 4. Environment Variables

```
MONGODB_URI=
NEXTAUTH_SECRET=
NEXTAUTH_URL=              # e.g. https://nses.vercel.app
ADMIN_USERNAME=
ADMIN_PASSWORD_HASH=       # bcrypt hash, never store plaintext
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NEXT_PUBLIC_SITE_URL=      # used to build QR URLs, must match final vercel.app project name
```

---

## 5. Data Model

**`Person` collection (Mongoose schema)**

```ts
{
  studentId: string,       // unique, normalized (trim + uppercase), e.g. "2022-SE-045"
  name: string,
  role: "President" | "Vice President" | "Head" | "Member",
  team: string,             // e.g. "Security Team", "Web Team" — empty for general members if none
  bio: string,
  photoUrl: string,         // Cloudinary URL, optional
  socials: {
    linkedin: string,       // optional
    github: string,         // optional
    other: string           // optional
  },
  active: boolean,          // default true; false = former member, page still resolves
  createdAt: Date,
  updatedAt: Date
}
```

Index: unique index on `studentId`.

**`AdminSession`** — handled by NextAuth/JWT, no separate collection needed for a single admin.

---

## 6. API Routes

All admin routes require an authenticated session (checked server-side).

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/[...nextauth]` | GET/POST | Admin login/logout (NextAuth handler) |
| `/api/people` | GET | Public: list active people (for directory) |
| `/api/people/[studentId]` | GET | Public: fetch one profile by student ID |
| `/api/admin/people` | GET | Admin: list all people (active + inactive) |
| `/api/admin/people` | POST | Admin: create a single person manually |
| `/api/admin/people/[studentId]` | PUT | Admin: update a person's fields |
| `/api/admin/people/[studentId]` | DELETE | Admin: **not exposed in UI** — use `active:false` instead; keep route disabled or removed entirely to prevent accidental ID loss |
| `/api/admin/import/preview` | POST | Admin: upload Excel, parse + validate, return preview rows (no DB write yet) |
| `/api/admin/import/commit` | POST | Admin: commit previewed rows — upsert by `studentId` |
| `/api/admin/photos/upload` | POST | Admin: upload photo(s), matched by filename = studentId, pushed to Cloudinary, `photoUrl` saved |
| `/api/admin/qr/[studentId]` | GET | Admin: generate/download one QR (SVG or PNG) |
| `/api/admin/qr/export` | GET | Admin: generate ZIP of all active people's QR codes |

---

## 7. Application Flow

### 7.1 Public visitor scanning a card
1. Scans QR → opens `https://<project>.vercel.app/p/<STUDENT-ID>`.
2. Next.js route `app/p/[studentId]/page.tsx` calls `/api/people/[studentId]`.
3. If found and `active: true` → render profile (name, role, team, photo, bio, socials).
4. If found and `active: false` → render "Former Member" variant of the same page.
5. If not found → render friendly 404-style "Profile not found" page (not a server error).

### 7.2 Admin: semester Excel import
1. Admin logs in → `/admin/import`.
2. Uploads `.xlsx` → POST `/api/admin/import/preview`.
3. Server parses with `xlsx`, validates each row with Zod (required fields, valid role enum, normalized `studentId`), flags duplicates/errors.
4. UI shows a table: ✅ valid rows, ⚠️ rows needing attention (duplicate IDs, missing name, etc.).
5. Admin fixes/removes bad rows in the UI or re-uploads, then clicks "Confirm Import".
6. POST `/api/admin/import/commit` — upserts each row by `studentId` (update if exists, insert if new). **Existing people not in the new sheet are left untouched**, not deleted — admin marks leavers inactive manually or via a separate "mark inactive" bulk action.

### 7.3 Admin: photo upload
1. Admin goes to `/admin/photos`.
2. Bulk-selects image files named `<STUDENT-ID>.jpg/png`.
3. POST `/api/admin/photos/upload` → for each file, strip extension to get `studentId`, upload to Cloudinary, then update that `Person.photoUrl`.
4. Files that don't match any existing `studentId` are reported back as skipped, not silently dropped.

### 7.4 Admin: QR generation for printing
1. After import + photos are done, admin visits `/admin/qr`.
2. Can download a single person's QR (`/api/admin/qr/[studentId]`) or all at once (`/api/admin/qr/export`, a ZIP of SVGs named `<studentId>.svg`).
3. **QR content is always** `${NEXT_PUBLIC_SITE_URL}/p/${studentId}` — generated fresh from the current env var each time, so it is never stored as a static asset that could go stale; regenerating a QR for the same student ID always produces the identical code as long as `NEXT_PUBLIC_SITE_URL` and the ID don't change.
4. Print shop receives the ZIP/sheet directly.

### 7.5 Admin: editing a profile after cards are printed
1. Admin edits any field (name spelling, bio, role, team, socials) via `/admin/people/[studentId]`.
2. PUT `/api/admin/people/[studentId]` updates the document — **`studentId` itself is immutable** (not editable in the UI) since it's the permanent key behind the printed QR.
3. Profile page reflects changes immediately; the already-printed card's QR still resolves correctly since the URL never changed.

---

## 8. Folder Structure

```
nses-website/
├── app/
│   ├── page.tsx                      # Home
│   ├── members/page.tsx              # Directory
│   ├── p/[studentId]/page.tsx        # Public profile
│   ├── admin/
│   │   ├── login/page.tsx
│   │   ├── page.tsx                  # Admin dashboard
│   │   ├── import/page.tsx
│   │   ├── photos/page.tsx
│   │   ├── people/[studentId]/page.tsx
│   │   └── qr/page.tsx
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── people/route.ts
│       ├── people/[studentId]/route.ts
│       └── admin/
│           ├── people/route.ts
│           ├── people/[studentId]/route.ts
│           ├── import/preview/route.ts
│           ├── import/commit/route.ts
│           ├── photos/upload/route.ts
│           ├── qr/[studentId]/route.ts
│           └── qr/export/route.ts
├── lib/
│   ├── db.ts                         # Mongoose connection
│   ├── cloudinary.ts
│   ├── qr.ts                         # generateQrForStudentId()
│   ├── validators.ts                 # Zod schemas
│   └── auth.ts                       # NextAuth config
├── models/
│   └── Person.ts
├── middleware.ts                     # protects /admin/* routes
├── .env.local
└── package.json
```

---

## 9. Deployment Steps

1. Push repo to GitHub.
2. Create MongoDB Atlas free cluster → get connection string.
3. Create Cloudinary free account → get cloud name/API key/secret.
4. Import project into Vercel, connect GitHub repo.
5. Set all env vars in Vercel dashboard (must match `.env.local` keys exactly).
6. **Lock the Vercel project name before first deploy** — this becomes part of every QR code permanently.
7. Deploy, verify `/p/<test-id>` resolves, then run the real Excel import.

---

## 10. Notes for the AI Agent Building This

- Treat `studentId` as immutable everywhere in the codebase once a person exists — no update path should allow changing it, only creating a new person if truly needed.
- Never generate or cache QR images as files tied to a specific deployment URL at build time — always generate on demand from the env var, so a same-ID regeneration is always identical (and a controlled URL/domain change is a conscious one-time decision, not something to reason about here since the current plan stays on the fixed vercel.app URL).
- All admin routes must check the session server-side (not just hide UI elements) — do not rely on client-side route protection alone.
- Excel import must be idempotent: re-uploading the same file twice should not create duplicates or errors.
