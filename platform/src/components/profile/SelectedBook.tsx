import React from "react";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { MemoryComponent } from "../book/MemoryComponent";
import type { BookRecord, PageRecord } from "../../types/BookComponentTypes";

interface SelectedBookProps {
  book: BookRecord | null;
  pages: PageRecord[];
  currentPageIndex: number;
  onPageChange: (index: number) => void;
}

// Extract long/repeated utility classes into clean constants
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

const NAV_BUTTON_CLASSES = [
  "w-10 h-10",
  "rounded-full",
  "border-[1.5px] border-db-border",
  "bg-db-card",
  "text-db-text",
  "cursor-pointer",
  "flex items-center justify-center",
  "transition-all duration-200",
  "hover:border-db-text hover:shadow-sm"
].join(" ");

export const SelectedBook: React.FC<SelectedBookProps> = ({
  book,
  pages,
  currentPageIndex,
  onPageChange,
}) => {
  const pagesCount = pages.length;

  const handlePrev = () => onPageChange(Math.max(0, currentPageIndex - 1));
  const handleNext = () =>
    onPageChange(Math.min(pagesCount - 1, currentPageIndex + 1));

  const heights = [
    16, 24, 32, 28, 20, 24, 28, 16, 20, 32, 24, 28, 16, 20, 32, 28, 24, 20, 16,
    24, 32, 28, 20, 24,
  ];

  return (
    <div className={CONTAINER_CLASSES}>
      {/* Memory card marquee / showcase */}
      <div className="scroller-showcase-box flex-1 w-full">
        <div className="marquee-wrapper">
          <div
            className="marquee-track"
            style={{ "--marquee-speed": "5s" } as React.CSSProperties}
          >
            {pages.map((page) => (
              <MemoryComponent key={page.id} page={page} />
            ))}
          </div>
        </div>
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

        {/* Waveform progress scrubber */}
        <div className="w-full flex items-center gap-3 mt-2 mb-3">
          <span className="text-[0.85rem] font-bold text-db-muted font-mono min-w-[45px]">
            {pagesCount > 0 ? `P. ${currentPageIndex + 1}` : "P. 0"}
          </span>

          <div className="flex-1 h-9 flex items-center justify-between gap-[3px]">
            {Array.from({ length: 24 }).map((_, idx) => {
              const targetPageIdx =
                pagesCount > 0 ? Math.floor((idx / 24) * pagesCount) : 0;
              const isActive =
                pagesCount > 0 && targetPageIdx <= currentPageIndex;
              const h = heights[idx % heights.length];
              return (
                <div
                  key={idx}
                  className={`flex-1 rounded-sm transition-all duration-200 ${isActive ? "bg-db-text" : "bg-black/10"}`}
                  style={{
                    height: `${h}px`,
                    cursor: pagesCount > 0 ? "pointer" : "default",
                    opacity: pagesCount > 0 ? 1 : 0.3,
                  }}
                  onClick={() => pagesCount > 0 && onPageChange(targetPageIdx)}
                  title={
                    pagesCount > 0
                      ? `Go to Page ${targetPageIdx + 1}`
                      : undefined
                  }
                />
              );
            })}
          </div>

          <span className="text-[0.85rem] font-bold text-db-muted font-mono min-w-[45px] text-right">
            {pagesCount > 0 ? `Total ${pagesCount}` : "P. 0"}
          </span>
        </div>

        {/* Prev / Next buttons */}
        {pagesCount > 1 && (
          <div className="flex justify-center gap-6 mt-2 mb-2">
            <button
              onClick={handlePrev}
              className={NAV_BUTTON_CLASSES}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNext}
              className={NAV_BUTTON_CLASSES}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* Hint */}
        <p className="text-[0.85rem] text-db-muted text-center italic mt-2">
          {pagesCount > 0
            ? "Click the waveform bars to scrub through pages!"
            : "No pages available in this memory book."}
        </p>
      </div>
    </div>
  );
};
