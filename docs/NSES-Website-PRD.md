# Product Requirements Document: NSES Society Website (V1)

**Author:** Ahmad, Head of Security Team, NSES (NUML Software Engineering Society)
**Status:** Draft for V1 scoping
**Last updated:** September 2026

---

## 1. Problem

NSES currently has no central, authoritative place where a student's identity as a member or head is verifiable and shareable online. Physical membership cards are printed each semester, but there is no digital counterpart — no easy way for someone who meets a member to confirm their role, see their team, or connect with them on LinkedIn.

At the same time, membership data (who joined, who leads which team, who has left) lives in spreadsheets and is re-entered by hand whenever cards are printed, which is slow and error-prone at ~150 members per semester.

**V1 solves two problems together:** it gives NSES a lightweight public presence (home page + directory), and it gives every printed card a permanent, scannable link to that person's own profile page.

---

## 2. Target Users

| User | Need |
|---|---|
| **NSES member / head** | Wants a card that, when scanned, shows their real profile so a peer can quickly verify who they are and add them on LinkedIn. |
| **Fellow student (card scanner)** | Wants to scan a card at an event or meeting and immediately land on that person's profile — role, team, LinkedIn link — with no login or app required. |
| **Admin (you / a designated successor)** | Needs to import ~150 people each semester from Excel, keep profiles current, and print QR-coded cards without any of the QR codes breaking on old cards. |

Note: per your answer, only the admin manages the site — heads and other officers do not get edit access in V1.

---

## 3. User Stories

**Member/Head**
- As a member, I want my printed card's QR code to open my own profile page, so a scanner sees accurate information about me.
- As a member, I want my profile to show my role, team, photo, bio, and LinkedIn/social links, so people can connect with me after scanning.

**Scanner (any student)**
- As a student who scans a card, I want the profile to load instantly with no login, so I can quickly confirm who I'm talking to.
- As a student, I want a clear path to the person's LinkedIn from their profile, so I can connect right away.

**Admin**
- As the admin, I want to upload an Excel sheet of all members/heads each semester, so I don't have to enter 150 people by hand.
- As the admin, I want the system to match re-imported rows to existing people (by student ID), so returning members keep their same profile and QR code.
- As the admin, I want to upload member photos in bulk, so I don't have to attach a photo per person manually.
- As the admin, I want to mark someone as inactive/former rather than deleting them, so their already-printed card still resolves to a valid page.
- As the admin, I want to generate all QR codes for printing in one batch (ZIP of PNG/SVG), so I can hand them straight to the print shop.
- As the admin, I want a single secure login, so only I can edit data.

---

## 4. Core Features (V1)

1. **Public home page** — society name/intro, current leadership highlighted (President, VP, Heads).
2. **Members & heads directory** — browsable list/grid of all active people, linking to individual profiles.
3. **Individual profile page** (`/p/<student-id>`) — name, role, team, photo, bio, social links (LinkedIn primary). This is the page every QR code points to.
4. **Excel import** — admin uploads a spreadsheet; system previews rows, validates student IDs, and creates/updates people. Existing student IDs update in place; new IDs create new profiles.
5. **Bulk photo upload** — admin uploads photos named by student ID; system matches them to the right profile automatically.
6. **QR code generation** — one QR per person, encoding `https://<project>.vercel.app/p/<student-id>`, generated once and never regenerated for the same ID. Bulk export as a ZIP or print sheet.
7. **Admin authentication** — single admin login (username/password), protecting all edit/import/upload/export actions.
8. **Inactive/former status** — admin can mark a person inactive without deleting them, so old cards still resolve.

---

## 5. Success Metrics

- **100% of printed cards resolve correctly** — every QR code opens the intended person's live profile, with zero broken links after printing.
- **Import time:** a full semester roster (~150 people) can be imported and photo-matched in under 15 minutes of admin effort.
- **Zero re-prints caused by the website** — no card needs reprinting because a QR code changed or broke.
- **Admin independence:** admin can complete a semester's full update (new members, role changes, departures) without needing developer help or a code change.
- **Adoption signal (soft metric):** noticeable number of members using the profile link on their own LinkedIn ("Featured" section or similar) within the first month of card distribution.

---

## 6. Edge Cases

- **Duplicate or reused student IDs** (e.g. a typo creates a near-duplicate row) — import step must flag potential duplicates for admin review before saving.
- **Student ID typed inconsistently** (extra spaces, mixed case) — normalize on import (trim + uppercase) so the same person always maps to the same URL.
- **Person leaves NSES but their card is still in circulation** — mark inactive, not deleted; profile still loads but is clearly marked (e.g. "Former Member") rather than 404ing.
- **Role changes mid-semester** (member promoted to head) — this is an edit to the existing profile (same student ID, same QR/card), not a new entry — the card does not need reprinting for a role change, only the printed role label would be outdated until next batch.
- **Missing or delayed photo** — profile page must render cleanly with a placeholder avatar if no photo is uploaded yet.
- **Someone scans an invalid or tampered ID in the URL** — show a friendly "Profile not found" page, never a server error.
- **Excel formatting inconsistencies** (extra columns, blank rows, wrong header names) — import should validate structure and show clear errors before committing any data.
- **High-traffic moment** (e.g. everyone scans cards right after distribution) — free-tier hosting should handle this fine at ~150 profiles, but avoid cold-start-heavy architecture (see stack note below).

---

## 7. Out of Scope (V1)

- Suggestion box (planned for V2)
- Multi-admin access for heads/other officers
- Member self-service profile edits or edit requests
- Event calendar, gallery, or news/blog section
- Public search/filter by skill, batch, or team
- Custom domain (staying on free `vercel.app` subdomain for now)
- Analytics/tracking of who scanned which card
- Anything beyond a single LinkedIn/social link set per profile (no messaging, no comments)

---

## 8. Key Constraint Driving Design

Because QR codes are physically printed and cannot be reprinted or edited once distributed, **the profile URL for a given person must never change** across re-imports, role changes, or site redesigns. This is why:
- Student ID (a value that never changes) is the permanent key in the URL, not name or an auto-incrementing database index.
- The Vercel project name must be fixed before the first print run and never renamed.
- Deletion is disallowed in favor of an "inactive" status.

This constraint should be treated as a hard requirement in implementation, not a nice-to-have.
