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
| `books` | id, title, subtitle, cover (File), owner→users | Cover is a native PocketBase File field (JPEG/PNG/WebP, max 5MB, auto-thumbs: 400x600, 200x300, 100x150) |
| `pages` | id, title, youtubeId, user→users, book→books, order | `book` and `order` are optional — pages without a book are unassigned drafts |

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
- **Tailwind CSS v4** is the styling layer (via `@tailwindcss/vite`). Design tokens (beige palette, scrapbook fonts) are defined in `@theme` inside `src/index.css`.
- **Exceptions — kept as vanilla CSS**: GSAP 3D book structural classes (`src/styles/book3d.css`) and CSS `@keyframes` / marquee animation classes (`src/styles/animations.css`).
- **Scrapbook Visuals**: Warm HSL colors, cardboard textures, leather-bound book styles, semi-transparent sticky tapes, organic polaroids with hand-drawn rotations, and retro cursive fonts (Google Fonts Caveat / Nanum Pen Script / Inter).
- **3D Interactive Book**: `src/components/BookComponent.tsx` implements a gorgeous 3D book that animates open and loops flipping pages infinitely using GSAP when hovered.

---

## 🐞 CURRENT ACTIVE ISSUE: DATA STRUCTURE — PAGES RETRIEVAL

### The Problem
PocketBase does **not** back-point `Books` to `Pages`. The `BookRecord` type has no `pages` field. The relationship is **forward-only**: each `PageRecord` holds an optional `book` field (the parent book's ID).

This means we cannot do `book.pages` — it simply does not exist on the record.

### Design Decision: Lift & Filter in the Parent
The canonical approach for this codebase is:

1. **`Profile.tsx` is the single data-fetching owner.** It fetches all pages once via `loadPages()` (`pb.collection('pages').getFullList`, sorted by `book,order`).
2. **Derive `selectedBookPages` in `Profile.tsx`** by filtering the already-loaded `pages` array:
   ```ts
   const selectedBookPages = pages
     .filter((p) => p.book === selectedBookId)
     .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
   ```
3. **Pass `selectedBookPages` as a prop** to `SelectedBook` — do NOT fetch pages inside `SelectedBook` itself.

This is the correct pattern because:
- Avoids duplicate DB calls (pages are already in memory in `Profile`).
- `SelectedBook` stays a pure display component (no side effects, easy to test).
- The sort by `book,order` in `loadPages` means the data is already in the right order after filtering.

### SelectedBook Props Contract
```tsx
interface SelectedBookProps {
  book: BookRecord | null;
  pages: PageRecord[];          // pre-filtered & sorted by Profile.tsx
  currentPageIndex: number;
  onPageChange: (index: number) => void;
}
```

### Call Site in Profile.tsx
```tsx
<SelectedBook
  book={selectedBook}
  pages={selectedBookPages}
  currentPageIndex={currentPageIndex}
  onPageChange={setCurrentPageIndex}
/>
```

### When to Fetch Pages Per-Book Instead
Only reach for a per-book `expand` query or a filtered fetch if:
- The total page count across all books becomes too large to load upfront (hundreds+).
- In that case, use PocketBase's `filter` param: `pb.collection('pages').getFullList({ filter: \`book="${bookId}"\`, sort: 'order' })` — triggered inside a `useEffect` that watches `selectedBookId`.

---
