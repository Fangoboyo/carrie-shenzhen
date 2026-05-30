import React from 'react';
import { motion, useAnimation, type Variants, type Easing } from 'framer-motion';
import '../styles/BookComponent.css';

// ─── Animation constants ────────────────────────────────────────────────────

const OPEN_DURATION = 3;  // seconds — matches cover/page open transition
const LOOP_DURATION = 5;    // seconds — full cycle per page in the infinite loop
const EASE = [0.2, 0.8, 0.2, 1] as const;

// ─── Variants ───────────────────────────────────────────────────────────────

const bookVariants: Variants = {
  idle: {
    y: 0,
    rotateX: 0,
    rotateY: 0,
    boxShadow: '0 4px 10px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2), inset 3px 0 6px rgba(0,0,0,0.4)',
  },
  hover: {
    y: -16,
    rotateX: 10,
    rotateY: -5,
    boxShadow: '0 30px 45px rgba(0,0,0,0.4), 0 15px 20px rgba(0,0,0,0.2), inset 3px 0 6px rgba(0,0,0,0.4)',
    transition: { duration: 1, ease: EASE },
  },
};

const ribbonVariants: Variants = {
  idle: { y: 0, rotate: 0 },
  hover: { y: 4, rotate: 3, transition: { duration: OPEN_DURATION, ease: 'easeInOut' } },
};

const coverVariants: Variants = {
  // Resting: slight 3D tilt sitting on top of pages
  idle: { rotateY: -15, z: 4, zIndex: 10, transition: { duration: OPEN_DURATION, ease: EASE, delay: 0.35 } },
  // Open: swings fully back
  hover: { rotateY: -150, z: 0, zIndex: 1, transition: { duration: OPEN_DURATION, ease: EASE, delay: 0 } },
};

const contentVariants: Variants = {
  idle: { opacity: 0, transition: { duration: 0.3 } },
  hover: { opacity: 1, transition: { duration: 0.3 } },
};

// Page resting positions (stacked fan effect)
const PAGE_REST = [
  { rotateY: -3, z: 0 },
  { rotateY: -2, z: 1 },
  { rotateY: -1, z: 2 },
];

// Static right-side page on hover: always visible as the "current reading page"
const PAGE_STATIC_OPEN = { rotateY: -1, z: 1 };

// ─── Infinite page turn loop (starts from the RIGHT side) ────────────────────
// Pages 0 and 1 use this. Page 2 stays static on the right.
const PAGE_LOOP_KEYFRAMES = {
  //        right  hold  flip  left  fadeout  snap  fadein  right
  rotateY: [   0,    0, -145, -145,    -145,    0,      0,    0],
  z:       [   4,    4,    4,    4,       2,    0,      0,    3],
  // opacity fades from 1→0 between 65%→72% (as page settles on left)
  // then stays invisible during snap, fades back in on the right side
  opacity: [   1,    1,    1,    0,       0,    0,      1,    1],
};

const PAGE_LOOP_TIMES = [0, 0.15, 0.65, 0.72, 0.80, 0.81, 0.93, 1.0];

// Per-segment easing — prevents glitch during the invisible snap
const PAGE_LOOP_EASE: Easing[] = [
  'linear',     // 0  → 15%: hold on right before turning
  'easeInOut',  // 15 → 65%: THE FLIP
  'easeOut',    // 65 → 72%: fade OUT while settling on left
  'linear',     // 72 → 80%: hold invisible before snap
  'linear',     // 80 → 81%: snap back to right (linear = no overshoot)
  'easeOut',    // 81 → 93%: fade IN on right side
  'linear',     // 93 → 100%: hold (merges cleanly with 0%)
];

// ─── Types ───────────────────────────────────────────────────────────────────

interface BookPageData {
  content: React.ReactNode;
}

interface BookComponentProps {
  title?: string;
  subtitle?: string;
  pages?: BookPageData[];
  coverColor?: string;
  accentColor?: string;
  onClick?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const BookComponent: React.FC<BookComponentProps> = ({
  title = 'High school',
  subtitle = 'The book',
  pages = [],
  coverColor,
  accentColor,
  onClick,
}) => {
  const displayPages = pages.length > 0 ? pages : [
    { content: <div style={{ padding: '10px' }}><h3>Memories</h3><p>A collection of moments captured in time.</p></div> },
    { content: <div style={{ padding: '10px' }}><h3>Adventures</h3><p>Exploring the wilderness and recording the journey.</p></div> },
    { content: <div style={{ padding: '10px' }}><h3>Reflections</h3><p>Every photo tells a unique story.</p></div> },
  ];

  const pageCount = Math.min(displayPages.length, 3);
  const pageControls = Array.from({ length: pageCount }, () => useAnimation()); // eslint-disable-line react-hooks/rules-of-hooks

  const handleHoverStart = () => {
    // Pages 0 and 1 immediately start the infinite page-turn loop.
    // The loop begins from the right side, so it plays concurrent with the cover opening.
    [0, 1].forEach((i) => {
      pageControls[i].start({
        rotateY: PAGE_LOOP_KEYFRAMES.rotateY,
        z: PAGE_LOOP_KEYFRAMES.z,
        opacity: PAGE_LOOP_KEYFRAMES.opacity,
        transition: {
          duration: LOOP_DURATION,
          repeat: Infinity,
          ease: PAGE_LOOP_EASE,
          times: PAGE_LOOP_TIMES,
          // Stagger = 25% of the cycle (1.25s at LOOP_DURATION=5).
          // At this offset, page 1 is ~25% into its flip (~30° rotation, clearly visible)
          // when page 0 reaches 65% and begins fading — ensuring continuous visible motion.
          delay: i * (LOOP_DURATION * 0.25),
          repeatDelay: 0,
        },
      });
    });

    // Page 2: stays statically on the right — the permanent "reading page".
    // Always keeps the right side of the open book filled.
    pageControls[2].start({
      rotateY: PAGE_STATIC_OPEN.rotateY,
      z: PAGE_STATIC_OPEN.z,
      opacity: 1,
      transition: { duration: OPEN_DURATION * 0.3, ease: 'easeOut' },
    });
  };

  const handleHoverEnd = () => {
    // Stop the loop and transition pages back to their resting positions
    pageControls.forEach((ctrl, i) => {
      ctrl.start({
        rotateY: PAGE_REST[i].rotateY,
        z: PAGE_REST[i].z,
        opacity: 1,
        transition: { duration: OPEN_DURATION, ease: EASE, delay: [0.2, 0.1, 0][i] },
      });
    });
  };

  const bookStyle = {
    '--book-cover-color': coverColor,
    '--book-cover-accent': accentColor,
  } as React.CSSProperties;

  return (
    <motion.div
      className="scrapbook-book"
      style={{ ...bookStyle, transformStyle: 'preserve-3d', perspective: 1000 }}
      variants={bookVariants}
      initial="idle"
      whileHover="hover"
      onHoverStart={handleHoverStart}
      onHoverEnd={handleHoverEnd}
      onClick={onClick}
    >
      {/* Dangling Bookmark Ribbon */}
      <motion.div className="book-ribbon" variants={ribbonVariants} />

      {/* Pages Container */}
      <div className="book-pages-container">
        {displayPages.slice(0, 3).map((page, i) => (
          <motion.div
            key={i}
            className="book-page"
            style={{
              transformOrigin: 'left center',
              rotateY: PAGE_REST[i].rotateY,
              z: PAGE_REST[i].z,
            }}
            animate={pageControls[i]}
          >
            <motion.div className="page-inner-content" variants={contentVariants}>
              {page.content}
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Front Cover */}
      <motion.div
        className="book-cover"
        style={{ transformOrigin: 'left center', zIndex: 10 }}
        variants={coverVariants}
      >
        <h2 className="book-title">{title}</h2>
        <div className="book-subtitle">{subtitle}</div>
      </motion.div>
    </motion.div>
  );
};

// ─── Scroller ────────────────────────────────────────────────────────────────

interface ScrapbookScrollerProps {
  children: React.ReactNode;
}

export const ScrapbookScroller: React.FC<ScrapbookScrollerProps> = ({ children }) => (
  <div className="scrapbook-scroller-container">{children}</div>
);
