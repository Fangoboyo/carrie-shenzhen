import React, { useRef } from "react";
import "../styles/book3d.css";

import type {
  BookComponentProps,
} from "../types/BookComponentTypes";

// ─── Sub-components & hook ────────────────────────────────────────────────────
import { BookRibbon } from "./book/BookRibbon";
import { BookPages } from "./book/BookPages";
import { BookCover } from "./book/BookCover";
import { useBookHover } from "./book/useBookHover";

// ─── Component ───────────────────────────────────────────────────────────────

export const BookComponent: React.FC<BookComponentProps> = ({
  title = "High school",
  subtitle = "The book",
  coverUrl,
  pages = [],
  coverColor,
  accentColor,
  onClick,
}) => {
  const displayTitle = title;
  const displaySubtitle = subtitle;
  const displayCoverUrl = coverUrl;

  // Refs ──────────────────────────────────────────────────────────────────────
  const bookRef = useRef<HTMLDivElement>(null);
  const ribbonRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Hover animations 
  const { handleHoverStart, handleHoverEnd } = useBookHover({
    bookRef,
    coverRef,
    ribbonRef,
    pageRefs,
    contentRefs,
  });

  const bookStyle = {
    "--book-cover-color": coverColor,
    "--book-cover-accent": accentColor,
  } as React.CSSProperties;

  return (
    <div
      ref={bookRef}
      className="scrapbook-book"
      style={{ ...bookStyle, transformStyle: "preserve-3d", perspective: 1000 }}
      onMouseEnter={handleHoverStart}
      onMouseLeave={handleHoverEnd}
      onClick={onClick}
    >
      <BookRibbon ribbonRef={ribbonRef} />

      <BookPages pages={pages} pageRefs={pageRefs} contentRefs={contentRefs} />

      <BookCover
        coverRef={coverRef}
        displayCoverUrl={displayCoverUrl}
        displayTitle={displayTitle}
        displaySubtitle={displaySubtitle}
      />
    </div>
  );
};

// ─── Scroller ────────────────────────────────────────────────────────────────

interface ScrapbookScrollerProps {
  children: React.ReactNode;
}

export const ScrapbookScroller: React.FC<ScrapbookScrollerProps> = ({
  children,
}) => <div className="scrapbook-scroller-container">{children}</div>;
