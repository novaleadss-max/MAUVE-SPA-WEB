import { gsap } from "gsap";

/** Shared, Three-free state: the timelines own it, the renderer reads it. */
export function createTulipState() {
  const hover = { open: 0, look: 0 };
  return {
    /* x/y: viewport fractions (-1..1, y up). scale: flower height / viewport. */
    state: { x: 0.62, y: -0.26, scale: 0.36, rotY: 0, rotX: 0, rotZ: 0, open: 0, opacity: 1, loose: 1 },
    // Owned by the intro only, so the scroll timeline never records a half-played intro
    intro: { v: 0 },
    hover,
    /** CTA hover: the flower blooms and turns to look at the button. */
    bloom(on) {
      gsap.to(hover, { open: on ? 0.55 : 0, look: on ? 1 : 0, duration: on ? 1.1 : 0.7, ease: on ? "m-out" : "m-inOut", overwrite: true });
    },
  };
}
