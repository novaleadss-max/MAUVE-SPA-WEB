/**
 * MAUVE — scrollytelling, capítulos 1 a 5.
 *
 * Los cinco capítulos viven apilados en un mismo escenario fijado (.story).
 * Una sola línea de tiempo con scrub recorre todo: cada capítulo ocupa un
 * tramo cuyo largo sale de CAPITULO_N_SCROLL (src/config.js). Así las
 * transiciones entre capítulos pueden ser de cualquier tipo (máscara, 3D,
 * cortina) porque ambos capítulos están en pantalla a la vez.
 *
 * Unidades: 1 unidad de la línea de tiempo = 1 altura de pantalla de scroll.
 *
 * Transiciones (nunca la misma tres veces seguidas):
 *   1 → 2  máscara circular que nace del tulipán
 *   2 → 3  el capítulo 2 se inclina en 3D y cae hacia atrás
 *   3 → 4  la uña central se vuelve ventana y crece (clip-path inset)
 *   4 → 5  cortina con forma de pétalo de la marca + cambio de fondo
 */
import { gsap, ScrollTrigger, env, scrollLength, splitChars } from "./core/motion.js";
import {
  CAPITULO_1_SCROLL,
  CAPITULO_2_SCROLL,
  CAPITULO_3_SCROLL,
  CAPITULO_4_SCROLL,
  CAPITULO_5_SCROLL,
  COLORS,
} from "./config.js";

export function initStory({ tulip }) {
  const story = document.querySelector(".story");
  const $ = (s) => story.querySelector(s);
  const $$ = (s) => [...story.querySelectorAll(s)];
  const mobile = env.mobile;

  const L = {
    c1: scrollLength(CAPITULO_1_SCROLL),
    c2: scrollLength(CAPITULO_2_SCROLL),
    c3: scrollLength(CAPITULO_3_SCROLL),
    c4: scrollLength(CAPITULO_4_SCROLL),
    c5: scrollLength(CAPITULO_5_SCROLL),
  };
  const total = L.c1 + L.c2 + L.c3 + L.c4 + L.c5;
  const at = { c1: 0, c2: L.c1, c3: L.c1 + L.c2, c4: L.c1 + L.c2 + L.c3, c5: L.c1 + L.c2 + L.c3 + L.c4 };

  const tl = gsap.timeline({ defaults: { ease: "none" } });
  // Chapters waiting their turn are not painted at all (cheaper, and they
  // never count as the page's largest paint while hidden under chapter 1)
  gsap.set([".ch3", ".ch4"], { visibility: "hidden" });
  const T = tulip?.state ?? {};
  const hasTulip = !!tulip;
  if (hasTulip && mobile) Object.assign(T, { x: 0.5, y: -0.3, scale: 0.24 });

  /* ── Capítulo 1 · el tulipán se abre, el nombre se dispersa ───────────── */
  const heroChars = story.querySelectorAll(".hero__word .char");
  const phrase = splitChars($(".ch1__phrase"));
  gsap.set(phrase.chars, { yPercent: 125 });

  const c1 = at.c1;
  const spread = mobile ? 9 : 14;
  // Intro animates yPercent on these chars; the scroll only touches x / y / rotation
  const vw = () => window.innerWidth / 100;
  const vh = () => window.innerHeight / 100;
  gsap.set(".hero__figure", { xPercent: -50, x: 0 });
  tl.to(heroChars, {
    x: (i) => (i - 2) * spread * vw(),
    y: (i) => -(Math.abs(i - 2) * 5 + 8) * vh(),
    rotation: (i) => (i - 2) * 7,
    autoAlpha: 0,
    ease: "m-soft",
    duration: L.c1 * 0.55,
    stagger: { each: 0.015, from: "center" },
  }, c1);
  tl.to(".hero__figure", { scale: mobile ? 0.9 : 0.84, xPercent: mobile ? -50 : -64, yPercent: 3, ease: "m-soft", duration: L.c1 * 0.7 }, c1);
  tl.to([".hero__lede", ".hero__cta", ".hero__cue"], { autoAlpha: 0, y: -24, duration: L.c1 * 0.2, stagger: 0.02 }, c1);
  tl.to(phrase.chars, { yPercent: 0, duration: L.c1 * 0.24, ease: "m-out", stagger: 0.006 }, c1 + L.c1 * 0.28);
  if (hasTulip) {
    tl.to(T, { open: 1, rotY: Math.PI * 1.25, x: mobile ? 0 : 0.42, y: mobile ? 0.3 : 0.18, scale: mobile ? 0.36 : 0.5, loose: 0.2, ease: "m-soft", duration: L.c1 * 0.72 }, c1);
  }

  // 1 → 2: a circle that grows out of the tulip
  const c2in = c1 + L.c1 * 0.66;
  const circleAt = mobile ? "50% 35%" : "71% 41%";
  tl.fromTo(".ch2", { clipPath: `circle(0% at ${circleAt})` }, { clipPath: `circle(142% at ${circleAt})`, ease: "m-inOut", duration: L.c1 * 0.34 }, c2in);
  tl.set(".ch2", { zIndex: 6 }, c2in);
  tl.set(".ch1", { autoAlpha: 0 }, c2in + L.c1 * 0.34);
  tl.fromTo(".ch2__inner", { scale: 1.12 }, { scale: 1, ease: "m-out", duration: L.c1 * 0.4 }, c2in);

  /* ── Capítulo 2 · la secuencia de color ───────────────────────────────── */
  const frames = $$(".hair__frame");
  const step = (L.c2 * 0.72) / (frames.length - 1);
  const c2 = at.c2;
  if (hasTulip) {
    // On phones the copy fills the width under the photo: the flower steps out instead
    tl.to(T, { x: mobile ? 0.9 : -0.08, y: mobile ? -0.2 : -0.6, scale: mobile ? 0.14 : 0.26, opacity: mobile ? 0 : 1, open: 0.55, rotY: Math.PI * 2.2, rotZ: 0.35, loose: 0, ease: "m-soft", duration: L.c2 * 0.4 }, c2in);
  }
  const ch2Title = splitChars($(".ch2__title"));
  tl.fromTo(ch2Title.chars, { yPercent: 125 }, { yPercent: 0, ease: "m-out", duration: L.c1 * 0.3, stagger: 0.008 }, c2in + L.c1 * 0.12);
  tl.fromTo([".ch2__look", ".ch2__sub"], { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, ease: "m-out", duration: L.c1 * 0.25, stagger: 0.05 }, c2in + L.c1 * 0.2);

  frames.forEach((frame, i) => {
    if (i === 0) return;
    const pos = c2 + L.c2 * 0.08 + (i - 1) * step;
    tl.fromTo(frame, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "m-inOut", duration: step * 0.9 }, pos);
    tl.fromTo(frame.querySelector("picture"), { scale: 1.3, yPercent: 8 }, { scale: 1, yPercent: 0, ease: "m-out", duration: step }, pos);
    tl.to(frames[i - 1].querySelector("picture"), { scale: 0.92, yPercent: -6, ease: "m-inOut", duration: step * 0.9 }, pos);
  });
  // The look label rolls with the frames: Balayage → Ondas → Capas
  const looks = $(".ch2__look-track");
  tl.to(looks, { yPercent: -33.333, ease: "m-inOut", duration: step * 0.6 }, c2 + L.c2 * 0.08 + step * 1.2);
  tl.to(looks, { yPercent: -66.666, ease: "m-inOut", duration: step * 0.6 }, c2 + L.c2 * 0.08 + step * 3.2);
  tl.fromTo(".hair__meter-fill", { scaleY: 1 / frames.length }, { scaleY: 1, duration: L.c2 * 0.72 + step }, c2 + L.c2 * 0.08 - step);

  // 2 → 3: chapter 2 tips back in 3D and drops away
  const c3in = c2 + L.c2 * 0.84;
  tl.set(".ch3", { zIndex: 5, visibility: "visible" }, c3in - 0.01);
  tl.set(".ch2", { zIndex: 7 }, c3in - 0.01);
  tl.to(".ch2__inner", { rotationX: 62, yPercent: 30, scale: 0.82, autoAlpha: 0, transformPerspective: 1400, ease: "m-inOut", duration: L.c2 * 0.26 }, c3in);
  tl.to(".ch2", { backgroundColor: "rgba(241, 217, 214, 0)", ease: "m-soft", duration: L.c2 * 0.2 }, c3in + L.c2 * 0.05);

  /* ── Capítulo 3 · abanico 3D de uñas, el fondo cambia de tono ────────── */
  const cards = $$(".nails__card");
  const n = cards.length;
  const mid = (n - 1) / 2;
  const fanX = mobile ? 15 : 12.5; // vw between cards
  const c3 = at.c3;
  if (hasTulip) tl.to(T, { opacity: 0, scale: 0.12, ease: "m-soft", duration: L.c3 * 0.2 }, c3in);
  const ch3Title = splitChars($(".ch3__title"));
  tl.fromTo(ch3Title.chars, { yPercent: 125 }, { yPercent: 0, ease: "m-out", duration: L.c3 * 0.2, stagger: 0.008 }, c3in + L.c2 * 0.1);

  cards.forEach((card, i) => {
    const d = i - mid;
    const pos = c3 + L.c3 * 0.04 + Math.abs(d) * L.c3 * 0.09 + (d > 0 ? L.c3 * 0.04 : 0);
    tl.fromTo(card,
      { z: -2200, rotationY: d * -55 + (d === 0 ? 40 : 0), rotationX: 24, xPercent: d * 40, yPercent: 60, autoAlpha: 0 },
      {
        z: Math.abs(d) * -60,
        rotationY: d * -14,
        rotationX: 0,
        rotationZ: d * 6,
        x: () => `${d * fanX}vw`,
        xPercent: 0,
        yPercent: Math.abs(d) * 7,
        autoAlpha: 1,
        ease: "m-out",
        duration: L.c3 * 0.34,
      }, pos);
  });
  tl.to(".ch3", { backgroundColor: COLORS.lavanda, ease: "m-soft", duration: L.c3 * 0.7 }, c3 + L.c3 * 0.05);
  tl.fromTo(".ch3__sub", { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, ease: "m-out", duration: L.c3 * 0.2 }, c3 + L.c3 * 0.42);
  // The fan breathes while it is held
  tl.to(cards, { rotationY: (i) => (i - mid) * -20, z: (i) => Math.abs(i - mid) * -140, ease: "m-soft", duration: L.c3 * 0.3 }, c3 + L.c3 * 0.6);

  /* ── Capítulo 4 · la uña central se vuelve ventana: el salón ─────────── */
  const c4in = c3 + L.c3 * 0.86;
  const center = cards[Math.round(mid)];
  tl.set(".ch4", { zIndex: 8, visibility: "visible" }, c4in - 0.001);
  // Window starts at the centre card's box, expressed as inset() of the chapter
  const insetFromCard = () => {
    const r = center.getBoundingClientRect();
    const w = story.clientWidth, h = story.clientHeight;
    return `inset(${(r.top / h) * 100}% ${((w - r.right) / w) * 100}% ${((h - r.bottom) / h) * 100}% ${(r.left / w) * 100}%)`;
  };
  tl.fromTo(".ch4", { clipPath: insetFromCard }, { clipPath: "inset(0% 0% 0% 0%)", ease: "m-inOut", duration: L.c3 * 0.3, immediateRender: false }, c4in);
  tl.fromTo(".finale__pic", { scale: 1.5 }, { scale: 1.08, ease: "m-out", duration: L.c4 * 0.5 }, c4in);
  tl.to(cards, { autoAlpha: 0, duration: 0.01 }, c4in + L.c3 * 0.3);

  const c4 = at.c4;
  const ch4Phrase = splitChars($(".ch4__phrase"));
  tl.fromTo(ch4Phrase.chars, { yPercent: 125 }, { yPercent: 0, ease: "m-out", duration: L.c4 * 0.2, stagger: 0.01 }, c4 + L.c4 * 0.02);
  // Soft zoom towards the logo on the wall
  tl.to(".finale__pic", { scale: 1.28, xPercent: 6, yPercent: 5, ease: "m-soft", duration: L.c4 * 0.45 }, c4 + L.c4 * 0.1);

  // 4 → 5: the petal curtain rises, the name lands on it
  const curtainAt = c4 + L.c4 * 0.5;
  tl.fromTo(".curtain", { yPercent: 100 }, { yPercent: -38, ease: "m-inOut", duration: L.c4 * 0.36 }, curtainAt);
  tl.to(ch4Phrase.chars, { yPercent: -125, ease: "m-inOut", duration: L.c4 * 0.18, stagger: 0.005 }, curtainAt);
  const brandChars = splitChars($(".ch4__name"), { aria: "none" });
  gsap.set(brandChars.chars, { yPercent: 125 });
  tl.to(brandChars.chars, { yPercent: 0, ease: "m-out", duration: L.c4 * 0.22, stagger: 0.012 }, curtainAt + L.c4 * 0.33);
  tl.fromTo(".ch4__tag", { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, ease: "m-out", duration: L.c4 * 0.14 }, curtainAt + L.c4 * 0.4);
  if (hasTulip) {
    tl.to(T, { opacity: 1, x: mobile ? 0 : 0, y: mobile ? 0.5 : 0.62, scale: mobile ? 0.16 : 0.2, open: 0.85, rotZ: 0, rotY: Math.PI * 3.4, loose: 0, ease: "m-out", duration: L.c4 * 0.3 }, curtainAt + L.c4 * 0.28);
  }

  // The name leaves upwards before the services arrive on the same plum field
  tl.to(brandChars.chars, { yPercent: -125, ease: "m-inOut", duration: L.c4 * 0.14, stagger: 0.008 }, c4 + L.c4 * 0.86);
  tl.to(".ch4__tag", { autoAlpha: 0, y: -14, ease: "m-inOut", duration: L.c4 * 0.1 }, c4 + L.c4 * 0.86);

  /* ── Capítulo 5 · servicios en carril horizontal ─────────────────────── */
  const c5 = at.c5;
  tl.set(".ch5", { zIndex: 9 }, c5);
  tl.fromTo(".ch5", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.001 }, c5);
  tl.to(".ch4", { autoAlpha: 0, duration: 0.001 }, c5 + 0.002);
  const ch5Title = splitChars($(".ch5__title"));
  tl.fromTo(ch5Title.chars, { yPercent: 125 }, { yPercent: 0, ease: "m-out", duration: L.c5 * 0.07, stagger: 0.004 }, c5);
  tl.fromTo(".ch5__sub", { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, ease: "m-out", duration: L.c5 * 0.06 }, c5 + L.c5 * 0.03);
  if (hasTulip) tl.to(T, { opacity: 0, y: "+=0.3", ease: "m-soft", duration: L.c5 * 0.08 }, c5);

  // The heading rides at the head of the track, so nothing ever passes over it
  const track = $(".svc-track");
  const travel = () => -(track.scrollWidth - story.clientWidth);
  tl.fromTo(track, { x: 0 }, { x: travel, ease: "none", duration: L.c5 * 0.86 }, c5 + L.c5 * 0.08);
  // Each panel: image counter-moves inside its frame and turns slightly in 3D
  $$(".svc").forEach((svc, i) => {
    const media = svc.querySelector(".svc__media");
    const img = svc.querySelector("img");
    const p = c5 + (i / ($$(".svc").length + 1)) * L.c5 * 0.92;
    tl.fromTo(media, { rotationY: -22, transformPerspective: 1100 }, { rotationY: 14, ease: "none", duration: L.c5 * 0.45 }, Math.max(c5, p - L.c5 * 0.15));
    tl.fromTo(img, { xPercent: -8 }, { xPercent: 8, ease: "none", duration: L.c5 * 0.45 }, Math.max(c5, p - L.c5 * 0.15));
  });

  // Make sure the full length exists even if the last tween ends early
  tl.set({}, {}, total);

  const st = ScrollTrigger.create({
    trigger: story,
    start: "top top",
    end: () => `+=${total * window.innerHeight}`,
    pin: true,
    scrub: mobile ? 0.6 : 1,
    animation: tl,
    anticipatePin: 1,
    invalidateOnRefresh: true,
  });

  /** Scroll position where a chapter starts (for the rail and nav links). */
  const chapterY = {
    inicio: () => st.start,
    color: () => st.start + (at.c2 + 0.1) * window.innerHeight,
    detalle: () => st.start + (at.c3 + 0.1) * window.innerHeight,
    remate: () => st.start + (at.c4 + 0.05) * window.innerHeight,
    servicios: () => st.start + (at.c5 + 0.04) * window.innerHeight,
  };
  return { st, chapterY, at, L };
}
