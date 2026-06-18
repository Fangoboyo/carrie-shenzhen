import React from "react";
import type { PageComponentProps } from "../../types/BookComponentTypes";

interface BookPagesProps {
  pages: PageComponentProps[];
  pageRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  contentRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
}

/** Renders the stacked, flippable inner pages of the book. */
export const BookPages: React.FC<BookPagesProps> = ({
  pages,
  pageRefs,
  contentRefs,
}) => (
  <div className="book-pages-container">
    {pages.map((page, i) => (
      <div
        key={i}
        ref={(el) => {
          pageRefs.current[i] = el;
        }}
        className="book-page"
        style={{ transformOrigin: "left center" }}
      >
        <div
          ref={(el) => {
            contentRefs.current[i] = el;
          }}
          className="page-inner-content"
        >
          <div>
            <h1>{page.title}</h1>
            <img src={page.thumbnailUrl} alt={page.title || "Page thumbnail"} />
          </div>
        </div>
      </div>
    ))}
  </div>
);
