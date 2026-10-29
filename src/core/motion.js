import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Flip } from "gsap/Flip";
import { Observer } from "gsap/Observer";
import { CustomEase } from "gsap/CustomEase";
import Lenis from "lenis";
import { EASES, FACTOR_SCROLL_MOVIL } from "../config.js";

gsap.registerPlugin(ScrollTrigger, SplitText, Flip, Observer, CustomEase);

/* Custom curves, registered once and referenced by name everywhere */
Object.entries(EASES).forEach(([name, bezier]) => CustomEase.create(`m-${name}`, bezier.replace(/\s/g, "")));

export { gsap, ScrollTrigger, SplitText, Flip, Observer };

/* Environment */
export const env = {
  reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  finePointer: window.matchMedia("(hover: hover) and (pointer: fine)").matches,
  get mobile() {
    return window.innerWidth <= 760;
  },
};

/** "+=150%" -> 1.5 (viewport heights), shortened on phones. */
export function scrollLength(value) {
  const n = parseFloat(String(value).replace("+=", "")) / 100;
  return env.mobile ? n * FACTOR_SCROLL_MOVIL : n;
}

/* Smooth scroll (Lenis) wired into ScrollTrigger and the GSAP ticker */
export let lenis = null;

export function initScroll() {
  ScrollTrigger.config({ ignoreMobileResize: true });
  if (env.reduced) return null;

  lenis = new Lenis({
    lerp: 0.11,
    wheelMultiplier: 0.9,
    touchMultiplier: 1.1,
    // Native momentum on touch keeps phones at 60fps and never "stuck"
    syncTouch: false,
  });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

export function scrollTo(y, opts = {}) {
  if (lenis) lenis.scrollTo(y, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4), ...opts });
  else window.scrollTo({ top: y, behavior: env.reduced ? "auto" : "smooth" });
}

export function lockScroll(lock) {
  if (lenis) lock ? lenis.stop() : lenis.start();
  document.documentElement.style.overflow = lock ? "hidden" : "";
}

/** Split into masked lines + chars (aria handled by SplitText). */
export function splitChars(target, extra = {}) {
  return SplitText.create(target, {
    type: "lines,chars",
    linesClass: "split-line",
    charsClass: "char",
    mask: "lines",
    aria: "auto",
    ...extra,
  });
}
