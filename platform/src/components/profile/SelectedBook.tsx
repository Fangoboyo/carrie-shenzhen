import React from "react";
import { Heart } from "lucide-react";
import { MemoryScroller } from "./MemoryScroller";
import type { BookRecord, PageRecord } from "../../types/BookComponentTypes";

interface SelectedBookProps {
  book: BookRecord | null;
  pages: PageRecord[];
  currentPageIndex: number;
  onPageChange: (index: number) => void;
}

const CONTAINER_CLASSES = [
  "w-[44%]",
  "bg-white/35",
  "border-[1.5px] border-db-border",
  "rounded-[20px]",
  "p-7",
  "flex flex-col items-center justify-between",
  "box-border",
  "relative",
  "flex-shrink-0"
].join(" ");

export const SelectedBook: React.FC<SelectedBookProps> = ({
  book,
  pages,
  currentPageIndex,
  onPageChange,
}) => {
  const pagesCount = pages.length;

  return (
    <div className={CONTAINER_CLASSES}>
      {/* Memory card marquee / showcase */}
      <div className="scroller-showcase-box flex-1 w-full flex items-center justify-center min-h-[400px]">
        <MemoryScroller
          pages={pages}
          currentPageIndex={currentPageIndex}
          onPageChange={onPageChange}
        />
      </div>

      {/* Book info */}
      <div className="w-full mt-4">
        {/* Title row */}
        <div className="flex items-center justify-between mb-1.5">
          <h2 className="font-hand text-[1.8rem] font-bold m-0 text-db-text leading-none">
            {book?.title || "No Book Selected"}
          </h2>
          <div className="flex items-center gap-1.5 bg-db-card border-[1.5px] border-db-border rounded-lg px-2.5 py-1 text-[0.85rem] font-bold text-db-text">
            <Heart
              size={14}
              fill="var(--color-db-accent)"
              stroke="var(--color-db-accent)"
            />
            <span>{12 + pagesCount * 3}</span>
          </div>
        </div>

        {/* Subtitle */}
        <div className="font-sans text-[0.75rem] font-semibold uppercase tracking-[1.5px] text-db-muted bg-black/5 inline-block px-1.5 py-0.5 rounded mb-4">
          {book?.subtitle || "Select a book below to begin"}
        </div>
      </div>
    </div>
  );
};
