import React from "react";
import { BookComponentMarquee } from "../BookScroller";
import type { BookRecord, PageRecord } from "../../types/BookComponentTypes";

interface MemoryShelfProps {
  books: BookRecord[];
  pages: PageRecord[];
  selectedBookId: string | null;
  onBookClick?: (bookId: string) => void;
}

export const MemoryShelf: React.FC<MemoryShelfProps> = ({
  books,
  pages,
  selectedBookId,
  onBookClick,
}) => {
  return (
    <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-hidden">
      <div className="flex items-center justify-between">
        <h3 className="font-hand text-[2.2rem] m-0 text-db-text">Memory Shelf</h3>
      </div>

      {/* Scale down the 3D book marquee to fit the dashboard column */}
      <div
        style={{
          transform: "scale(0.75)",
          transformOrigin: "top left",
          width: "131%",
          height: "600px",
          marginTop: "-15px",
        }}
      >
        <BookComponentMarquee
          books={books}
          pages={pages}
          selectedBookId={selectedBookId}
          onBookClick={onBookClick}
        />
      </div>
    </div>
  );
};
