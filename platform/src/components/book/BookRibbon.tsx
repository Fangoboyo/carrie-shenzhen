import React from "react";

interface BookRibbonProps {
  ribbonRef: React.RefObject<HTMLDivElement | null>;
}

/** Dangling bookmark ribbon that sways when the book opens. */
export const BookRibbon: React.FC<BookRibbonProps> = ({ ribbonRef }) => (
  <div ref={ribbonRef} className="book-ribbon" />
);
