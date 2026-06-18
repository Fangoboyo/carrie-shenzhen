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

  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const activeTweenRef = useRef<gsap.core.Tween | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rotationRef = useRef(0);

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

    // Repeat books to form a full circle with at least 6 books
    let repeated = [...resolved];
    if (resolved.length > 0) {
      while (repeated.length < 6) {
        repeated = [...repeated, ...resolved];
      }
    }
    return repeated;
  }, [inputBooks, inputPages]);

  const N = displayBooks.length;
  const theta = N > 0 ? 360 / N : 0;
  
  // Calculate dynamic radius based on the number of books in the circle
  const radius =
    N > 0
      ? Math.max(240, Math.round(260 / (2 * Math.tan(Math.PI / N)) + 70))
      : 300;

  const handleBookClick = (id: string) => {
    if (onBookClick) onBookClick(id);
    else navigate(`/board/${id}`);
  };

  // Helper to resume the infinite marquee rotation
  const resumeAutoRotation = () => {
    if (!trackRef.current) return;

    if (activeTweenRef.current) activeTweenRef.current.kill();
    if (tweenRef.current) tweenRef.current.kill();

    const currentAngle = rotationRef.current;

    tweenRef.current = gsap.to(trackRef.current, {
      rotateY: currentAngle + 360,
      duration: 35,
      repeat: -1,
      ease: "none",
      onUpdate: () => {
        rotationRef.current = gsap.getProperty(
          trackRef.current,
          "rotateY",
        ) as number;
      },
    });
  };

  // Helper to rotate the shelf to center a specific book index
  const rotateToBook = (index: number) => {
    if (!trackRef.current || N === 0) return;

    const targetBaseAngle = -index * theta; // angle to center this index at the front

    // Find the nearest equivalent angle to avoid long wraps
    const currentAngle = rotationRef.current;
    const k = Math.round((currentAngle - targetBaseAngle) / 360);
    const targetAngle = targetBaseAngle + 360 * k;

    // Pause infinite spin
    if (tweenRef.current) tweenRef.current.pause();

    // Kill any active transition tween
    if (activeTweenRef.current) activeTweenRef.current.kill();

    // Clear any pending timeout
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    activeTweenRef.current = gsap.to(trackRef.current, {
      rotateY: targetAngle,
      duration: 1.25,
      ease: "power2.out",
      onUpdate: () => {
        rotationRef.current = gsap.getProperty(
          trackRef.current,
          "rotateY",
        ) as number;
      },
      onComplete: () => {
        // Resume rotation after 3.5 seconds if the user is not hovering
        timeoutRef.current = setTimeout(() => {
          if (hoveredIndex === null) {
            resumeAutoRotation();
          }
        }, 3500);
      },
    });
  };

  // 1. Setup infinite spin initially when N changes
  useEffect(() => {
    if (!trackRef.current || N === 0) return;

    // If there is no active transition running, start/restart the infinite marquee
    if (!activeTweenRef.current) {
      resumeAutoRotation();
    }

    return () => {
      if (tweenRef.current) tweenRef.current.kill();
    };
  }, [N]);

  // 2. Center and pause on the selected book when selectedBookId changes
  useEffect(() => {
    if (!selectedBookId || N === 0) return;
    if (hoveredIndex !== null) return; // don't override active user manual hover

    // Find all indices of the selected book in the repeated array
    const matchingIndices: number[] = [];
    displayBooks.forEach((book, idx) => {
      if (book.id === selectedBookId) {
        matchingIndices.push(idx);
      }
    });

    if (matchingIndices.length === 0) return;

    // Choose the index closest to the current rotation
    let bestIndex = matchingIndices[0];
    let minDifference = Infinity;
    const currentAngle = rotationRef.current;

    matchingIndices.forEach((idx) => {
      const targetBaseAngle = -idx * theta;
      const k = Math.round((currentAngle - targetBaseAngle) / 360);
      const targetAngle = targetBaseAngle + 360 * k;
      const difference = Math.abs(currentAngle - targetAngle);
      if (difference < minDifference) {
        minDifference = difference;
        bestIndex = idx;
      }
    });

    rotateToBook(bestIndex);
  }, [selectedBookId, N]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (activeTweenRef.current) activeTweenRef.current.kill();
      if (tweenRef.current) tweenRef.current.kill();
    };
  }, []);

  const handleBookHoverStart = (index: number) => {
    if (!trackRef.current) return;

    const netAngle = index * theta + rotationRef.current;
    const radians = (netAngle * Math.PI) / 180;

    // Math.cos(radians) > 0 means front side, < 0 means back side
    const isAtBackOfShelf = Math.cos(radians) < 0;
    if (isAtBackOfShelf) {
      console.log("Hovered from the back of the shelf (facing away)");
      return;
    }

    setHoveredIndex(index);

    // Pause infinite spin
    if (tweenRef.current) tweenRef.current.pause();

    // Kill transition tween & clear timeout
    if (activeTweenRef.current) activeTweenRef.current.kill();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const targetBaseAngle = -index * theta; // angle to center this index at the front

    // Find the nearest equivalent angle to avoid long wraps
    const currentAngle = rotationRef.current;
    const k = Math.round((currentAngle - targetBaseAngle) / 360);
    const targetAngle = targetBaseAngle + 360 * k;

    activeTweenRef.current = gsap.to(trackRef.current, {
      rotateY: targetAngle,
      duration: 1.25,
      ease: "power2.out",
      overwrite: "auto",
      onUpdate: () => {
        rotationRef.current = gsap.getProperty(
          trackRef.current,
          "rotateY",
        ) as number;
      },
    });
  };

  const handleBookHoverEnd = () => {
    if (!trackRef.current) return;
    if (hoveredIndex === null) return;

    setHoveredIndex(null);
    resumeAutoRotation();
  };

  const placeholder = (message: string) => (
    <div className="scroller-showcase-box flex items-center justify-center h-full font-hand text-[1.5rem] text-db-muted">
      <span>{message}</span>
    </div>
  );

  if (inputBooks.length === 0) return placeholder("No books on the shelf yet.");

  return (
    <div className="scroller-showcase-box book-shelf-scroller flex items-center justify-center min-h-[500px]">
      <div className="carousel-container">
        <div
          ref={trackRef}
          className={`carousel-track ${hoveredIndex !== null ? "has-hovered-item" : ""}`}
        >
          {displayBooks.map((book, idx) => {
            const isItemHovered = hoveredIndex === idx;
            const isSelected = book.id === selectedBookId;
            return (
              <div
                key={`${book.id}-${idx}`}
                className={`carousel-item ${isItemHovered ? "is-hovered" : ""} ${isSelected ? "is-selected" : ""}`}
                style={{
                  transform: `rotateY(${idx * theta}deg) translateZ(${radius}px)`,
                }}
                onMouseEnter={() => handleBookHoverStart(idx)}
                onMouseLeave={handleBookHoverEnd}
              >
                <BookComponent
                  title={book.title}
                  subtitle={book.subtitle}
                  coverUrl={book.coverUrl}
                  pages={book.pagesData}
                  coverColor={book.coverColor}
                  accentColor={book.accentColor}
                  onClick={() => handleBookClick(book.id)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
