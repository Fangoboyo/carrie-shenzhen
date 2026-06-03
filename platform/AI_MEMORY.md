# AI Project Memory File: Shared Memory Books Scrapbook Platform

This file serves as a persistent brain state for any AI agents pair-programming on this repository. It documents the core objectives, architectural details, premium design system guidelines, and current blocking issues.

---

## 📌 CORE GOALS & ARCHITECTURE
- **Objective**: Build a premium React + Vite landing page with a warm beige scrapbook aesthetic, backed by a local PocketBase v0.27 instance.
- **Key Flow**: Users log in with Google OAuth (requesting `youtube.upload` scopes), upload video clips, view them on their profile page, and organize them as **pages** inside a **book**. Each book has a cover image and an ordered list of pages (videos).
- **Port Schemes**:
  - React/Vite dev server: `http://localhost:3000`
  - PocketBase server: `http://localhost:8090` (using `--dir=pb/pb_data --migrationsDir=pb/pb_migrations`)

## 🗄️ POCKETBASE SCHEMA (current as of migration 1780288002)
| Collection | Key Fields | Notes |
|---|---|---|
| `users` | id, name, email | auth collection, Google OAuth enabled |
| `books` | id, title, subtitle, cover (File), owner→users | Replaces old `boards`. Cover is a native PocketBase File field (JPEG/PNG/WebP, max 5MB, auto-thumbs: 400x600, 200x300, 100x150) |
| `pages` | id, title, youtubeId, user→users, book→books, order | Renamed from `videos`. `book` and `order` are optional — pages without a book are unassigned drafts |

### Cover image URL pattern
```ts
// Resolve a book cover URL (use in <img src={...} />)
pb.files.getUrl(book, book.cover)
pb.files.getUrl(book, book.cover, { thumb: '400x600' })
```

### Migration run command
```sh
pb/pocketbase.exe serve --dir=pb/pb_data --migrationsDir=pb/pb_migrations
```

---

## 🎨 DESIGN SYSTEM & SCRAPBOOK AESTHETIC
Aesthetics must be highly polished, nostalgic, tactile, and premium:
- **No Tailwind CSS**: Use Vanilla CSS styles (e.g., in `src/styles/` and `src/index.css`).
- **Scrapbook Visuals**: Warm HSL colors, cardboard textures, leather-bound book styles, semi-transparent sticky tapes, organic polaroids with hand-drawn rotations, and retro cursive fonts (Google Fonts Caveat / Inter).
- **3D Interactive Book**: `src/components/book.tsx` implements a gorgeous 3D book that animates open and loops flipping pages infinitely using GSAP when hovered.

---

## 🐞 CURRENT ACTIVE ISSUE: BOOKCOMPONENT PAGE-TURN TIMINGS & SEAMLESS LOOPING

The Google OAuth2 issue has been fully resolved. We are now focusing on polishing the custom **3D Book Component** (`src/components/book.tsx`).

### The Timing Alignment Problem:
When a user hovers over the 3D book cover, the cover opens beautifully, but the flipping pages inside have mismatched keyframe timings and delays. This creates clipping, abrupt snapbacks, or disappearing pages instead of a smooth, infinite page-turn sequence.

### Proposed Seamless Timeline Model:
Since only 2 pages (`Page 0` and `Page 1`) loop actively while `Page 2` remains statically open on the right:
1. **Symmetric Phase Shift**: Both loop-active pages must run the exact same keyframe progression but offset by exactly `50%` of the loop cycle.
2. **Timing Curve Sequence (0.0 to 1.0)**:
   - `0.0` - `0.1` (10%): Page rests on the right.
   - `0.1` - `0.5` (40%): Page turns left, rotating `rotateY` from `0` to `-150`.
   - `0.5` - `0.8` (30%): Page rests on the left side (fully visible with `opacity: 1` as the new background page, while the other page turns on top).
   - `0.8` - `0.9` (10%): Page fades out (`opacity: 1 -> 0`).
   - `0.9` - `0.92` (2%): Page snaps back to the right invisibly (`rotateY: 0`, `opacity: 0`).
   - `0.92` - `1.0` (8%): Page fades in on the right (`opacity: 0 -> 1`), ready to flip again.

---

## 🛠️ FEASIBILITY CONSIDERATIONS: GSAP vs FRAMER MOTION
For a complex website featuring multiple elements with similar visual requirements:
- **GSAP (GreenSock)**: Is highly recommended for a full site. GSAP's `timeline()` API handles staggers, complex 3D layering, scroll-scrubbing, and micro-interaction sequencing with better performance and absolute precision.
- **Framer Motion**: Suffices for singular, interactive components that tie cleanly to React lifecycle states, but lacks robust sequence scheduling. Hardcoding overlapping keyframe arrays (`times` and `delay`) becomes fragile.
