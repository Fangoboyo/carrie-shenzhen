import { useCallback, useEffect, useRef } from "react";
import gsap from "gsap";
import {
  OPEN_DURATION,
  LOOP_DURATION,
  EASE,
  PAGE_REST,
  PAGE_STATIC_OPEN,
  buildPageLoopTl,
} from "./bookAnimations";

interface UseBookHoverOptions {
  bookRef: React.RefObject<HTMLDivElement | null>;
  coverRef: React.RefObject<HTMLDivElement | null>;
  ribbonRef: React.RefObject<HTMLDivElement | null>;
  pageRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  contentRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
}

/**
 * Manages all hover-driven GSAP animations for a BookComponent.
 *
 * Alt-tab / window-blur fix
 * ─────────────────────────
 * When the user alt-tabs away, the browser fires `mouseleave` on the hovered
 * element, which would normally snap the book shut mid-animation.  We guard
 * against this by:
 *   1. Tracking whether the pointer is genuinely "inside" with `isHovered`.
 *   2. On `visibilitychange` / `blur` events we mark the book as NOT hovered
 *      without triggering the close animation.
 *   3. On `mouseenter` after returning we re-open correctly.
 *   4. On `mouseleave` we only fire the close animation when the document is
 *      still visible (i.e. the leave was a real mouse exit, not an OS focus
 *      steal).
 */
export const useBookHover = ({
  bookRef,
  coverRef,
  ribbonRef,
  pageRefs,
  contentRefs,
}: UseBookHoverOptions) => {
  const pageTimelines = useRef<(gsap.core.Timeline | null)[]>([
    null,
    null,
    null,
    null,
  ]);

  // Tracks whether the pointer is genuinely inside the book element.
  const isHovered = useRef(false);

  // Pending close rAF handle — lets blur/visibilitychange fire before we close.
  const closeRafId = useRef<number | null>(null);

  // Track the active cover tween so we can kill it before starting a new one.
  const coverTween = useRef<gsap.core.Tween | null>(null);

  // ─── Initial state ──────────────────────────────────────────────────────────
  useEffect(() => {
    const bookEl = bookRef.current;
    const coverEl = coverRef.current;
    if (!bookEl || !coverEl) return;

    gsap.set(bookEl, {
      y: 0,
      rotateX: 0,
      rotateY: 0,
      boxShadow:
        "0 4px 10px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2), inset 3px 0 6px rgba(0,0,0,0.4)",
    });

    gsap.set(coverEl, { rotateY: -15, z: 0.1 });

    pageRefs.current.forEach((el, i) => {
      if (el)
        gsap.set(el, {
          rotateY: PAGE_REST[i].rotateY,
          z: PAGE_REST[i].z,
          opacity: 1,
        });
    });

    contentRefs.current.forEach((el) => {
      if (el) gsap.set(el, { opacity: 0 });
    });

    if (ribbonRef.current) gsap.set(ribbonRef.current, { y: 0, rotate: 0 });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Close animation (reusable) ────────────────────────────────────────────
  const closeBook = useCallback(() => {
    const bookEl = bookRef.current;
    const coverEl = coverRef.current;
    if (!bookEl || !coverEl) return;

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

    // Kill any in-flight cover tween before starting the close so GSAP never
    // has two tweens fighting over rotateY, which causes the visible snap.
    coverTween.current?.kill();
    coverTween.current = gsap.to(coverEl, {
      rotateY: -15,
      z: 0.1,
      duration: OPEN_DURATION,
      ease: EASE,
      // No delay — animate from current rotateY position, whatever it is.
    });

    if (ribbonRef.current) {
      gsap.to(ribbonRef.current, {
        y: 0,
        rotate: 0,
        duration: 0.5,
        ease: "power1.out",
      });
    }

    // Stagger the pages slightly, but shorten each one's duration by its own
    // delay so every page finishes closing at the same time as the cover.
    const restDelays = [0.3, 0.2, 0.1, 0];
    pageRefs.current.forEach((el, i) => {
      pageTimelines.current[i]?.kill();
      pageTimelines.current[i] = null;
      if (el) {
        gsap.to(el, {
          rotateY: PAGE_REST[i].rotateY,
          z: PAGE_REST[i].z,
          opacity: 1,
          duration: OPEN_DURATION - restDelays[i],
          ease: EASE,
          delay: restDelays[i],
        });
      }
    });

    contentRefs.current.forEach((el) => {
      if (el) gsap.to(el, { opacity: 0, duration: 0.3 });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Alt-tab / window-blur guard ───────────────────────────────────────────
  useEffect(() => {
    /**
     * When the document becomes hidden (alt-tab, minimize, etc.) the browser
     * fires a synthetic `mouseleave`.  We silently clear the hovered flag here
     * so the `handleHoverEnd` guard below can detect the false-leave and
     * skip the close animation.
     */
    const onVisibilityChange = () => {
      if (document.hidden) {
        isHovered.current = false;
      }
    };

    /**
     * Some browsers fire `blur` on the window instead of (or in addition to)
     * `visibilitychange`.  Same treatment: clear flag, don't animate.
     */
    const onWindowBlur = () => {
      isHovered.current = false;
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onWindowBlur);
    };
  }, []);

  // ─── Hover handlers ────────────────────────────────────────────────────────

  const handleHoverStart = useCallback(() => {
    // Cancel any pending deferred close (fast re-entry after alt-tab return).
    if (closeRafId.current !== null) {
      cancelAnimationFrame(closeRafId.current);
      closeRafId.current = null;
    }

    // Block hover event if book is oriented towards the back of the 3D shelf
    const bookEle = bookRef.current;
    if (bookEle) {
      const item = bookEle.closest(".carousel-item");
      const track = bookEle.closest(".carousel-track");
      if (item && track) {
        const itemRotation = gsap.getProperty(item, "rotateY") as number || 0;
        const trackRotation = gsap.getProperty(track, "rotateY") as number || 0;
        const netAngle = itemRotation + trackRotation;
        const radians = (netAngle * Math.PI) / 180;

        if (Math.cos(radians) < 0) {
          return;
        }
      }
    }

    isHovered.current = true;

    const coverEl = coverRef.current;
    if (!bookEle || !coverEl) return;

    gsap.to(bookEle, {
      y: -16,
      rotateX: 10,
      rotateY: -5,
      zIndex: 50,
      boxShadow:
        "0 15px 25px rgba(0,0,0,0.4), 0 5px 10px rgba(0,0,0,0.2), inset 3px 0 6px rgba(0,0,0,0.4)",
      duration: 1,
      ease: EASE,
    });

    // Kill any in-flight cover tween before opening.
    coverTween.current?.kill();
    coverTween.current = gsap.to(coverEl, {
      rotateY: -150,
      z: 0,
      duration: 1.25,
      ease: EASE,
    });

    if (ribbonRef.current) {
      gsap.to(ribbonRef.current, {
        y: 4,
        rotate: 3,
        duration: OPEN_DURATION,
        ease: "power1.inOut",
      });
    }

    // Pages 0, 1, 2: staggered infinite flip loop
    [0, 1, 2].forEach((i) => {
      const el = pageRefs.current[i];
      if (!el) return;

      pageTimelines.current[i]?.kill();
      const tl = buildPageLoopTl(el);
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

    contentRefs.current.forEach((el) => {
      if (el) gsap.to(el, { opacity: 1, duration: 0.3 });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleHoverEnd = useCallback(() => {
    /**
     * Defer by one rAF tick so that blur / visibilitychange events — which
     * clear isHovered — have a chance to fire before we decide to close.
     * Without this, browsers that dispatch mouseleave *before* blur would
     * see isHovered=true and incorrectly snap the cover shut on alt-tab.
     */
    closeRafId.current = requestAnimationFrame(() => {
      closeRafId.current = null;

      // If the document is hidden OR the pointer was never truly inside
      // (guard cleared by blur/visibilitychange), skip the close animation.
      if (document.hidden || !isHovered.current) return;

      isHovered.current = false;
      closeBook();
    });
  }, [closeBook]);

  return { handleHoverStart, handleHoverEnd };
};
