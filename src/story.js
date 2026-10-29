/**
 * MAUVE — scrollytelling, capítulos 1 a 5.
 *
 * Los cinco capítulos viven apilados en un mismo escenario fijado (.story).
 * Una sola línea de tiempo recorre todo; cada capítulo ocupa un tramo cuyo
 * largo sale de CAPITULO_N_SCROLL (src/config.js).
 * Unidades: 1 unidad de la línea de tiempo = 1 altura de pantalla de scroll.
 *
 * Rendimiento: aquí sólo se anima transform y opacity. Nada de clip-path,
 * filtros ni colores de fondo animados: todo lo compone la GPU sin repintar.
 *
 * Transiciones (cada una distinta, el tulipán 3D flota por encima de todas
 * y es el hilo que las une):
 *   1 → 2  cortina: el capítulo 2 sube como una hoja y empuja al 1 hacia atrás
 *   2 → 3  fundido con escala: el 2 se aleja, el 3 llega desde un poco más cerca
 *   3 → 4  zoom: la foto del salón nace del tamaño de la uña central y crece
 *   4 → 5  pétalo: una forma de pétalo ciruela cubre la pantalla y trae la marca
 */
import { gsap, ScrollTrigger, env, scrollLength, splitWords, splitChars } from "./core/motion.js";
import {
  CAPITULO_1_SCROLL,
  CAPITULO_2_SCROLL,
  CAPITULO_3_SCROLL,
  CAPITULO_4_SCROLL,
  CAPITULO_5_SCROLL,
} from "./config.js";

export function initStory({ tulip }) {
  const story = document.querySelector(".story");
  const $ = (s) => story.querySelector(s);
  const $$ = (s) => [...story.querySelectorAll(s)];
  const mobile = env.mobile;
  const vw = () => window.innerWidth / 100;
  const vh = () => window.innerHeight / 100;

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
  const T = tulip.state;
  if (mobile) Object.assign(T, { x: 0.5, y: -0.3, scale: 0.24 });

  // Chapters waiting their turn are not painted at all
  gsap.set([".ch3", ".ch4", ".ch5"], { autoAlpha: 0 });
  gsap.set(".ch2", { yPercent: 100 });
  gsap.set(".curtain", { yPercent: 101 });
  gsap.set(".hero__figure", { xPercent: -50, x: 0 });

  /** Words rising out of their line masks, in step with the picture. */
  const rise = (split, at, dur, each = 0.02) =>
    tl.fromTo(split.words ?? split.chars, { yPercent: 118 }, { yPercent: 0, ease: "m-out", duration: dur, stagger: each }, at);

  /* ── Capítulo 1 · el nombre se abre como pétalos, el tulipán florece ──── */
  const c1 = at.c1;
  const heroChars = story.querySelectorAll(".hero__word .char");
  const phrase = splitWords($(".ch1__phrase"));
  gsap.set(phrase.words, { yPercent: 118 });

  // Intro owns yPercent on these letters; the scroll only touches x / y / rotation
  tl.to(heroChars, {
    x: (i) => (i - 2) * (mobile ? 8 : 12) * vw(),
    y: (i) => -(Math.abs(i - 2) * 4 + 6) * vh(),
    rotation: (i) => (i - 2) * 4,
    autoAlpha: 0,
    ease: "m-soft",
    duration: L.c1 * 0.55,
    stagger: { each: 0.012, from: "center" },
  }, c1);
  tl.to(".hero__figure", { scale: mobile ? 0.92 : 0.86, xPercent: mobile ? -50 : -62, yPercent: 2, ease: "m-soft", duration: L.c1 * 0.7 }, c1);
  tl.to([".hero__lede", ".hero__cta", ".hero__cue"], { autoAlpha: 0, y: -20, ease: "m-out", duration: L.c1 * 0.18, stagger: 0.02 }, c1);
  rise(phrase, c1 + L.c1 * 0.24, L.c1 * 0.22, 0.03);
  tl.to(T, { open: 1, rotY: Math.PI * 1.25, x: mobile ? 0.34 : 0.42, y: mobile ? -0.62 : 0.3, scale: mobile ? 0.26 : 0.36, loose: 0.3, ease: "m-soft", duration: L.c1 * 0.7 }, c1);

  // 1 → 2 · cortina. El 2 sube como una hoja; su contenido viene a contramano
  // (así parece una máscara que se abre) y el 1 se hunde y se oscurece.
  const c2in = c1 + L.c1 * 0.6;
  const curtain1 = L.c1 * 0.4 + L.c2 * 0.06;
  tl.to(".ch2", { yPercent: 0, ease: "m-inOut", duration: curtain1 }, c2in);
  tl.fromTo(".ch2__inner", { yPercent: -45 }, { yPercent: 0, ease: "m-inOut", duration: curtain1 }, c2in);
  tl.to([".hero__figure", ".ch1__phrase"], { y: () => -14 * vh(), ease: "m-inOut", duration: curtain1 }, c2in);
  tl.fromTo(".ch1__shade", { opacity: 0 }, { opacity: 0.55, ease: "m-inOut", duration: curtain1 }, c2in);
  tl.set(".ch1", { autoAlpha: 0 }, c2in + curtain1);
  // The flower drifts across the seam: the one thing that does not change scene
  tl.to(T, { x: mobile ? 0.9 : -0.1, y: mobile ? -0.2 : -0.58, scale: mobile ? 0.14 : 0.22, opacity: mobile ? 0 : 1, open: 0.55, rotY: Math.PI * 2.2, rotZ: 0.3, loose: 0, ease: "m-inOut", duration: curtain1 * 1.1 }, c2in);

  /* ── Capítulo 2 · la secuencia de color ───────────────────────────────── */
  const c2 = at.c2;
  const ch2Title = splitWords($(".ch2__title"));
  rise(ch2Title, c2in + curtain1 * 0.55, curtain1 * 0.5, 0.04);
  tl.fromTo([".ch2__look", ".ch2__sub"], { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, ease: "m-out", duration: curtain1 * 0.45, stagger: 0.06 }, c2in + curtain1 * 0.75);

  // Each new look slides up as a mask: the frame rises, the photo counter-moves,
  // so the edge travels while the picture stays put
  const frames = $$(".hair__frame");
  const seqStart = c2 + L.c2 * 0.06;
  const step = (L.c2 * 0.7) / (frames.length - 1);
  frames.forEach((frame, i) => {
    if (i === 0) return;
    const pos = seqStart + (i - 1) * step;
    const pic = frame.querySelector("picture");
    tl.fromTo(frame, { yPercent: 100 }, { yPercent: 0, ease: "m-inOut", duration: step * 0.85 }, pos);
    tl.fromTo(pic, { yPercent: -100, scale: 1.12 }, { yPercent: 0, scale: 1, ease: "m-inOut", duration: step * 0.85 }, pos);
    tl.to(frames[i - 1].querySelector("picture"), { yPercent: -14, ease: "m-inOut", duration: step * 0.85 }, pos);
  });
  // The label rolls in step: Balayage → Ondas → Capas
  const looks = $(".ch2__look-track");
  tl.to(looks, { yPercent: -33.333, ease: "m-inOut", duration: step * 0.6 }, seqStart + step * 1.15);
  tl.to(looks, { yPercent: -66.666, ease: "m-inOut", duration: step * 0.6 }, seqStart + step * 3.15);
  tl.fromTo(".hair__meter-fill", { scaleY: 1 / frames.length }, { scaleY: 1, duration: L.c2 * 0.7 }, seqStart);

  // 2 → 3 · fundido con escala. El 2 se aleja y se apaga; el 3 llega desde
  // un poco más cerca. Ningún corte: los dos conviven un instante.
  const c3in = c2 + L.c2 * 0.82;
  const fade23 = L.c2 * 0.18 + L.c3 * 0.08;
  tl.set(".ch3", { zIndex: 7 }, c3in);
  // The old scene leaves first (up and away), the new field fades in under it,
  // and only then does the new headline rise: never two headlines at once
  tl.to(".ch2__inner", { scale: 0.94, yPercent: -8, autoAlpha: 0, ease: "m-inOut", duration: fade23 * 0.55 }, c3in);
  tl.fromTo(".ch3", { autoAlpha: 0 }, { autoAlpha: 1, ease: "m-inOut", duration: fade23 * 0.5 }, c3in + fade23 * 0.2);
  tl.fromTo(".nails", { scale: 1.08 }, { scale: 1, ease: "m-out", duration: fade23 }, c3in + fade23 * 0.2);
  tl.to(T, { opacity: 0, scale: mobile ? 0.1 : 0.14, ease: "m-inOut", duration: fade23 }, c3in);

  /* ── Capítulo 3 · abanico de uñas, el fondo se vuelve lavanda ────────── */
  const c3 = at.c3;
  const ch3Title = splitWords($(".ch3__title"));
  rise(ch3Title, c3in + fade23 * 0.5, fade23 * 0.55, 0.05);

  const cards = $$(".nails__card");
  const mid = (cards.length - 1) / 2;
  const fanX = mobile ? 15 : 12.5; // vw between cards
  cards.forEach((card, i) => {
    const d = i - mid;
    const pos = c3 + L.c3 * 0.02 + Math.abs(d) * L.c3 * 0.07;
    tl.fromTo(card,
      { z: -1400, rotationY: d * -38, rotationX: 16, x: 0, yPercent: 40, autoAlpha: 0 },
      { z: Math.abs(d) * -50, rotationY: d * -12, rotationX: 0, rotationZ: d * 5, x: () => d * fanX * vw(), yPercent: Math.abs(d) * 6, autoAlpha: 1, ease: "m-out", duration: L.c3 * 0.34 },
      pos);
  });
  // Background change: a lavender layer fades in over the blush (opacity only)
  tl.fromTo(".ch3__tint", { opacity: 0 }, { opacity: 1, ease: "m-soft", duration: L.c3 * 0.6 }, c3 + L.c3 * 0.06);
  tl.fromTo(".ch3__sub", { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, ease: "m-out", duration: L.c3 * 0.16 }, c3 + L.c3 * 0.36);

  // 3 → 4 · zoom. La foto del salón aparece del tamaño exacto de la uña
  // central y crece hasta la pantalla completa; las demás uñas se abren.
  const c4in = c3 + L.c3 * 0.62;
  const zoom = L.c3 * 0.38 + L.c4 * 0.1;
  const center = cards[Math.round(mid)];
  const fromCard = () => {
    const r = center.getBoundingClientRect();
    return {
      scale: r.height / window.innerHeight,
      x: r.left + r.width / 2 - window.innerWidth / 2,
      y: r.top + r.height / 2 - window.innerHeight / 2,
    };
  };
  tl.set(".ch4", { zIndex: 8 }, c4in);
  tl.fromTo(".finale__window",
    { scale: () => fromCard().scale, x: () => fromCard().x, y: () => fromCard().y },
    { scale: 1, x: 0, y: 0, ease: "m-inOut", duration: zoom, immediateRender: false },
    c4in);
  tl.fromTo(".ch4", { autoAlpha: 0 }, { autoAlpha: 1, ease: "m-out", duration: zoom * 0.18 }, c4in);
  tl.fromTo(".finale__pic", { scale: 1.3 }, { scale: 1.04, ease: "m-inOut", duration: zoom }, c4in);
  tl.to(cards, { x: (i) => (i - mid) * fanX * 2.4 * vw(), autoAlpha: 0, ease: "m-inOut", duration: zoom * 0.7, stagger: { each: 0.01, from: "center" } }, c4in);
  tl.set(".ch3", { autoAlpha: 0 }, c4in + zoom);

  /* ── Capítulo 4 · el remate: el salón y la marca ─────────────────────── */
  const c4 = at.c4;
  const ch4Phrase = splitWords($(".ch4__phrase"));
  tl.fromTo(".ch4__panel", { yPercent: 105 }, { yPercent: 0, ease: "m-out", duration: L.c4 * 0.2 }, c4in + zoom * 0.7);
  rise(ch4Phrase, c4in + zoom * 0.82, L.c4 * 0.2, 0.04);
  tl.to(".finale__pic", { scale: 1.16, xPercent: 4, yPercent: 3, ease: "m-soft", duration: L.c4 * 0.4 }, c4 + L.c4 * 0.1);

  // 4 → 5 · pétalo. Una hoja ciruela con borde de pétalo sube y lo cubre todo.
  const petalAt = c4 + L.c4 * 0.48;
  const petal = L.c4 * 0.32;
  tl.to(".curtain", { yPercent: -24, ease: "m-inOut", duration: petal }, petalAt);
  tl.to([".ch4__panel", ".finale__window"], { y: () => -12 * vh(), ease: "m-inOut", duration: petal }, petalAt);
  const brand = splitChars($(".ch4__name"), { aria: "none" });
  gsap.set(brand.chars, { yPercent: 118 });
  tl.to(brand.chars, { yPercent: 0, ease: "m-out", duration: L.c4 * 0.2, stagger: 0.012 }, petalAt + petal * 0.62);
  tl.fromTo(".ch4__tag", { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, ease: "m-out", duration: L.c4 * 0.14 }, petalAt + petal * 0.85);
  tl.to(T, { opacity: 1, x: 0, y: mobile ? 0.48 : 0.6, scale: mobile ? 0.14 : 0.17, open: 0.85, rotZ: 0, rotY: Math.PI * 3.4, ease: "m-out", duration: petal }, petalAt + petal * 0.5);
  // The name leaves upwards as the services arrive on the same plum field
  tl.to(brand.chars, { yPercent: -118, ease: "m-inOut", duration: L.c4 * 0.14, stagger: 0.008 }, c4 + L.c4 * 0.86);
  tl.to(".ch4__tag", { autoAlpha: 0, y: -12, ease: "m-inOut", duration: L.c4 * 0.1 }, c4 + L.c4 * 0.86);
  tl.to(T, { opacity: 0, y: "+=0.25", ease: "m-inOut", duration: L.c4 * 0.14 }, c4 + L.c4 * 0.86);

  /* ── Capítulo 5 · servicios en carril horizontal ─────────────────────── */
  const c5 = at.c5;
  tl.set(".ch5", { zIndex: 9, autoAlpha: 1 }, c5);
  tl.set(".ch4", { autoAlpha: 0 }, c5 + 0.001);
  const ch5Title = splitWords($(".ch5__title"));
  rise(ch5Title, c5, L.c5 * 0.07, 0.03);
  tl.fromTo(".ch5__sub", { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, ease: "m-out", duration: L.c5 * 0.06 }, c5 + L.c5 * 0.03);

  // The heading rides at the head of the track, so nothing ever passes over it
  const track = $(".svc-track");
  const travel = () => -(track.scrollWidth - story.clientWidth);
  tl.fromTo(track, { x: 0 }, { x: travel, ease: "none", duration: L.c5 * 0.88 }, c5 + L.c5 * 0.08);
  const panels = $$(".svc");
  panels.forEach((svc, i) => {
    const p = c5 + (i / (panels.length + 1)) * L.c5 * 0.9;
    const from = Math.max(c5, p - L.c5 * 0.15);
    tl.fromTo(svc.querySelector(".svc__media"), { rotationY: -18, transformPerspective: 1100 }, { rotationY: 12, ease: "none", duration: L.c5 * 0.45 }, from);
    tl.fromTo(svc.querySelector("img"), { xPercent: -7 }, { xPercent: 7, ease: "none", duration: L.c5 * 0.45 }, from);
  });

  tl.set({}, {}, total);

  const st = ScrollTrigger.create({
    trigger: story,
    start: "top top",
    end: () => `+=${total * window.innerHeight}`,
    pin: true,
    // Lenis already smooths the wheel on desktop: no second layer of lag.
    // Phones scroll natively, so a short catch-up hides touch jitter.
    scrub: mobile ? 0.35 : true,
    animation: tl,
    anticipatePin: 1,
    invalidateOnRefresh: true,
  });

  /** Scroll position where a chapter starts (for the rail and nav links). */
  const chapterY = {
    inicio: () => st.start,
    color: () => st.start + (at.c2 + 0.12) * window.innerHeight,
    detalle: () => st.start + (at.c3 + 0.1) * window.innerHeight,
    remate: () => st.start + (at.c4 + 0.05) * window.innerHeight,
    servicios: () => st.start + (at.c5 + 0.06) * window.innerHeight,
  };
  return { st, chapterY, at, L };
}
