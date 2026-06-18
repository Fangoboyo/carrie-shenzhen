import React from "react";
import { BookOpen, Play } from "lucide-react";
import type { PageRecord } from "../../types/BookComponentTypes";

interface PagelistSectionProps {
  filteredPages: PageRecord[];
  onPlay: (youtubeId: string) => void;
}

export const PageListSection: React.FC<PagelistSectionProps> = ({
  filteredPages,
  onPlay,
}) => {
  return (
    <div className="h-[260px] flex-none flex flex-col gap-3 overflow-hidden">
      <h3 className="font-hand text-[1.8rem] m-0 text-db-text">
        Favorite Memories ({filteredPages.length})
      </h3>

      <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-1.5 scrollbar-hide">
        {filteredPages.map((page, idx) => (
          <div
            key={page.id}
            className="bg-db-card border-[1.5px] border-db-border rounded-xl px-4 py-2.5 flex items-center justify-between cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_10px_rgba(0,0,0,0.06)] hover:border-db-text"
            onClick={() => onPlay(page.youtubeId)}
          >
            {/* Left: thumb + details */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-[#dde0e4] overflow-hidden flex items-center justify-center flex-shrink-0">
                <img
                  src={`https://img.youtube.com/vi/${page.youtubeId}/0.jpg`}
                  alt={page.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                />
                <BookOpen size={16} className="text-db-muted" />
              </div>

              <div className="flex flex-col">
                <span className="font-bold text-[0.95rem] text-db-text font-sans">{page.title}</span>
                <span className="text-[0.8rem] text-db-muted font-sans">
                  Page {idx + 1} • Linked to YouTube
                </span>
              </div>
            </div>

            {/* Play button */}
            <button
              className="bg-transparent border-[1.5px] border-db-border text-db-text rounded-full w-8 h-8 flex items-center justify-center cursor-pointer transition-all duration-200 hover:border-db-text hover:bg-db-text hover:text-white hover:scale-110"
              title="Play Moment"
            >
              <Play size={14} fill="currentColor" style={{ marginLeft: "1px" }} />
            </button>
          </div>
        ))}

        {filteredPages.length === 0 && (
          <div className="text-center py-10 font-hand text-[1.4rem] text-db-muted">
            No active moments found...
          </div>
        )}
      </div>
    </div>
  );
};
