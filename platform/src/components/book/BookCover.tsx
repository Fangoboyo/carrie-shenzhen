import React from "react";

interface BookCoverProps {
  coverRef: React.RefObject<HTMLDivElement | null>;
  displayCoverUrl?: string;
  displayTitle: string;
  displaySubtitle?: string;
}

/** The front 3-D cover panel that swings open on hover. */
export const BookCover: React.FC<BookCoverProps> = ({
  coverRef,
  displayCoverUrl,
  displayTitle,
  displaySubtitle,
}) => (
  <div
    ref={coverRef}
    className="book-cover"
    style={{
      transformOrigin: "left center",
      zIndex: 10,
      backgroundImage: displayCoverUrl
        ? `linear-gradient(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.35)), url(${displayCoverUrl})`
        : undefined,
      backgroundSize: "cover",
      backgroundPosition: "center 25%",
    }}
  >
    {displayCoverUrl ? (
      <div className="book-title-badge">
        <h4 className="book-title">{displayTitle}</h4>
        {displaySubtitle && <div className="book-subtitle">{displaySubtitle}</div>}
      </div>
    ) : (
      <>
        <h4 className="book-title">{displayTitle}</h4>
        {displaySubtitle && <div className="book-subtitle">{displaySubtitle}</div>}
      </>
    )}
  </div>
);
