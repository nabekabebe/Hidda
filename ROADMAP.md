# Hidda — Feature and Improvement Report

Backlog for later implementation. Written against the Night Atlas / Hidda canvas tree as of August 2026. This is not a commitment to ship records-search or DNA products like Ancestry; it is the **must-have set for a serious family-tree website**, plus the infrastructure Hidda still needs before saved data is real.

**References (product category, not endorsement):** Ancestry, MyHeritage (site + Family Tree Builder), FamilySearch, Family Echo, WikiTree, Geni, Findmypast, RootsMagic / Family Tree Maker.

---

## 1. Where Hidda stands today

**Shipped (keep):** canvas-first tree, typed graph (parent / child / spouse / sibling, including adoptive, step, former, half), person profile, photos as local data, search, filters, collapse, mini-map, labels, descendant-scoped share + JSON / PNG / PDF export, light/dark, keyboard, mobile sheets.

**Not yet a product people can trust with a real family:**

| Gap | What happens now |
| --- | --- |
| No accounts | Anyone on the device shares one local tree. Clearing the browser loses it. |
| Postgres optional and unused by default | Schema exists (`people`, `relationships`, `atlas_meta`, `shares`). The live app still uses `localStorage` unless `VITE_FAMILY_API=http`. |
| Photos are not stored | Avatars are object URLs / inlined data. They vanish or bloat snapshots. |
| Share is a snapshot fork | Recipients do not edit the owner’s live tree. Links fail across devices without Postgres. |
| No GEDCOM | Users cannot leave or arrive from Ancestry, MyHeritage, RootsMagic. |
| GitHub is not linked to Vercel | Production exists ([hidda-eosin.vercel.app](https://hidda-eosin.vercel.app)); new git pushes do not auto-deploy until the Vercel GitHub app can see `nabekabebe/Hidda`. |

---

## 2. Infrastructure that must land first

These are not “nice genealogy extras.” Without them, every other feature is a demo.

### 2.1 Authentication and ownership

**Must have.** Family Echo’s model is the right bar: sign in to save, share, and attach photos. Private by default; invited people only.

**Needed:**

- Sign up / sign in (email + magic link or OAuth: Google / Apple / GitHub).
- Session on the API (`/api/family`, `/api/share`).
- Every tree, person, media object, and share belongs to a `user_id` (or org).
- Logout, “this device is not the source of truth.”
- Optional later: passkeys, 2FA.

**Suggested stack (fits current Vercel + Postgres):** Clerk, Auth.js, or Supabase Auth in front of the existing `/api` handlers. Do not keep writing the family graph into `localStorage` once an account exists; use it only as an offline cache.

### 2.2 Postgres as the system of record

**Must have.** Link Neon / Vercel Postgres, set `POSTGRES_URL` / `DATABASE_URL`, set `VITE_FAMILY_API=http`.

**Needed:**

- Per-user (or per-tree) rows, not a single global `people` table.
- `trees` table: id, owner, name, created/updated.
- Foreign keys: `people.tree_id`, `relationships.tree_id`.
- Migrations instead of only `CREATE TABLE IF NOT EXISTS`.
- Backups and point-in-time restore.
- Fix API TypeScript for Vercel (`verbatimModuleSyntax` / explicit `.js` extensions in `api/*.ts` imports) so serverless routes typecheck in production builds.

### 2.3 Media storage

**Must have.** Ancestry, MyHeritage, and Family Echo all persist photos on the server.

**Needed:**

- Blob store (Vercel Blob, S3, or Cloudinary).
- Upload API, size limits, virus/type checks.
- Store URL on `people.avatar` and on a `media` table (one person, many files).
- Thumbnails for the canvas; full image in the profile.
- Do not put base64 photos in JSON shares or GEDCOM.

### 2.4 Privacy of living people

**Must have** on any site that can be shared. FamilySearch hides living details from strangers; Family Echo is invite-only.

**Needed:**

- Living vs deceased already exists as dates — use it for access control.
- Viewers without permission see “Living” not full name/dates/photos.
- Share links: living people redacted on `view` unless the owner opts in.

---

## 3. Must-have features from similar family-tree websites

Status: **Have** / **Partial** / **Missing**. Partial means a thin version exists and should be brought up to the industry bar.

### A. Data you can take with you

| Feature | Why sites have it | Hidda | Notes for later |
| --- | --- | --- | --- |
| **GEDCOM import** | Default interchange. Ancestry, MyHeritage, Family Echo, RootsMagic all start from GEDCOM. | Missing | Parse GEDCOM 5.5.1; map individuals + FAMC/FAMS to Person + Relationship. Report skipped tags. |
| **GEDCOM export** | Users will not stay if they cannot leave. | Missing | Export current tree or descendant slice. Media as links, not blobs. |
| **JSON backup / restore** | Hidda already exports JSON. | Partial | Add **import JSON**, version the snapshot schema, restore into a tree id. |
| **Multiple trees per account** | Ancestry allows several trees (theories, in-laws, client work). | Missing | Tree switcher on Home. Do not dump everyone into one graph. |

### B. Person and relationship model

| Feature | Why sites have it | Hidda | Notes for later |
| --- | --- | --- | --- |
| **Facts / events, not only fields** | Birth, baptism, marriage, divorce, death, burial, residence, occupation as dated events with places. | Partial | Today: `birthDate`, `deathDate`, `location`, `occupation`. Need an `events` table: type, date, place, description, person or couple. |
| **Marriage / partnership dates and places** | Core of a family group sheet. | Missing | Store on spouse/partner edges (`metadata` is already there — use it, then promote to events). |
| **Titles, suffix, birth surname** | Family Echo and GEDCOM (NPFX, NSFX, SURN). | Missing | `prefix`, `suffix`, `birthLastName`. |
| **Burial, cause of death, places of birth/death** | Standard profile fields. | Missing | Separate `birthPlace`, `deathPlace`, `burialPlace`. |
| **Unrelated / disconnected people** | MyHeritage FTB: add people not yet linked. | Partial | Possible via “Place a person,” but layout/search should keep orphans visible (list of unplaced). |
| **Merge duplicates** | Every real tree grows doubles. | Missing | Candidate UI: same name + dates; merge nodes and rewrite edges. |
| **Find and replace** | MyHeritage FTB. | Missing | Place names, surnames after a spelling decision. |

### C. Seeing the family

| Feature | Why sites have it | Hidda | Notes for later |
| --- | --- | --- | --- |
| **Interactive descendant / family map** | Hidda’s hero. | Have | Keep as default. |
| **Pedigree (ancestor) view** | Ancestry’s classic 4–5 generation chart. | Missing | Hourglass optional: ancestors up, descendants down from a home person. |
| **Fan chart** | MyHeritage / FTB print staple. | Missing | Read-only visualization of ancestors. |
| **Index / list of all people** | FTB “profile list”; Ancestry tree search. | Partial | Search palette exists; need a sortable directory (name, dates, generation). |
| **Home person** | Every site orients the tree around “me” or a research focus. | Partial | Seed focuses Mira; persist `homePersonId` per tree. |
| **Relationship to home person** | “2nd great-grandmother.” Ancestry / FamilySearch. | Missing | Compute via graph; show on profile and node. |
| **Timeline / calendar** | Family Echo calendar; FTB timeline report. | Missing | Births, deaths, marriages on a year axis or month calendar. |
| **Map of places** | MyHeritage maps. | Missing | Geocode places; pins per event. Not v1 of maps — structured place fields first. |

### D. Media and stories

| Feature | Why sites have it | Hidda | Notes for later |
| --- | --- | --- | --- |
| **Photo on the person** | Universal. | Partial | Upload/crop exist; persist in blob store. |
| **Gallery per person** | MyHeritage: many files, tag multiple people in one photo. | Missing | `media` + `media_tags (media_id, person_id, x, y)`. |
| **Documents** | Certificates, letters, census pages. | Missing | Same media table, `kind: photo \| document \| audio`. |
| **Stories / biography** | FamilySearch Memories; Ancestry stories. | Partial | `description` + `notes` exist; add dated stories and rich text later. |

### E. Evidence (what makes a tree believed)

Serious tools treat **sources** as first-class. WikiTree and FamilySearch push this hardest; Ancestry/MyHeritage attach sources to facts.

| Feature | Why sites have it | Hidda | Notes for later |
| --- | --- | --- | --- |
| **Source citations on facts** | “Where did this birth date come from?” | Missing | `sources` + `citations (event_id or field, source_id, page, quote)`. |
| **Record hints** | Ancestry leaves, MyHeritage Record Matches. | Missing | Out of scope until a records partner exists. Keep a hook: `hints` UI later. |
| **Confidence / research status** | Unverified vs sourced. | Missing | Badge on the node or fact. |

### F. Sharing and collaboration

| Feature | Why sites have it | Hidda | Notes for later |
| --- | --- | --- | --- |
| **Invite-only family access** | Family Echo: private, invited members. | Partial | Token links exist; need accounts, email invite, revoke, expiry. |
| **Roles: owner / editor / viewer** | Ancestry tree sharing. | Partial | Share is view or edit on a **copy**. Need live ACL on the owner tree. |
| **Live collaboration** | FamilySearch one-world tree (different product). For Hidda: invited editors on **the same** tree. | Missing | After auth + Postgres; presence optional. |
| **Link expiry and password** | Common for “send to auntie.” | Missing | |
| **Activity log** | “Who changed this death date?” | Missing | Append-only `audit_events`. |
| **Comments on a person** | Family site feel (MyHeritage family site). | Missing | After auth. |

### G. Charts, print, and reports

| Feature | Why sites have it | Hidda | Notes for later |
| --- | --- | --- | --- |
| **PNG / PDF of tree or descendants** | Print and WhatsApp. | Partial | Exists; add pedigree/fan, page size (A3/A4), legend. |
| **Family group sheet** | Standard genealogy report. | Missing | One couple + children, dates, places. |
| **Ancestor / descendant narrative** | FTB book report. | Missing | Generated text from events. |
| **Excel / CSV people list** | FTB export. | Missing | Easy once list view exists. |

### H. Quality of life

| Feature | Why sites have it | Hidda | Notes for later |
| --- | --- | --- | --- |
| **Undo / history** | Accidental deletes. | Missing | Command stack or tree snapshots. |
| **Recycle bin** | Ancestry. | Missing | Soft-delete people for 30 days. |
| **Keyboard + a11y** | Hidda principle. | Partial | Audit living-name privacy, share pages, export stage. |
| **PWA / install** | MyHeritage mobile; work on a phone. | Missing | Service worker, offline read of last snapshot. |
| **Conflict if two parents of the same type** | Data quality. | Partial | Graph allows it (real families); warn on 3+ biological parents. |
| **Tasks / to-research list** | FTB task manager. | Missing | “Find burial for X.” After the tree is saved. |

---

## 4. What not to copy (yet)

These dominate Ancestry / MyHeritage marketing. They are **not** required to make Hidda a good tree product, and they are expensive.

- DNA matching, ethnicity, ThruLines
- Billions of historical records and hint engines
- One public world tree (FamilySearch / Geni / WikiTree model) as the default
- Photo animation / Deep Nostalgia-style AI as a core loop
- Native iOS/Android apps before PWA

Hidda should stay **canvas-first, private, owned trees** — closer to Family Echo + a modern Ancestry *tree builder*, not a records warehouse.

---

## 5. Suggested implementation order

Use this as the later build sequence. Each phase should be shippable.

### Phase 0 — Production hygiene

- Grant Vercel GitHub app access to `Hidda` so `main` auto-deploys.
- Fix `api/` TypeScript resolution for Vercel builds.
- Health check that reports DB configured vs not (`/api/health` already hints this).

### Phase 1 — Identity and database (blocker)

1. Auth (magic link or OAuth).
2. `users`, `trees`, scoped `people` / `relationships` / `atlas_meta` / `shares`.
3. Turn on `VITE_FAMILY_API=http` in production.
4. First-run: create tree, optional import of localStorage snapshot.
5. Living-person redaction on public/view links.

### Phase 2 — Media and portable data

1. Blob uploads + gallery.
2. GEDCOM import/export.
3. JSON import to match export.
4. Marriage/divorce on partner edges; birth/death places.

### Phase 3 — Tree literacy

1. Home person + “related as…”
2. People index.
3. Pedigree view; then fan chart.
4. Timeline of events.
5. Duplicate merge; undo/soft-delete.

### Phase 4 — Real sharing

1. Invites by email, roles on the **live** tree.
2. Share expiry, revoke, audit log.
3. Comments optional.

### Phase 5 — Evidence and polish

1. Sources and citations on events.
2. Family group sheet + CSV.
3. PWA offline cache.
4. Maps once places are structured.

---

## 6. Postgres sketch (for Phase 1)

Not implemented — target shape when replacing the single-tenant schema in `api/schema.ts`.

```
users (id, email, name, created_at)
trees (id, owner_id, name, home_person_id, created_at, updated_at)
tree_members (tree_id, user_id, role) -- owner | edit | view
people (id, tree_id, ...existing columns..., birth_place, death_place, prefix, suffix)
relationships (id, tree_id, ...existing...)
events (id, tree_id, person_id, spouse_relationship_id, type, date, place, detail)
media (id, tree_id, url, thumb_url, kind, caption)
media_people (media_id, person_id)
shares (token, tree_id, permission, scope, root_person_id, expires_at, created_by)
```

Shares should point at a **tree** (live ACL) or a **frozen snapshot** (current behavior). Prefer live ACL for family; keep snapshot export for “send a PDF of this branch.”

---

## 7. Acceptance bar for “must have” done

Hidda is ready to call a family-tree **website** (not a canvas demo) when:

1. A user can create an account and see the same tree on phone and laptop.
2. Data survives a new browser and a Vercel redeploy.
3. Photos remain after refresh.
4. They can import a GEDCOM from another site and export one back.
5. They can invite one relative to view or edit without giving away the whole account.
6. Living people’s details are not public by default.
7. They can print or PDF a descendant branch that matches the on-screen graph.

Until then, treat auth + Postgres + media + GEDCOM as the critical path; everything in sections C–H waits on that path unless it is a small additive UI on the current graph.
