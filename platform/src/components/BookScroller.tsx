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
  const [isDragging, setIsDragging] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const bookElementsRef = useRef<(HTMLDivElement | null)[]>([]);

  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const activeTweenRef = useRef<gsap.core.Tween | null>(null);
  const autoHoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const translationRef = useRef(0);
  const lastPausedIndexRef = useRef<number | null>(null);

  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startTranslationRef = useRef(0);
  const hasDraggedRef = useRef(false);

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
    if (!trackRef.current || resolvedBooksCount === 0 || isDraggingRef.current) return;

    if (resolvedBooksCount === 1) {
      // Just center and open the only book, no scrolling needed
      gsap.set(trackRef.current, { x: 0 });
      translationRef.current = 0;
      updateBookPositions();
      setActiveIndex(0);
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
    if (isDraggingRef.current) return; // Don't auto-hover while dragging
    if (activeIndex !== null) return; // Already in a pause/open state

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

    setActiveIndex(vIdx);

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
          setActiveIndex(null);

          // Wait for the close animation to complete (approx 1.2s) before resuming scroll
          autoHoverTimeoutRef.current = setTimeout(() => {
            lastPausedIndexRef.current = null;
            resumeAutoScroll();
          }, 1200);
        }, 4000);
      },
    });
  };

  const scheduleAutoScrollResume = () => {
    if (autoHoverTimeoutRef.current) clearTimeout(autoHoverTimeoutRef.current);
    autoHoverTimeoutRef.current = setTimeout(() => {
      setActiveIndex(null);

      // Wait for the close animation to complete (approx 1.2s) before resuming scroll
      autoHoverTimeoutRef.current = setTimeout(() => {
        lastPausedIndexRef.current = null;
        resumeAutoScroll();
      }, 1200);
    }, 4000);
  };

  const snapToNearestBook = () => {
    if (!trackRef.current || resolvedBooksCount === 0) return;

    const currentX = translationRef.current;
    const closestVIdx = Math.round(-currentX / 320);
    const targetX = -closestVIdx * 320;

    if (activeTweenRef.current) activeTweenRef.current.kill();
    if (tweenRef.current) tweenRef.current.kill();

    activeTweenRef.current = gsap.to(trackRef.current, {
      x: targetX,
      duration: 0.5,
      ease: "power2.out",
      onUpdate: () => {
        translationRef.current = gsap.getProperty(trackRef.current, "x") as number;
        updateBookPositions();
      },
      onComplete: () => {
        setActiveIndex(closestVIdx);
        lastPausedIndexRef.current = closestVIdx;
        scheduleAutoScrollResume();
      },
    });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;

    isDraggingRef.current = true;
    setIsDragging(true);
    hasDraggedRef.current = false;
    startXRef.current = e.clientX;
    startTranslationRef.current = translationRef.current;

    // Pause animations immediately
    if (tweenRef.current) tweenRef.current.pause();
    if (activeTweenRef.current) activeTweenRef.current.kill();
    if (autoHoverTimeoutRef.current) {
      clearTimeout(autoHoverTimeoutRef.current);
      autoHoverTimeoutRef.current = null;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    const deltaX = e.clientX - startXRef.current;
    if (Math.abs(deltaX) > 5 && !hasDraggedRef.current) {
      hasDraggedRef.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }

    if (hasDraggedRef.current) {
      let targetX = startTranslationRef.current + deltaX;

      if (resolvedBooksCount > 1) {
        if (targetX > 0) {
          targetX -= loopWidth;
          startXRef.current += loopWidth;
          startTranslationRef.current -= loopWidth;
        } else if (targetX < -loopWidth) {
          targetX += loopWidth;
          startXRef.current -= loopWidth;
          startTranslationRef.current += loopWidth;
        }
      }

      if (trackRef.current) {
        gsap.set(trackRef.current, { x: targetX });
      }
      translationRef.current = targetX;
      updateBookPositions();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);

    if (hasDraggedRef.current) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      snapToNearestBook();
    } else {
      // Just a click, let's snap anyway to be safe or resume auto scroll
      snapToNearestBook();
    }
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
      setActiveIndex(targetVirtualIndex);
      lastPausedIndexRef.current = targetVirtualIndex;
      scheduleAutoScrollResume();
    }, 150);

    return () => {
      clearTimeout(timer);
      if (tweenRef.current) tweenRef.current.kill();
    };
  }, [displayBooks]);

  // Center and auto-hover selected book on change
  useEffect(() => {
    if (!selectedBookId || displayBooks.length === 0) return;
    if (isDraggingRef.current) return;

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

  const handleBookClick = (id: string, vIdx: number) => {
    if (activeIndex === vIdx) {
      if (onBookClick) onBookClick(id);
      else navigate(`/board/${id}`);
    } else {
      setActiveIndex(vIdx);
      lastPausedIndexRef.current = vIdx;

      if (tweenRef.current) tweenRef.current.pause();
      if (activeTweenRef.current) activeTweenRef.current.kill();
      if (autoHoverTimeoutRef.current) clearTimeout(autoHoverTimeoutRef.current);

      activeTweenRef.current = gsap.to(trackRef.current, {
        x: -vIdx * 320,
        duration: 0.6,
        ease: "power2.out",
        onUpdate: () => {
          translationRef.current = gsap.getProperty(trackRef.current, "x") as number;
          updateBookPositions();
        },
        onComplete: () => {
          scheduleAutoScrollResume();
        },
      });
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
      <div
        ref={containerRef}
        className={`carousel-container ${isDragging ? "dragging" : ""}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          ref={trackRef}
          className={`carousel-track ${
            activeIndex !== null ? "has-active-item" : ""
          }`}
        >
          {displayBooks.map((book, idx) => {
            const isBookOpen = activeIndex === book.virtualIndex;
            const isSelected = book.id === selectedBookId;

            return (
              <div
                key={`${book.id}-${book.virtualIndex}`}
                ref={(el) => {
                  bookElementsRef.current[idx] = el;
                }}
                className={`carousel-item ${isBookOpen ? "is-active" : ""} ${
                  isSelected ? "is-selected" : ""
                }`}
                style={{
                  position: "absolute",
                  left: `${book.virtualIndex * 320}px`,
                }}
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
                  disableHover={true}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
