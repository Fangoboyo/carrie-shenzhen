import React from "react";
import { Play, X } from "lucide-react";
import type { PageRecord } from "../../types/BookComponentTypes";

interface MemoryComponentProps {
  page?: PageRecord | null;
  pageRefs?: React.RefObject<Array<HTMLDivElement | null>>;
  contentRefs?: React.RefObject<Array<HTMLDivElement | null>>;
  isExpanded?: boolean;
  onPlayClick?: () => void;
  onCloseClick?: () => void;
}

export const MemoryComponent: React.FC<MemoryComponentProps> = ({
  page,
  isExpanded = false,
  onPlayClick,
  onCloseClick,
}) => {
  if (!page) {
    return (
      <div className="w-[300px] h-[380px] relative p-4 box-border flex flex-col items-center justify-center gap-1.5 text-center bg-white/25 border-[1.5px] border-dashed border-db-border rounded-[10px] flex-shrink-0">
        {/* Corner tapes */}
        <div className="absolute top-2 left-2 w-14 h-3.5 bg-[rgba(230,215,190,0.5)] border-x border-dashed border-black/7 shadow-sm pointer-events-none -rotate-[20deg]" />
        <div className="absolute top-2 right-2 w-14 h-3.5 bg-[rgba(230,215,190,0.5)] border-x border-dashed border-black/7 shadow-sm pointer-events-none rotate-[20deg]" />
        <span className="text-[2.4rem] opacity-35">📷</span>
        <p className="m-0 font-hand text-[1.5rem] text-db-muted">
          No memory selected.
        </p>
        <p className="m-0 text-[0.9rem] opacity-65 text-db-muted">
          Pick a book from the shelf!
        </p>
      </div>
    );
  }

  return (
    <div className={`w-[300px] h-[380px] relative p-4 box-border flex flex-col flex-shrink-0 transition-all duration-300 ${isExpanded ? "scale-105" : ""}`}>
      {/* Top centre tape */}
      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 -rotate-[2deg] w-[72px] h-5 bg-[rgba(230,215,190,0.55)] border-x border-dashed border-black/8 shadow-sm z-[6] pointer-events-none" />
      {/* Corner tapes */}
      <div className="absolute top-1.5 left-1 w-[54px] h-4 bg-[rgba(230,215,190,0.55)] border-x border-dashed border-black/8 shadow-sm z-[6] pointer-events-none -rotate-[38deg] origin-left" />
      <div className="absolute top-1.5 right-1 w-[54px] h-4 bg-[rgba(230,215,190,0.55)] border-x border-dashed border-black/8 shadow-sm z-[6] pointer-events-none rotate-[38deg] origin-right" />

      {/* Polaroid frame */}
      <div className="bg-[#fffdf8] rounded-[4px] px-2.5 pt-2.5 pb-5 flex flex-col h-full box-border shadow-[0_4px_10px_rgba(0,0,0,0.13),0_1px_3px_rgba(0,0,0,0.08),inset_0_0_0_1px_rgba(0,0,0,0.04)] relative">
        {/* Sticker badge */}
        <div className="absolute -top-2.5 -right-2.5 w-7 h-7 bg-db-accent text-white rounded-full flex items-center justify-center text-[0.75rem] font-bold shadow-[0_2px_6px_rgba(190,74,42,0.35)] z-[7] rotate-[15deg] pointer-events-none">
          ✦
        </div>

        {/* Video / photo area */}
        <div className="flex-1 bg-[#111] rounded-[3px] overflow-hidden flex items-center justify-center relative min-h-[180px] border border-black/12 group">
          {page.youtubeId ? (
            isExpanded ? (
              <>
                <iframe
                  className="absolute top-0 left-0 w-full h-full border-none"
                  src={`https://www.youtube.com/embed/${page.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                  title={page.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                {/* Close Button overlay */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onCloseClick) onCloseClick();
                  }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center border border-white/20 transition-all cursor-pointer z-50 hover:scale-105"
                  title="Close Video"
                >
                  <X size={16} />
                </button>
              </>
            ) : (
              <div 
                className="w-full h-full cursor-pointer relative"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onPlayClick) onPlayClick();
                }}
              >
                <img
                  src={`https://img.youtube.com/vi/${page.youtubeId}/0.jpg`}
                  alt={page.title}
                  className="w-full h-full object-cover"
                />
                {/* Dark overlay on hover */}
                <div className="absolute inset-0 bg-black/25 opacity-40 group-hover:opacity-60 transition-opacity duration-200" />
                
                {/* Play Button Icon */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-db-accent/90 text-white flex items-center justify-center shadow-lg border border-white/20 group-hover:bg-db-accent group-hover:scale-110 transition-all duration-300">
                  <Play size={20} fill="currentColor" className="ml-1 text-white" />
                </div>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-[#666] text-[0.8rem] italic">
              <span className="text-[1.8rem] opacity-50">🎞️</span>
              <span>No video yet</span>
            </div>
          )}
        </div>

        {/* Handwritten caption */}
        <div className="mt-3 text-center min-h-[40px] flex flex-col items-center justify-center gap-0.5 px-1">
          <h3 className="m-0 font-hand text-[1.6rem] text-[#3d2a1b] leading-tight break-words">
            {page.title}
          </h3>
          {page.description && (
            <p className="m-0 font-script text-[0.95rem] text-db-muted leading-snug opacity-85">
              {page.description}
            </p>
          )}
        </div>

        {/* Corner peel */}
        <div
          className="absolute bottom-3 right-3 w-[18px] h-[18px] pointer-events-none z-[4]"
          style={{
            background:
              "linear-gradient(135deg, transparent 50%, rgba(190,74,42,0.18) 50%)",
          }}
        />
      </div>
    </div>
  );
};
