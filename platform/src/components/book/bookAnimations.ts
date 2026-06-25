import gsap from "gsap";

// ─── Animation constants ────────────────────────────────────────────────────

export const OPEN_DURATION = 2.5; // seconds — matches cover/page open transition
export const LOOP_DURATION = 3.25; // seconds — full cycle per page in the infinite loop
export const EASE = "power2.inOut";

// ─── Page resting positions (stacked fan effect) ─────────────────────────────

export const PAGE_REST = [
  { rotateY: -4, z: 0.02 },
  { rotateY: -3, z: 0.04 },
  { rotateY: -2, z: 0.06 },
  { rotateY: -1, z: 0.08 },
];

// Static right-side page on hover: always visible as the "current reading page"
export const PAGE_STATIC_OPEN = { rotateY: -1, z: 1 };

// ─── Infinite page-turn loop keyframes ───────────────────────────────────────
//
//  symmetric timing model (fraction of loop_duration):
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
export const buildPageLoopTl = (el: HTMLElement): gsap.core.Timeline => {
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
