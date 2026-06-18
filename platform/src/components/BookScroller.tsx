import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { pb } from "../lib/pocketbase";
import "../styles/book3d.css";
import "../styles/animations.css";
import type {
  BookRecord,
  PageRecord,
  PageComponentProps,
} from "../types/BookComponentTypes";
import { BookComponent } from "./BookComponent";

const COVER_COLORS = [
  "#4a2f1b",
  "#2b4c7e",
  "#c85a17",
  "#3a6b5c",
  "#5c3a21",
  "#1a331e",
];
const ACCENT_COLORS = [
  "#d4af37",
  "#ffd700",
  "#4f9d9d",
  "#e0a96d",
  "#ecc19c",
  "#8fbc8f",
];

interface BookWithPages extends BookRecord {
  coverUrl: string;
  pagesData: PageComponentProps[];
  coverColor: string;
  accentColor: string;
  virtualIndex: number;
}

interface BookComponentMarqueeProps {
  books: BookRecord[];
  pages: PageRecord[];
  selectedBookId: string | null;
  onBookClick?: (bookId: string) => void;
}

export const BookComponentMarquee: React.FC<BookComponentMarqueeProps> = ({
  books: inputBooks,
  pages: inputPages,
  selectedBookId,
  onBookClick,
}) => {
  const navigate = useNavigate();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [autoHoveredIndex, setAutoHoveredIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const bookElementsRef = useRef<(HTMLDivElement | null)[]>([]);

  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const activeTweenRef = useRef<gsap.core.Tween | null>(null);
  const autoHoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const translationRef = useRef(0);
  const lastPausedIndexRef = useRef<number | null>(null);

  // Synchronously map books and pages from props
  const displayBooks = React.useMemo<BookWithPages[]>(() => {
    const resolved = inputBooks.map((book, index) => {
      const bookPages = inputPages
        .filter((p) => p.book === book.id)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      const pagesData: PageComponentProps[] = bookPages.map((page) => ({
        title: page.title,
        content: page.youtubeId
          ? `https://www.youtube.com/watch?v=${page.youtubeId}`
          : "No video attached",
        thumbnailUrl: page.youtubeId
          ? `https://img.youtube.com/vi/${page.youtubeId}/0.jpg`
          : "",
      }));

      const coverUrl = book.cover ? pb.files.getUrl(book, book.cover) : "";

      return {
        ...book,
        coverUrl,
        pagesData,
        coverColor: COVER_COLORS[index % COVER_COLORS.length],
        accentColor: ACCENT_COLORS[index % ACCENT_COLORS.length],
      };
    });

    if (resolved.length === 0) return [];

    const M = resolved.length;
    const padCount = Math.max(6, M); // Pad at least 6 books on each side for safety
    const list: BookWithPages[] = [];

    // Populate list from index -padCount to M + padCount
    for (let idx = -padCount; idx < M + padCount; idx++) {
      const originalIndex = ((idx % M) + M) % M;
      list.push({
        ...resolved[originalIndex],
        virtualIndex: idx,
      });
    }
    return list;
  }, [inputBooks, inputPages]);

  const resolvedBooksCount = inputBooks.length;
  const loopWidth = resolvedBooksCount * 320;

  // Keep the size of the elements ref array synced with books count
  useEffect(() => {
    bookElementsRef.current = bookElementsRef.current.slice(0, displayBooks.length);
  }, [displayBooks]);

  // Update book scales, Z translation, rotations, and z-indices based on position relative to center
  const updateBookPositions = () => {
    const track = trackRef.current;
    const container = containerRef.current;
    if (!track || !container) return;

    const x = gsap.getProperty(track, "x") as number || 0;
    translationRef.current = x;

    const containerWidth = container.clientWidth;
    const containerCenter = containerWidth / 2;

    bookElementsRef.current.forEach((el, idx) => {
      if (!el) return;

      const book = displayBooks[idx];
      if (!book) return;

      const vIdx = book.virtualIndex;

      // Visual center of book idx relative to container
      const bookCenterInContainer = containerCenter + x + vIdx * 320;

      // Distance from container center
      const distance = Math.abs(containerCenter - bookCenterInContainer);
      const maxDistance = containerWidth / 1.5;
      const factor = Math.max(0, 1 - distance / maxDistance);

      // Scale: 1.0 to 1.25
      const scale = 1 + factor * 0.25;
      // translateZ: 0 to 120px
      const translateZ = factor * 120;
      // rotateY facing the center
      const direction = bookCenterInContainer < containerCenter ? 1 : -1;
      const maxRotateY = 20;
      const rotateY = direction * (1 - factor) * maxRotateY;

      // zIndex: center is on top
      const zIndex = Math.round(factor * 100);

      el.style.transform = `translate3d(0, 0, ${translateZ}px) scale(${scale}) rotateY(${rotateY}deg)`;
      el.style.zIndex = `${zIndex}`;
    });
  };

  // Helper to resume the infinite marquee scroll
  const resumeAutoScroll = () => {
    if (!trackRef.current || resolvedBooksCount === 0) return;

    if (resolvedBooksCount === 1) {
      // Just center and open the only book, no scrolling needed
      gsap.set(trackRef.current, { x: 0 });
      translationRef.current = 0;
      updateBookPositions();
      setAutoHoveredIndex(0);
      return;
    }

    if (activeTweenRef.current) activeTweenRef.current.kill();
    if (tweenRef.current) tweenRef.current.kill();

    const currentX = translationRef.current;
    const speed = 40; // pixels per second
    const remainingDistance = Math.abs(-loopWidth - currentX);

    tweenRef.current = gsap.to(trackRef.current, {
      x: -loopWidth,
      duration: remainingDistance / speed,
      ease: "none",
      onUpdate: () => {
        const x = gsap.getProperty(trackRef.current, "x") as number;
        translationRef.current = x;
        updateBookPositions();
        checkAutoHover(x);
      },
      onComplete: () => {
        // Reset x to 0 and loop again
        gsap.set(trackRef.current, { x: 0 });
        translationRef.current = 0;
        lastPausedIndexRef.current = null;
        resumeAutoScroll();
      },
    });
  };

  // Monitor positions and pause/hover a book when it reaches the middle
  const checkAutoHover = (x: number) => {
    if (hoveredIndex !== null) return; // Don't auto-hover if user is manually hovering
    if (autoHoveredIndex !== null) return; // Already in a pause/open state

    const container = containerRef.current;
    if (!container) return;
    const containerWidth = container.clientWidth;
    const containerCenter = containerWidth / 2;

    for (let i = 0; i < displayBooks.length; i++) {
      const book = displayBooks[i];
      const vIdx = book.virtualIndex;
      const bookCenter = containerCenter + x + vIdx * 320;
      const distance = Math.abs(containerCenter - bookCenter);

      if (distance < 15 && lastPausedIndexRef.current !== vIdx) {
        triggerAutoHover(vIdx);
        break;
      }
    }
  };

  const triggerAutoHover = (vIdx: number) => {
    if (tweenRef.current) tweenRef.current.pause();
    if (activeTweenRef.current) activeTweenRef.current.kill();
    if (autoHoverTimeoutRef.current) clearTimeout(autoHoverTimeoutRef.current);

    lastPausedIndexRef.current = vIdx;

    const container = containerRef.current;
    if (!container) return;

    const targetX = -vIdx * 320;

    setAutoHoveredIndex(vIdx);

    activeTweenRef.current = gsap.to(trackRef.current, {
      x: targetX,
      duration: 0.8,
      ease: "power2.out",
      onUpdate: () => {
        translationRef.current = gsap.getProperty(trackRef.current, "x") as number;
        updateBookPositions();
      },
      onComplete: () => {
        // Keep the book open for 4 seconds, then close it and resume
        autoHoverTimeoutRef.current = setTimeout(() => {
          setAutoHoveredIndex(null);

          // Wait for the close animation to complete (approx 1.2s) before resuming scroll
          autoHoverTimeoutRef.current = setTimeout(() => {
            lastPausedIndexRef.current = null;
            resumeAutoScroll();
          }, 1200);
        }, 4000);
      },
    });
  };

  // Setup scroll event listener and resize updates
  useEffect(() => {
    const container = containerRef.current;
    if (!container || displayBooks.length === 0) return;

    const handleResize = () => {
      updateBookPositions();
    };
    window.addEventListener("resize", handleResize);

    const resizeObserver = new ResizeObserver(() => {
      updateBookPositions();
    });
    resizeObserver.observe(container);

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
    };
  }, [displayBooks]);

  // Setup initial scroll marquee state and trigger hover on the first/selected book
  useEffect(() => {
    if (!trackRef.current || displayBooks.length === 0) return;

    const initialBook = selectedBookId
      ? displayBooks.find((b) => b.id === selectedBookId && b.virtualIndex >= 0)
      : null;
    const targetVirtualIndex = initialBook ? initialBook.virtualIndex : 0;

    // Position track instantly at start to prevent layout flash/jump
    gsap.set(trackRef.current, { x: -targetVirtualIndex * 320 });
    translationRef.current = -targetVirtualIndex * 320;
    updateBookPositions();

    const timer = setTimeout(() => {
      triggerAutoHover(targetVirtualIndex);
    }, 150);

    return () => {
      clearTimeout(timer);
      if (tweenRef.current) tweenRef.current.kill();
    };
  }, [displayBooks]);

  // Center and auto-hover selected book on change
  useEffect(() => {
    if (!selectedBookId || displayBooks.length === 0) return;
    if (hoveredIndex !== null) return; // Don't override active user manual hover

    const matchingIndices: number[] = [];
    displayBooks.forEach((book) => {
      if (book.id === selectedBookId) {
        matchingIndices.push(book.virtualIndex);
      }
    });

    if (matchingIndices.length === 0) return;

    let bestIndex = matchingIndices[0];
    let minDifference = Infinity;
    const currentX = translationRef.current;

    matchingIndices.forEach((vIdx) => {
      const targetBaseX = -vIdx * 320;
      const k = Math.round((currentX - targetBaseX) / loopWidth);
      const targetX = targetBaseX + k * loopWidth;
      const difference = Math.abs(currentX - targetX);
      if (difference < minDifference) {
        minDifference = difference;
        bestIndex = vIdx;
      }
    });

    triggerAutoHover(bestIndex);
  }, [selectedBookId, displayBooks]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoHoverTimeoutRef.current) clearTimeout(autoHoverTimeoutRef.current);
      if (activeTweenRef.current) activeTweenRef.current.kill();
      if (tweenRef.current) tweenRef.current.kill();
    };
  }, []);

  const handleBookHoverStart = (vIdx: number) => {
    if (!trackRef.current) return;

    setHoveredIndex(vIdx);
    setAutoHoveredIndex(null); // Clear auto hover if user takes manual control

    if (tweenRef.current) tweenRef.current.pause();
    if (activeTweenRef.current) activeTweenRef.current.kill();
    if (autoHoverTimeoutRef.current) clearTimeout(autoHoverTimeoutRef.current);

    const targetBaseX = -vIdx * 320;
    const currentX = translationRef.current;
    const k = Math.round((currentX - targetBaseX) / loopWidth);
    const targetX = targetBaseX + k * loopWidth;

    activeTweenRef.current = gsap.to(trackRef.current, {
      x: targetX,
      duration: 1.25,
      ease: "power2.out",
      overwrite: "auto",
      onUpdate: () => {
        translationRef.current = gsap.getProperty(trackRef.current, "x") as number;
        updateBookPositions();
      },
    });
  };

  const handleBookHoverEnd = () => {
    if (!trackRef.current) return;
    if (hoveredIndex === null) return;

    setHoveredIndex(null);

    if (autoHoverTimeoutRef.current) clearTimeout(autoHoverTimeoutRef.current);
    autoHoverTimeoutRef.current = setTimeout(() => {
      resumeAutoScroll();
    }, 1000);
  };

  const handleBookClick = (id: string, vIdx: number) => {
    if (autoHoveredIndex === vIdx || hoveredIndex === vIdx) {
      if (onBookClick) onBookClick(id);
      else navigate(`/board/${id}`);
    } else {
      triggerAutoHover(vIdx);
    }
  };

  const placeholder = (message: string) => (
    <div className="scroller-showcase-box flex items-center justify-center h-full font-hand text-[1.5rem] text-db-muted">
      <span>{message}</span>
    </div>
  );

  if (inputBooks.length === 0) return placeholder("No books on the shelf yet.");

  return (
    <div className="scroller-showcase-box book-shelf-scroller flex items-center justify-center min-h-[500px]">
      <div ref={containerRef} className="carousel-container">
        <div
          ref={trackRef}
          className={`carousel-track ${
            hoveredIndex !== null || autoHoveredIndex !== null ? "has-hovered-item" : ""
          }`}
        >
          {displayBooks.map((book, idx) => {
            const isItemHovered = hoveredIndex === book.virtualIndex;
            const isAutoHovered = autoHoveredIndex === book.virtualIndex;
            const isSelected = book.id === selectedBookId;
            const isBookOpen = isItemHovered || isAutoHovered;

            return (
              <div
                key={`${book.id}-${book.virtualIndex}`}
                ref={(el) => {
                  bookElementsRef.current[idx] = el;
                }}
                className={`carousel-item ${isItemHovered ? "is-hovered" : ""} ${
                  isSelected ? "is-selected" : ""
                }`}
                style={{
                  position: "absolute",
                  left: `${book.virtualIndex * 320}px`,
                }}
                onMouseEnter={() => handleBookHoverStart(book.virtualIndex)}
                onMouseLeave={handleBookHoverEnd}
              >
                <BookComponent
                  title={book.title}
                  subtitle={book.subtitle}
                  coverUrl={book.coverUrl}
                  pages={book.pagesData}
                  coverColor={book.coverColor}
                  accentColor={book.accentColor}
                  onClick={() => handleBookClick(book.id, book.virtualIndex)}
                  isOpen={isBookOpen}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
