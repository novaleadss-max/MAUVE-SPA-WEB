/**
 * MAUVE — punto de entrada.
 * Orden: estilos → scroll suave → 3D → preloader → intro → capítulos.
 * Para ajustar tiempos, velocidades y colores: src/config.js.
 */
import "@fontsource-variable/bodoni-moda/opsz.css";
import "@fontsource-variable/hanken-grotesk";
import "./styles/main.css";

import { gsap, ScrollTrigger, env, initScroll, lockScroll, splitChars, lenis } from "./core/motion.js";
import { runPreloader } from "./preloader.js";
import { createTulipState } from "./three/state.js";
import { initStory } from "./story.js";
import { initGallery } from "./gallery/index.js";
import { initHistory, initClosing, initMarquee, initNavigation, initSectionStates, setTheme, setChapter } from "./sections.js";
import { initCursor, initMagnetic, initTilt } from "./ui.js";
import { initPetalRain, initTabTitle } from "./surprises.js";
import { TIEMPOS } from "./config.js";

const html = document.documentElement;

initScroll();
lockScroll(true);

/* 3D: the timelines animate a plain state object from the start; Three.js
   arrives as its own chunk once the page has loaded and picks it up */
const canvas = document.querySelector(".tulip-canvas");
const tulip = createTulipState();
let renderer = null;
const mountTulip = () =>
  import("./three/Tulip.js")
    .then(({ Tulip }) => {
      const t = new Tulip(canvas, { mobile: env.mobile, state: tulip.state, intro: tulip.intro, hover: tulip.hover });
      renderer = t.ok ? t : null;
    })
    .catch(() => (renderer = null));
const afterLoad = new Promise((r) => (document.readyState === "complete" ? r() : window.addEventListener("load", r, { once: true })));
afterLoad.then(() => (window.requestIdleCallback ? requestIdleCallback(mountTulip, { timeout: 1200 }) : setTimeout(mountTulip, 300)));

/* Assets the first screen needs */
const tasks = [
  document.fonts.ready,
  document.querySelector(".hero__figure img").decode().catch(() => {}),
  ...[...document.querySelectorAll(".hair__frame img")].slice(0, 2).map((i) => i.decode().catch(() => {})),
  new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
];


let heroSplit, lede, story = null;

/** Everything that measures type waits for the fonts (the preloader covers the screen meanwhile). */
function boot() {
  html.classList.add("is-booted");
  /* Hero type is split before anything measures it */
  heroSplit = splitChars(".hero__word", { aria: "none" });
  lede = splitChars(".hero__lede", { type: "lines", linesClass: "split-line" });

  /* Pre-intro state (only properties the scroll timelines never touch) */
  if (!env.reduced) {
    gsap.set(heroSplit.chars, { yPercent: 125 });
    gsap.set(".hero__pic", { yPercent: 12, scale: 1.06 });
    gsap.set(lede.lines, { yPercent: 125 });
    gsap.set(".hero__cta", { clipPath: "inset(0% 50% 0% 50% round 999px)" });
    gsap.set(".site-header", { yPercent: -100 });
  }

  if (!env.reduced) story = initStory({ tulip });
  initNavigation({ chapterY: story?.chapterY });
  initPetalRain();
  initTabTitle();

  // Everything below the first screen is set up when the main thread is free,
  // so it never competes with the hero for the first paint
  const later = () => {
    initGallery();
    if (!env.reduced) initHistory();
    initClosing({ tulip: env.reduced ? null : tulip });
    initMarquee();
    initSectionStates();
    initCursor();
    initMagnetic();
    initTilt();
    ScrollTrigger.refresh();
  };
  if (window.requestIdleCallback) requestIdleCallback(later, { timeout: 1500 });
  else setTimeout(later, 300);

  /* Header theme + rail while inside the story stage */
  if (story) {
    const { st, at, L } = story;
    ScrollTrigger.create({
      trigger: ".story",
      start: () => st.start,
      end: () => st.end,
      onUpdate: (self) => {
        const u = (self.scroll() - st.start) / window.innerHeight;
        const covered = at.c4 + L.c4 * 0.62; // the petal curtain has covered the screen
        setTheme(u < covered ? "ink" : "light");
        const chapter = u < at.c2 - L.c1 * 0.2 ? "inicio" : u < at.c3 - L.c2 * 0.1 ? "color" : u < at.c4 - L.c3 * 0.1 ? "detalle" : u < at.c5 ? "remate" : "servicios";
        setChapter(chapter);
      },
      onEnterBack: () => setTheme("ink"),
    });
    setChapter("inicio");
  } else {
    setChapter("inicio");
  }

  if (env.reduced) {
    // A still flower in the hero
    Object.assign(tulip.state, { x: env.mobile ? 0.5 : 0.62, y: env.mobile ? -0.3 : -0.26, scale: env.mobile ? 0.24 : 0.36, open: 0.6, loose: 0 });
    tulip.intro.v = 1;
    ScrollTrigger.create({ trigger: ".ch1", start: "top top", end: "bottom top", onLeave: () => (tulip.state.opacity = 0), onEnterBack: () => (tulip.state.opacity = 1) });
  }
}

/* Preloader, then the intro */
const booted = document.fonts.ready.then(boot);
Promise.all([runPreloader(tasks), booted]).then(([{ revealAt }]) => {
  ScrollTrigger.refresh();
  if (env.reduced) {
    lockScroll(false);
    return;
  }
  const tl = gsap.timeline({ delay: revealAt, onComplete: () => lockScroll(false) });
  tl.to(heroSplit.chars, { yPercent: 0, duration: TIEMPOS.titular, ease: "m-out", stagger: { each: 0.06, from: "center" } }, 0)
    .to(".hero__pic", { yPercent: 0, scale: 1, duration: TIEMPOS.titular * 1.15, ease: "m-out" }, 0.05)
    .to(lede.lines, { yPercent: 0, duration: 0.9, ease: "m-out", stagger: 0.08 }, 0.45)
    .to(".hero__cta", { clipPath: "inset(0% 0% 0% 0% round 999px)", duration: 0.9, ease: "m-inOut" }, 0.5)
    .to(".site-header", { yPercent: 0, duration: 0.9, ease: "m-out" }, 0.55);
  tl.to(tulip.intro, { v: 1, duration: 1.8, ease: "m-out" }, 0.15);
  // Let people scroll as soon as the name has landed; the rest finishes on its own
  tl.call(() => lockScroll(false), null, 0.9);
});

/* Re-measure once late images settle */
window.addEventListener("load", () => ScrollTrigger.refresh());

/* Dev only: hooks for the screenshot script (stripped from the build) */
if (import.meta.env.DEV) window.__mauve = { get lenis() { return lenis; }, ScrollTrigger, get story() { return story; }, get tulip() { return renderer; } };
