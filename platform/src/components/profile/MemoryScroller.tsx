import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import type { PageRecord } from "../../types/BookComponentTypes";
import { MemoryComponent } from "../book/MemoryComponent";

interface PageWithVirtualIndex extends PageRecord {
  virtualIndex: number;
}

interface MemoryScrollerProps {
  pages: PageRecord[];
}

export const MemoryScroller: React.FC<MemoryScrollerProps> = ({ pages }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activePlayIndex, setActivePlayIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardElementsRef = useRef<(HTMLDivElement | null)[]>([]);

  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const activeTweenRef = useRef<gsap.core.Tween | null>(null);
  const autoHoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const translationRef = useRef(0);
  const lastPausedIndexRef = useRef<number | null>(null);

  // Synchronously map pages to a padded list for infinite wrapping
  const displayPages = React.useMemo<PageWithVirtualIndex[]>(() => {
    if (pages.length === 0) return [];

    const M = pages.length;
    const padCount = Math.max(6, M); // Pad at least 6 cards on each side for safety
    const list: PageWithVirtualIndex[] = [];

    // Populate list from index -padCount to M + padCount
    for (let idx = -padCount; idx < M + padCount; idx++) {
      const originalIndex = ((idx % M) + M) % M;
      list.push({
        ...pages[originalIndex],
        virtualIndex: idx,
      });
    }
    return list;
  }, [pages]);

  const resolvedPagesCount = pages.length;
  const loopWidth = resolvedPagesCount * 340; // Card width 300px + gap 40px

  // Keep the size of the elements ref array synced
  useEffect(() => {
    cardElementsRef.current = cardElementsRef.current.slice(0, displayPages.length);
  }, [displayPages]);

  // Update card scales, Z translation, rotations, and z-indices based on position relative to center
  const updateCardPositions = () => {
    const track = trackRef.current;
    const container = containerRef.current;
    if (!track || !container) return;

    const x = gsap.getProperty(track, "x") as number || 0;
    translationRef.current = x;

    const containerWidth = container.clientWidth;
    const containerCenter = containerWidth / 2;

    cardElementsRef.current.forEach((el, idx) => {
      if (!el) return;

      const pageItem = displayPages[idx];
      if (!pageItem) return;

      const vIdx = pageItem.virtualIndex;

      // Visual center of card idx relative to container
      const cardCenterInContainer = containerCenter + x + vIdx * 340;

      // Distance from container center
      const distance = Math.abs(containerCenter - cardCenterInContainer);
      const maxDistance = containerWidth / 1.5;
      const factor = Math.max(0, 1 - distance / maxDistance);

      // Scale: 0.95 to 1.15 if normal, 1.25 if expanded (playing)
      const isExpanded = activePlayIndex === vIdx;
      const baseScale = isExpanded ? 1.25 : 0.95 + factor * 0.15;

      // translateZ: 0 to 80px, 150px if expanded
      const translateZ = isExpanded ? 150 : factor * 80;

      // Slight 3D angled curvature facing the center
      const direction = cardCenterInContainer < containerCenter ? 1 : -1;
      const maxRotateY = 15;
      const rotateY = isExpanded ? 0 : direction * (1 - factor) * maxRotateY;

      // zIndex: center/expanded is on top
      const zIndex = isExpanded ? 1000 : Math.round(factor * 100);

      el.style.transform = `translate3d(0, 0, ${translateZ}px) scale(${baseScale}) rotateY(${rotateY}deg)`;
      el.style.zIndex = `${zIndex}`;
    });
  };

  // Helper to resume the infinite marquee scroll
  const resumeAutoScroll = () => {
    if (!trackRef.current || resolvedPagesCount === 0) return;

    if (resolvedPagesCount === 1) {
      gsap.set(trackRef.current, { x: 0 });
      translationRef.current = 0;
      updateCardPositions();
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
        updateCardPositions();
      },
      onComplete: () => {
        gsap.set(trackRef.current, { x: 0 });
        translationRef.current = 0;
        resumeAutoScroll();
      },
    });
  };

  // Setup scroll event listener and resize updates
  useEffect(() => {
    const container = containerRef.current;
    if (!container || displayPages.length === 0) return;

    const handleResize = () => {
      updateCardPositions();
    };
    window.addEventListener("resize", handleResize);

    const resizeObserver = new ResizeObserver(() => {
      updateCardPositions();
    });
    resizeObserver.observe(container);

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
    };
  }, [displayPages]);

  // Setup initial scroll marquee state when pages list changes
  useEffect(() => {
    if (!trackRef.current || displayPages.length === 0) return;

    setActivePlayIndex(null);
    setHoveredIndex(null);
    lastPausedIndexRef.current = null;

    gsap.set(trackRef.current, { x: 0 });
    translationRef.current = 0;
    updateCardPositions();

    const timer = setTimeout(() => {
      resumeAutoScroll();
    }, 150);

    return () => {
      clearTimeout(timer);
      if (tweenRef.current) tweenRef.current.kill();
      if (activeTweenRef.current) activeTweenRef.current.kill();
    };
  }, [pages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoHoverTimeoutRef.current) clearTimeout(autoHoverTimeoutRef.current);
      if (activeTweenRef.current) activeTweenRef.current.kill();
      if (tweenRef.current) tweenRef.current.kill();
    };
  }, []);

  const handleCardHoverStart = (vIdx: number) => {
    // If a card is active/expanded, we do not pause or overwrite on normal hovers
    if (activePlayIndex !== null) return;
    if (!trackRef.current) return;

    setHoveredIndex(vIdx);

    if (tweenRef.current) tweenRef.current.pause();
    if (activeTweenRef.current) activeTweenRef.current.kill();

    const targetBaseX = -vIdx * 340;
    const currentX = translationRef.current;
    const k = Math.round((currentX - targetBaseX) / loopWidth);
    const targetX = targetBaseX + k * loopWidth;

    activeTweenRef.current = gsap.to(trackRef.current, {
      x: targetX,
      duration: 1.0,
      ease: "power2.out",
      overwrite: "auto",
      onUpdate: () => {
        translationRef.current = gsap.getProperty(trackRef.current, "x") as number;
        updateCardPositions();
      },
    });
  };

  const handleCardHoverEnd = () => {
    if (activePlayIndex !== null) return;
    if (!trackRef.current) return;

    setHoveredIndex(null);

    if (autoHoverTimeoutRef.current) clearTimeout(autoHoverTimeoutRef.current);
    autoHoverTimeoutRef.current = setTimeout(() => {
      resumeAutoScroll();
    }, 1000);
  };

  const handlePlayClick = (vIdx: number) => {
    if (!trackRef.current) return;

    if (tweenRef.current) tweenRef.current.pause();
    if (activeTweenRef.current) activeTweenRef.current.kill();
    if (autoHoverTimeoutRef.current) clearTimeout(autoHoverTimeoutRef.current);

    const targetBaseX = -vIdx * 340;
    const currentX = translationRef.current;
    const k = Math.round((currentX - targetBaseX) / loopWidth);
    const targetX = targetBaseX + k * loopWidth;

    setActivePlayIndex(vIdx);
    setHoveredIndex(vIdx);

    activeTweenRef.current = gsap.to(trackRef.current, {
      x: targetX,
      duration: 0.8,
      ease: "power2.out",
      onUpdate: () => {
        translationRef.current = gsap.getProperty(trackRef.current, "x") as number;
        updateCardPositions();
      },
    });
  };

  const handleCloseClick = () => {
    setActivePlayIndex(null);
    setHoveredIndex(null);

    if (autoHoverTimeoutRef.current) clearTimeout(autoHoverTimeoutRef.current);
    autoHoverTimeoutRef.current = setTimeout(() => {
      resumeAutoScroll();
    }, 500);
  };

  const placeholder = (message: string) => (
    <div className="scroller-showcase-box flex items-center justify-center h-full font-hand text-[1.5rem] text-db-muted">
      <span>{message}</span>
    </div>
  );

  if (pages.length === 0) return placeholder("No memories in this notebook yet.");

  return (
    <div className="carousel-container overflow-visible w-full h-[400px]">
      <div ref={containerRef} className="carousel-container w-full h-full">
        <div
          ref={trackRef}
          className={`carousel-track ${
            hoveredIndex !== null || activePlayIndex !== null ? "has-hovered-item" : ""
          }`}
          style={{ width: "300px", height: "380px" }}
        >
          {displayPages.map((page, idx) => {
            const isItemHovered = hoveredIndex === page.virtualIndex;
            const isExpanded = activePlayIndex === page.virtualIndex;
            const isCardActive = isItemHovered || isExpanded;

            return (
              <div
                key={`${page.id}-${page.virtualIndex}`}
                ref={(el) => {
                  cardElementsRef.current[idx] = el;
                }}
                className={`carousel-item ${isCardActive ? "is-hovered" : ""}`}
                style={{
                  position: "absolute",
                  left: `${page.virtualIndex * 340}px`,
                  width: "300px",
                  height: "380px",
                }}
                onMouseEnter={() => handleCardHoverStart(page.virtualIndex)}
                onMouseLeave={handleCardHoverEnd}
              >
                <MemoryComponent
                  page={page}
                  isExpanded={isExpanded}
                  onPlayClick={() => handlePlayClick(page.virtualIndex)}
                  onCloseClick={handleCloseClick}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
