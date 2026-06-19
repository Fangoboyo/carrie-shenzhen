// ---------------------------------------------------------------------------
// PocketBase Record Types
// Use these when working with raw data from pb.collection('books') /
// pb.collection('pages'). Cover image URLs are constructed via:
//   pb.files.getUrl(book, book.cover)
//   pb.files.getUrl(book, book.cover, { thumb: '400x600' })
// ---------------------------------------------------------------------------

export interface BookRecord {
  id: string;
  title: string;
  subtitle?: string;
  /** Filename stored in PocketBase – use pb.files.getUrl() to resolve the full URL. */
  cover: string;
  owner: string;
  created: string;
  updated: string;
}

export interface PageRecord {
  id: string;
  title: string;
  youtubeId: string;
  /** Optional description for this memory page. */
  description?: string;
  user: string;
  /** ID of the parent book this page belongs to. */
  book?: string;
  /** 0-indexed position of this page within the book. */
  order?: number;
  created: string;
  updated: string;
}

// ---------------------------------------------------------------------------
// BookComponent UI Types
// ---------------------------------------------------------------------------

/** Props representing a single page's content and thumbnail. */
export interface PageComponentProps {
  title: string;
  content?: string;
  thumbnailUrl?: string;
}

/** Props for the 3D BookComponent. */
export interface BookComponentProps {
  title?: string;
  subtitle?: string;
  /** Full resolved URL for the cover image (from pb.files.getUrl). */
  coverUrl?: string;
  pages?: PageComponentProps[];
  coverColor?: string;
  accentColor?: string;
  onClick?: () => void;
  isOpen?: boolean;
  disableHover?: boolean;
}