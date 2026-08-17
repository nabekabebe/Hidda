# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + React + TypeScript, chosen by the user. Persistence is in-memory with a clean API layer so a backend can be swapped later.

## Users

People documenting and exploring their own family: individuals building a first tree, and family historians maintaining a large multi-generation graph. They work on desktop, laptop, tablet, and phone. The primary job is to see who belongs to whom and add another person without leaving the tree.

## Product Purpose

A family tree web application for visually creating, exploring, and managing a family as a living top-to-bottom hierarchical map. Success is when a user can look at the screen and immediately understand relationships, then add a person with: select person, choose relationship, enter details, done.

## Positioning

The tree visualization is the product, not a view of a database. Adding a family member happens on the canvas through directional quick actions (parent, child, spouse, sibling). Relationships are a real graph (biological, adoptive, step, former spouse, half-sibling), not a nested parent-child JSON tree.

## Operating Context

Single-tree client app. Users pan, zoom, search, filter, and edit in place. Desktop prioritizes the large interactive tree. Mobile uses touch pan, pinch zoom, bottom sheets, and floating actions rather than a shrunken desktop chrome. Data lives behind an in-memory API for this build.

## Capabilities and Constraints

Confirmed:

- Interactive top-to-bottom tree: ancestors, descendants, parents, children, spouses/partners, siblings, multiple generations and branches
- Person nodes with avatar, name, nickname, dates, description, location, occupation, tags, relationship status
- One-click relationship creation from a selected node
- Add/edit person form with photo upload, crop, validation, keyboard navigation
- In-place profile panel
- Pan, zoom, fit, center, reset, collapse/expand, focus, search, jump, mini-map
- Search by name, nickname, location, occupation, birth year, tags
- Filters by generation, gender, branch, relationship, living/deceased, location, tags, date range
- Context menus (desktop) and bottom sheets (mobile)
- Light and dark themes
- Keyboard shortcuts (search, add, zoom, fit, home, escape)
- Empty-state onboarding and lightweight guided first-run
- Toast notifications for mutations
- Graph data model: Person and Relationship records
- Canvas labels for naming the atlas and marking sections
- Export JSON/PNG/PDF and share links with view or edit access, for the whole tree or a selected person’s descendants

Open:

- Product name is not confirmed; working title is Family Tree until a brand name is chosen
- No real GEDCOM import in this build
- Photo storage is client-side (object URLs / in-memory) until a backend exists

## Brand Commitments

User-binding references: Notion + Linear + Apple-quality interactions + an elegant genealogy product. The experience should feel playful, polished, premium, highly interactive, and smooth. The family tree remains the hero. Avoid generic CRUD, dense tables, corporate dashboards, and outdated genealogy UI.

## Evidence on Hand

No real family data, photos, or brand assets exist. Demonstration people, relationships, and avatars in this build are synthetic and must be labeled as such. Do not invent customer counts, testimonials, or genealogy-research claims.

## Product Principles

1. The tree is the hero: every other surface serves seeing and growing the family map.
2. Adding a person is a canvas action, not a form-first workflow.
3. Relationships are a graph with typed edges, not a single hierarchy.
4. Motion explains hierarchy and change; it never delays a repeated task.
5. Large trees stay navigable: layout, search, filters, and collapse exist so the map does not become unusable.

## Accessibility & Inclusion

Keyboard navigation, screen-reader labels, visible focus, accessible forms, WCAG AA contrast, and `prefers-reduced-motion` are required. Important actions must not depend solely on hover.
