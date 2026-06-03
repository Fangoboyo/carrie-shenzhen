import React, { useRef, useEffect, useCallback } from "react";
import gsap from "gsap";
import "../styles/BookComponent.css";
import marx from "../assets/marx.png";

import type {
  BookComponentProps,
  BookRecord,
} from "../types/BookComponentTypes";
import { pb } from "../lib/pocketbase";

// ─── Animation constants ────────────────────────────────────────────────────

const OPEN_DURATION = 2.5; // seconds — matches cover/page open transition
const LOOP_DURATION = 3.25; // seconds — full cycle per page in the infinite loop
const EASE = "power2.inOut";

// ─── Page resting positions (stacked fan effect) ─────────────────────────────

const PAGE_REST = [
  { rotateY: -4, z: 0 },
  { rotateY: -3, z: 1 },
  { rotateY: -2, z: 2 },
  { rotateY: -1, z: 3 },
];

// Static right-side page on hover: always visible as the "current reading page"
const PAGE_STATIC_OPEN = { rotateY: -1, z: 1 };

// ─── Infinite page-turn loop keyframes ───────────────────────────────────────
//
//  Symmetric timing model from AI_MEMORY.md (fraction of LOOP_DURATION):
//    0.00 – 0.10 : Page rests on the right (rotateY: 0, opacity: 1)
//    0.10 – 0.50 : THE FLIP — rotateY sweeps 0 → -150 (easeInOut)
//    0.50 – 0.80 : Page rests on the left (rotateY: -150, opacity: 1)
//    0.80 – 0.90 : Fade out (opacity: 1 → 0)
//    0.90 – 0.92 : Snap back to right invisibly (rotateY: 0, opacity: 0)
//    0.92 – 1.00 : Fade in on right (opacity: 0 → 1), ready to loop
//
//  Page 1 runs the same timeline but with a 0.5 × LOOP_DURATION delay = perfect
//  symmetric stagger so one page always occupies each side of the book.
//
const buildPageLoopTl = (el: HTMLElement): gsap.core.Timeline => {
  const d = LOOP_DURATION;
  return (
    gsap
      .timeline({ repeat: -1, repeatDelay: 0 })
      // ── 0.0 – 0.08 : rest on right ─────────────────────────────────────────
      .set(el, { rotateY: 0, opacity: 1, z: 4 })
      // ── 0.08 – 0.48 : THE FLIP ──────────────────────────────────────────────
      .to(el, {
        rotateY: -150,
        z: 4,
        duration: d * 0.4,
        ease: "power2.inOut",
      })
      // ── 0.48 – 0.73 : rest on left ──────────────────────────────────────────
      .to(el, {
        rotateY: -150,
        opacity: 1,
        z: 2,
        duration: d * 0.35,
        ease: "none",
      })
      // ── 0.73 – 0.83 : fade out ──────────────────────────────────────────────
      .to(el, {
        opacity: 0,
        duration: d * 0.1,
        ease: "power2.out",
      })
      // ── 0.83 – 0.85 : snap back invisibly ──────────────────────────────────
      .set(el, { rotateY: 0, z: 0 })
      .to(el, { duration: d * 0.02, ease: "none" }) // micro-hold
      // ── 0.85 – 1.0 : fade in on right ─────────────────────────────────────
      .to(el, {
        opacity: 1,
        z: 4,
        duration: d * 0.15,
        ease: "power2.out",
      })
  );
};

// ─── Component ───────────────────────────────────────────────────────────────

export const BookComponent: React.FC<BookComponentProps> = ({
  title = "High school",
  subtitle = "The book",
  coverUrl,
  pages = [],
  coverColor,
  accentColor,
  onClick,
}) => {
  // For testing: retrieve book data for record "3yzaa4s9jjhwljz"
  const [testBook, setTestBook] = React.useState<BookRecord | null>(null);
  const [testCoverUrl, setTestCoverUrl] = React.useState<string>("");

  useEffect(() => {
    const fetchTestBook = async () => {
      try {
        const record = await pb
          .collection("books")
          .getOne<BookRecord>("3yzaa4s9jjhwljz");
        setTestBook(record);
        if (record.cover) {
          const url = pb.files.getUrl(record, record.cover);
          setTestCoverUrl(url);
        }
      } catch (err) {
        console.warn(
          "Failed to fetch test book 3yzaa4s9jjhwljz, using fallback props.",
          err,
        );
      }
    };
    fetchTestBook();
  }, []);

  const displayTitle = testBook?.title || title;
  const displaySubtitle = testBook?.subtitle || subtitle;
  const displayCoverUrl = testCoverUrl || coverUrl;

  // Refs ─────────────────────────────────────────────────────────────────────
  const bookRef = useRef<HTMLDivElement>(null);
  const ribbonRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Active timelines so we can kill them on hover-end
  // 4 pages: indices 0–3
  const pageTimelines = useRef<(gsap.core.Timeline | null)[]>([
    null,
    null,
    null,
    null,
  ]);

  // ─── Initial state ─────────────────────────────────────────────────────────
  useEffect(() => {
    const bookEl = bookRef.current;
    const coverEl = coverRef.current;
    if (!bookEl || !coverEl) return;

    // Book: idle position
    gsap.set(bookEl, {
      y: 0,
      rotateX: 0,
      rotateY: 0,
      boxShadow:
        "0 4px 10px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2), inset 3px 0 6px rgba(0,0,0,0.4)",
    });

    // Cover: slight 3D tilt resting on pages
    gsap.set(coverEl, { rotateY: -15, z: 4 });

    // Pages: resting fan positions
    pageRefs.current.forEach((el, i) => {
      if (el)
        gsap.set(el, {
          rotateY: PAGE_REST[i].rotateY,
          z: PAGE_REST[i].z,
          opacity: 1,
        });
    });

    // Page content: hidden at rest
    contentRefs.current.forEach((el) => {
      if (el) gsap.set(el, { opacity: 0 });
    });

    // Ribbon: resting
    if (ribbonRef.current) gsap.set(ribbonRef.current, { y: 0, rotate: 0 });
  }, []);

  // ─── Hover handlers ────────────────────────────────────────────────────────

  const handleHoverStart = useCallback(() => {
    const bookEl = bookRef.current;
    const coverEl = coverRef.current;
    if (!bookEl || !coverEl) return;

    // Book lift + tilt
    gsap.to(bookEl, {
      y: -16,
      rotateX: 10,
      rotateY: -5,
      zIndex: 50,
      boxShadow:
        "0 15px 25px rgba(0,0,0,0.4), 0 5px 10px rgba(0,0,0,0.2), inset 3px 0 6px rgba(0,0,0,0.4)",
      duration: 1,
      ease: EASE,
    });

    // Cover swings open
    gsap.to(coverEl, {
      rotateY: -150,
      z: 0,
      duration: 1.25,
      ease: EASE,
    });

    // Ribbon sway
    if (ribbonRef.current) {
      gsap.to(ribbonRef.current, {
        y: 4,
        rotate: 3,
        duration: OPEN_DURATION,
        ease: "power1.inOut",
      });
    }

    // Pages 0, 1, 2: staggered infinite flip loop
    // 1/3-cycle stagger so a page turns every ~1.08s (at LOOP_DURATION=3.25),
    // ensuring at least one page is always mid-flip for continuous motion.
    [0, 1, 2].forEach((i) => {
      const el = pageRefs.current[i];
      if (!el) return;

      pageTimelines.current[i]?.kill();

      const tl = buildPageLoopTl(el);
      // Equal 1/3 stagger: pages are evenly distributed across the cycle
      tl.delay(i * (LOOP_DURATION / 3));
      pageTimelines.current[i] = tl;
    });

    // Page 3: static open (permanent right-side reading page)
    const page3 = pageRefs.current[3];
    if (page3) {
      pageTimelines.current[3]?.kill();
      gsap.to(page3, {
        rotateY: PAGE_STATIC_OPEN.rotateY,
        z: PAGE_STATIC_OPEN.z,
        opacity: 1,
        duration: OPEN_DURATION * 0.25,
        ease: "power2.out",
      });
    }

    // Fade in page content
    contentRefs.current.forEach((el) => {
      if (el) gsap.to(el, { opacity: 1, duration: 0.3 });
    });
  }, []);

  const handleHoverEnd = useCallback(() => {
    const bookEl = bookRef.current;
    const coverEl = coverRef.current;
    if (!bookEl || !coverEl) return;

    // Book back to idle
    gsap.to(bookEl, {
      y: 0,
      rotateX: 0,
      rotateY: 0,
      zIndex: 1,
      boxShadow:
        "0 4px 10px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2), inset 3px 0 6px rgba(0,0,0,0.4)",
      duration: 1,
      ease: EASE,
    });

    // Cover closes
    gsap.to(coverEl, {
      rotateY: -15,
      z: 4,
      duration: OPEN_DURATION,
      ease: EASE,
      delay: 0.35,
    });

    // Ribbon back
    if (ribbonRef.current) {
      gsap.to(ribbonRef.current, {
        y: 0,
        rotate: 0,
        duration: 0.5,
        ease: "power1.out",
      });
    }

    // Kill page loop timelines, return pages to resting fan
    const restDelays = [0.3, 0.2, 0.1, 0];
    pageRefs.current.forEach((el, i) => {
      pageTimelines.current[i]?.kill();
      pageTimelines.current[i] = null;
      if (el) {
        gsap.to(el, {
          rotateY: PAGE_REST[i].rotateY,
          z: PAGE_REST[i].z,
          opacity: 1,
          duration: OPEN_DURATION,
          ease: EASE,
          delay: restDelays[i],
        });
      }
    });

    // Fade out page content
    contentRefs.current.forEach((el) => {
      if (el) gsap.to(el, { opacity: 0, duration: 0.3 });
    });
  }, []);

  const bookStyle = {
    "--book-cover-color": coverColor,
    "--book-cover-accent": accentColor,
  } as React.CSSProperties;

  return (
    <div
      ref={bookRef}
      className="scrapbook-book"
      style={{ ...bookStyle, transformStyle: "preserve-3d", perspective: 1000 }}
      onMouseEnter={handleHoverStart}
      onMouseLeave={handleHoverEnd}
      onClick={onClick}
    >
      {/* Dangling Bookmark Ribbon */}
      <div ref={ribbonRef} className="book-ribbon" />

      {/* Pages Container */}
      <div className="book-pages-container">
        {pages.slice(0, pages.length).map((page, i) => (
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
                <p>{page.content}</p>

                <img src={marx} alt="error displaying image" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Front Cover */}
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
          backgroundPosition: "center",
        }}
      >
        <h2 className="book-title">{displayTitle}</h2>
        <div className="book-subtitle">{displaySubtitle}</div>
      </div>
    </div>
  );
};

// ─── Scroller ────────────────────────────────────────────────────────────────

interface ScrapbookScrollerProps {
  children: React.ReactNode;
}

export const ScrapbookScroller: React.FC<ScrapbookScrollerProps> = ({
  children,
}) => <div className="scrapbook-scroller-container">{children}</div>;
