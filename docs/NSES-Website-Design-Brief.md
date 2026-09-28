# Design Brief: NSES Society Website (V1)

Companion to `NSES-Website-PRD.md` and `NSES-Website-Tech-Spec.md`.

---

## 1. User Flows

### 1.1 Visitor scans a card
```
Scan QR → Profile page loads → Read name/role/team/bio → Tap LinkedIn → Leaves site
                                      │
                                      └─ If inactive → same layout, "Former Member" badge
                                      └─ If invalid ID → "Profile not found" page
```

### 1.2 Visitor browses without a card
```
Home → "Members" nav link → Directory (filter by role) → Tap a card → Profile page
```

### 1.3 Admin: semester import
```
Login → Admin Dashboard → Import → Upload Excel → Review preview table
   → Fix flagged rows (or re-upload) → Confirm → Success toast → back to Dashboard
```

### 1.4 Admin: photos
```
Admin Dashboard → Photos → Select files → Upload → See per-file success/skip results
```

### 1.5 Admin: QR export
```
Admin Dashboard → QR Codes → (optional) preview one → Download All (ZIP)
```

### 1.6 Admin: edit one profile
```
Admin Dashboard → People → Search/select person → Edit form → Save → Confirmation
```

---

## 2. Screen Inventory

**Public**
1. Home
2. Members Directory
3. Profile Page (active)
4. Profile Page (former member variant)
5. Profile Not Found

**Admin**
6. Admin Login
7. Admin Dashboard
8. Import (upload + preview)
9. Photo Upload
10. People List (admin view, active + inactive)
11. Edit Person
12. QR Codes (preview + export)

---

## 3. Layout per Screen

**1. Home**
- Header: society name/logo, nav (Home, Members)
- Hero: society name, one-line mission statement, optional group photo
- Leadership strip: President + VP cards side by side (larger than regular member cards)
- Heads grid: card per head, photo + name + team
- Footer: minimal — society name, year, maybe department name

**2. Members Directory**
- Header (shared)
- Filter bar: role toggle (All / Heads / Members)
- Grid of profile cards (photo, name, role, team) — 3–4 columns desktop, 2 columns tablet, 1 column mobile
- Empty state if a filter returns nobody (shouldn't normally happen, but see §7)

**3. Profile Page**
- Centered single-column card, max-width ~480px
- Photo (large, circular or rounded-square)
- Name (largest text on page)
- Role badge + Team label
- Bio paragraph
- Social links row (icon buttons: LinkedIn primary/first, GitHub, other)
- No navigation clutter — this page is often the *only* page a scanner ever sees, so it must stand alone and load fast

**4. Profile Page — Former Member**
- Identical layout to Profile Page
- Small, non-alarming badge near the role: "Former Member" (muted color, not red/error-coded)

**5. Profile Not Found**
- Centered message, society logo, short friendly text ("This profile couldn't be found.")
- Link back to Home

**6. Admin Login**
- Centered card: username, password, submit
- Error message inline on failed login (no field-specific hints, to avoid username enumeration)

**7. Admin Dashboard**
- Header with "Admin" indicator + logout
- Grid/list of quick links: Import, Photos, People, QR Codes
- At-a-glance counts: total active people, heads count, members count

**8. Import**
- Step 1: file upload dropzone
- Step 2 (after upload): preview table — columns mirror Excel, plus a status column (✅ / ⚠️ with reason)
- Sticky action bar: "Confirm Import" (disabled until at least one valid row), "Cancel"

**9. Photo Upload**
- Multi-file dropzone
- After upload: results list — filename → matched person name, or "No matching student ID" flag

**10. People List (admin)**
- Table: photo thumbnail, name, student ID, role, team, active/inactive toggle, edit link
- Search/filter by name or ID
- Inactive people visually muted (not hidden)

**11. Edit Person**
- Form: name, role (dropdown), team, bio (textarea), photo (upload/replace), socials (linkedin/github/other), active toggle
- Student ID shown as **read-only text**, clearly labeled "cannot be changed"
- Save / Cancel buttons

**12. QR Codes**
- List/grid of people with a small QR thumbnail preview + name
- "Download All (ZIP)" primary action
- Per-row "Download" for a single QR

---

## 4. Component List

- `Header` (public) / `AdminHeader`
- `NavLink`
- `Button` (primary, secondary, destructive-muted for "mark inactive")
- `ProfileCard` (used in directory + leadership strip, size variants: `default`, `featured`)
- `ProfilePageLayout` (the standalone scanned-profile layout)
- `RoleBadge` (President / VP / Head / Member — distinct but not garish colors)
- `StatusBadge` (Active / Former Member)
- `SocialLinkButton` (icon + label, LinkedIn/GitHub/Other)
- `FilterTabs` (role filter on directory)
- `DataTable` (People List, Import Preview)
- `FileDropzone` (Excel import, photo upload)
- `Toast` (success/error notifications)
- `EmptyState`
- `LoadingSpinner` / `SkeletonCard`
- `FormField` (label + input + error text, used across admin forms)
- `ConfirmDialog` (for "mark inactive", "confirm import")

---

## 5. Design Tokens

**Colors** (adjust hue to match NSES branding if a color exists; these are safe neutrals + one accent)

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#FFFFFF` | Page background |
| `--color-surface` | `#F7F8FA` | Cards, table rows |
| `--color-text-primary` | `#111827` | Headings, body |
| `--color-text-secondary` | `#6B7280` | Meta text, labels |
| `--color-accent` | `#2563EB` | Primary buttons, links, active nav |
| `--color-accent-hover` | `#1D4ED8` | Hover state |
| `--color-success` | `#16A34A` | Success toasts, ✅ status |
| `--color-warning` | `#D97706` | ⚠️ flagged import rows |
| `--color-error` | `#DC2626` | Error states, failed login |
| `--color-muted-badge` | `#9CA3AF` | "Former Member" badge |
| `--color-border` | `#E5E7EB` | Card/table borders |

**Type scale** (assuming a system font stack or Inter for a clean, fast-loading look)

| Token | Size | Use |
|---|---|---|
| `--text-xs` | 12px | Meta labels, badges |
| `--text-sm` | 14px | Body secondary, table cells |
| `--text-base` | 16px | Body text |
| `--text-lg` | 18px | Card titles (name in directory) |
| `--text-xl` | 24px | Section headings |
| `--text-2xl` | 32px | Profile page name |
| `--text-3xl` | 40px | Home hero heading |

**Spacing scale** (4px base unit)

`--space-1: 4px` · `--space-2: 8px` · `--space-3: 12px` · `--space-4: 16px` · `--space-6: 24px` · `--space-8: 32px` · `--space-12: 48px` · `--space-16: 64px`

**Radius**: `--radius-sm: 6px` (buttons, inputs) · `--radius-md: 12px` (cards) · `--radius-full` (avatars, badges)

**Shadow**: one subtle card shadow, `--shadow-card: 0 1px 3px rgba(0,0,0,0.08)` — avoid heavy shadows, keep it flat and clean.

---

## 6. States

| Screen/Component | Loading | Empty | Error | Success |
|---|---|---|---|---|
| Directory | Skeleton cards (6–8 placeholders) | "No members match this filter" + reset filter link | "Couldn't load members — try again" + retry button | Grid renders normally |
| Profile Page | Skeleton (photo circle + text bars) | n/a | "Profile not found" screen (see §3) | Full profile renders |
| Import Preview | Spinner while parsing | n/a (upload gated behind file selection) | Row-level ⚠️ flags; top banner if file itself is unreadable | Green banner "X people ready to import" |
| Import Commit | Button shows spinner, disabled | n/a | Toast: "Import failed — no changes were saved" (must be all-or-nothing, not partial) | Toast: "X people added, Y updated" |
| Photo Upload | Per-file progress indicator | n/a | Per-file "No match found for this filename" | Per-file "Matched to [Name]" |
| Admin Login | Button spinner | n/a | "Incorrect username or password" (generic, not field-specific) | Redirect to Dashboard |
| Edit Person | Form disabled while saving | n/a | Inline validation errors per field | Toast "Saved" + return to People List |
| QR Export | "Generating ZIP..." with spinner | n/a (won't be empty if any active people exist) | "Couldn't generate export — try again" | File download starts automatically |

---

## 7. Accessibility Notes

- **Color contrast:** all text/background pairs above meet WCAG AA (4.5:1 for body text, 3:1 for large text/headings) — verify accent blue against white before finalizing.
- **Profile page is often a scanner's only page**: ensure it works with zero JavaScript failures gracefully (server-rendered, not a blank screen if a script fails) since it may be opened on varied phone browsers at events.
- **Focus states:** every interactive element (nav links, buttons, form fields, filter tabs) needs a visible focus ring — many scanners will be on mobile, but admin usage is keyboard/desktop-heavy.
- **Form labels:** every admin input has a real `<label>`, not placeholder-only text (placeholders disappear on input and fail for screen readers).
- **Alt text:** member/head photos need alt text using the person's name ("Photo of [Name]"), not generic "photo.jpg".
- **Status not conveyed by color alone:** "Former Member" and import ⚠️ flags must pair an icon/text label with color, not rely on red/muted color alone (colorblind users).
- **Touch targets:** QR-scanning audience is mobile-first — buttons and links on the profile page should have a minimum 44×44px tap target.
- **Error messages are actionable:** avoid raw error codes; every error state above includes a next step (retry, reset filter, re-upload).
- **Reduced motion:** if any loading/skeleton animations are added, respect `prefers-reduced-motion` and fall back to a static state.

---

## 8. Design Principle for This Project

The profile page is the single most important screen — it's the one guaranteed touchpoint for every printed card. Every other screen can be simple and utilitarian; the profile page should get the most design attention, load fast, and work perfectly on a mobile browser with no login and no app.
