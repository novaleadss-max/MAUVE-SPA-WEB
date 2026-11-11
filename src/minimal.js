/**
 * MAUVE · versión minimalista editorial — movimiento.
 *
 * Poco y preciso: titulares que suben por líneas, reglas que se dibujan,
 * fotos que se revelan una vez, un texto que se llena de tinta, la imagen de
 * los servicios que cambia sola, la flor que abre con el scroll y la sesión
 * en un carril horizontal. Sólo transform y opacity mientras se hace scroll.
 */
import "./styles/minimal.css";
import { gsap, ScrollTrigger, env, initScroll, splitWords, scrollTo, lenis } from "./core/motion.js";
import { initMagnetic } from "./ui.js";
import { initPetalRain, initTabTitle } from "./surprises.js";

const html = document.documentElement;
const motion = html.classList.contains("motion");
const mobile = env.mobile;
initScroll();

/* ── Flor: hoja de 36 cuadros con transparencia (public/flor/) ──────────── */
const SHEET = mobile
  ? { src: "/flor/tulipan-mobile.webp", w: 380, h: 275 }
  : { src: "/flor/tulipan-desktop.webp", w: 680, h: 492 };
const FRAMES = 36;
const COLS = 6;
function flower(canvas) {
  const ctx = canvas.getContext("2d");
  canvas.width = SHEET.w;
  canvas.height = SHEET.h;
  let bmp = null;
  let shown = -1;
  let wanted = motion ? 0 : 1;
  const draw = (open) => {
    wanted = open;
    if (!bmp) return;
    const f = Math.round(gsap.utils.clamp(0, 1, open) * (FRAMES - 1) * 32) / 32;
    if (f === shown) return;
    shown = f;
    const i = Math.floor(f), t = f - i;
    const at = (n) => [(n % COLS) * SHEET.w, Math.floor(n / COLS) * SHEET.h];
    ctx.clearRect(0, 0, SHEET.w, SHEET.h);
    ctx.globalAlpha = 1;
    ctx.drawImage(bmp, ...at(i), SHEET.w, SHEET.h, 0, 0, SHEET.w, SHEET.h);
    if (t > 0.02 && i + 1 < FRAMES) {
      ctx.globalAlpha = t; // blend into the next frame: no visible stepping
      ctx.drawImage(bmp, ...at(i + 1), SHEET.w, SHEET.h, 0, 0, SHEET.w, SHEET.h);
    }
  };
  const img = new Image();
  img.decoding = "async";
  img.src = SHEET.src;
  img.decode().then(() => (window.createImageBitmap ? createImageBitmap(img) : img)).then((b) => {
    bmp = b;
    shown = -1;
    draw(wanted);
  }).catch(() => {});
  return draw;
}

/* ── Arranque ─────────────────────────────────────────────────────────── */
document.fonts.ready.then(() => {
  html.classList.add("is-booted");
  const drawFlower = flower(document.querySelector(".flor__canvas"));

  initMagnetic();
  initPetalRain();
  initTabTitle();
  initLinks();
  initHeader();

  if (!motion) {
    drawFlower(1);
    return;
  }

  intro();
  chapters();
  casa();
  ritual();
  flor(drawFlower);
  sesion();
  cita();
  window.addEventListener("load", () => ScrollTrigger.refresh());
});

/* Hero: the headline rises line by line, then the photographs open */
function intro() {
  const lines = document.querySelectorAll(".hero__title .line");
  const tl = gsap.timeline({ defaults: { ease: "m-out" } });
  gsap.set(lines, { yPercent: 130 });
  lines.forEach((l) => {
    const mask = document.createElement("span");
    mask.className = "line-mask";
    mask.style.cssText = "display:block;overflow:clip;padding-bottom:.08em;margin-bottom:-.08em";
    l.parentNode.insertBefore(mask, l);
    mask.appendChild(l);
  });
  tl.to(lines, { yPercent: 0, duration: 1.3, stagger: 0.12 }, 0.1)
    .fromTo(".hero__main .frame", { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: "m-inOut" }, 0.2)
    .fromTo(".hero__main picture", { scale: 1.3 }, { scale: 1.12, duration: 1.8 }, 0.2)
    .fromTo(".hero__small .frame", { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: "m-inOut" }, 0.55)
    .from([".hero__intro > *", ".hero__meta", ".hero__list li", ".seal", ".hero__side"], { autoAlpha: 0, y: 16, duration: 0.9, stagger: 0.05 }, 0.7)
    .from(".head > *", { autoAlpha: 0, y: -10, duration: 0.8, stagger: 0.06 }, 0.5);

  // Gentle depth while leaving the hero
  gsap.to(".hero__main picture", { yPercent: 8, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".hero__small picture", { yPercent: -10, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
}

/* Every chapter label draws its rule and every h2 rises by words */
function chapters() {
  document.querySelectorAll("main section:not(.hero) .chap").forEach((c) => {
    gsap.from(c.querySelector(".chap__rule"), { scaleX: 0, duration: 1, ease: "m-out", scrollTrigger: { trigger: c, start: "top 88%", once: true } });
    gsap.from(c, { autoAlpha: 0, y: 10, duration: 0.8, ease: "m-out", scrollTrigger: { trigger: c, start: "top 88%", once: true } });
  });
  document.querySelectorAll(".h2:not(.flor__title), .cita__title").forEach((h) => {
    const split = splitWords(h);
    gsap.from(split.words, { yPercent: 115, duration: 1.1, ease: "m-out", stagger: 0.05, scrollTrigger: { trigger: h, start: "top 85%", once: true } });
  });
}

/* 02: the manifesto fills with ink word by word, the photographs drift */
function casa() {
  const p = document.querySelector(".js-fill");
  const words = p.textContent.trim().split(/\s+/);
  p.setAttribute("aria-label", p.textContent.trim());
  p.innerHTML = words.map((w) => `<span class="word" aria-hidden="true">${w}</span>`).join(" ");
  const spans = p.querySelectorAll(".word");
  gsap.set(spans, { opacity: 0.18 });
  gsap.to(spans, { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: p, start: "top 78%", end: "bottom 45%", scrub: true } });
  gsap.fromTo(".casa__pic--a", { yPercent: 30 }, { yPercent: -30, ease: "none", scrollTrigger: { trigger: ".casa", start: "top bottom", end: "bottom top", scrub: true } });
  gsap.fromTo(".casa__pic--b", { yPercent: -20 }, { yPercent: 40, ease: "none", scrollTrigger: { trigger: ".casa", start: "top bottom", end: "bottom top", scrub: true } });
}

/* 03: the sticky picture follows the service you are reading */
function ritual() {
  const pics = [...document.querySelectorAll(".ritual__pic")];
  const heroItems = [...document.querySelectorAll(".hero__list li")];
  document.querySelectorAll(".ritual__item").forEach((item) => {
    const i = Number(item.dataset.index);
    ScrollTrigger.create({
      trigger: item,
      start: "top 55%",
      end: "bottom 55%",
      onToggle: (self) => {
        if (!self.isActive) return;
        pics.forEach((p, k) => p.classList.toggle("is-on", k === i));
        heroItems.forEach((li, k) => li.classList.toggle("is-on", k === i));
      },
    });
    gsap.from(item.querySelector(".ritual__title"), { yPercent: 40, autoAlpha: 0, duration: 1, ease: "m-out", scrollTrigger: { trigger: item, start: "top 75%", once: true } });
  });
}

/* 04: pinned; the scroll opens the flower, the words arrive with it */
function flor(draw) {
  const lines = document.querySelectorAll(".flor__title .line");
  lines.forEach((l) => {
    const mask = document.createElement("span");
    mask.style.cssText = "display:block;overflow:clip;padding-bottom:.1em;margin-bottom:-.1em";
    l.parentNode.insertBefore(mask, l);
    mask.appendChild(l);
  });
  const state = { open: 0 };
  const tl = gsap.timeline({ defaults: { ease: "none" } });
  tl.to(state, { open: 1, duration: 1, ease: "m-soft", onUpdate: () => draw(state.open) }, 0)
    .fromTo(".flor__bloom", { scale: 0.86, yPercent: 6 }, { scale: 1, yPercent: 0, duration: 1, ease: "m-soft" }, 0)
    .fromTo(lines, { yPercent: 135 }, { yPercent: 0, duration: 0.35, ease: "m-out", stagger: 0.08 }, 0.45)
    .fromTo(".flor__note", { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: "m-out" }, 0.7)
    .to({}, { duration: 0.2 });
  ScrollTrigger.create({
    trigger: ".flor__pin",
    start: "top top",
    end: () => `+=${window.innerHeight * (mobile ? 1 : 1.6)}`,
    pin: true,
    scrub: mobile ? 0.35 : true,
    animation: tl,
    invalidateOnRefresh: true,
  });
  draw(0);
}

/* 05: desktop pins and slides the session sideways; phones swipe natively */
function sesion() {
  const strip = document.querySelector(".strip");
  if (mobile) {
    html.classList.add("no-pin");
    return;
  }
  const distance = () => strip.scrollWidth - window.innerWidth;
  const tl = gsap.timeline({ defaults: { ease: "none" } });
  tl.to(strip, { x: () => -distance() }, 0);
  strip.querySelectorAll(".strip__pic picture").forEach((pic) => {
    tl.fromTo(pic, { xPercent: -6 }, { xPercent: 6 }, 0);
  });
  ScrollTrigger.create({
    trigger: ".sesion__pin",
    start: "top top",
    end: () => `+=${distance()}`,
    pin: true,
    scrub: true,
    animation: tl,
    invalidateOnRefresh: true,
  });
}

function cita() {
  gsap.from(".btn", { autoAlpha: 0, y: 20, duration: 0.9, ease: "m-out", scrollTrigger: { trigger: ".btn", start: "top 90%", once: true } });
  gsap.from(".cita__info > div", { autoAlpha: 0, y: 18, duration: 0.8, ease: "m-out", stagger: 0.07, scrollTrigger: { trigger: ".cita__info", start: "top 92%", once: true } });
  gsap.from(".foot__word", { yPercent: 40, autoAlpha: 0, duration: 1.4, ease: "m-out", scrollTrigger: { trigger: ".foot", start: "top 90%", once: true } });
}

/* The header steps away while reading down and comes back on the way up */
function initHeader() {
  const head = document.querySelector(".head");
  let last = 0;
  const onScroll = (y) => {
    head.classList.toggle("is-hidden", y > last && y > 200);
    last = y;
  };
  if (lenis) lenis.on("scroll", ({ scroll }) => onScroll(scroll));
  else window.addEventListener("scroll", () => onScroll(window.scrollY), { passive: true });
}

/* In-page links glide (and land past pinned sections correctly) */
function initLinks() {
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href").slice(1);
    const el = id && document.getElementById(id);
    if (!el || id === "contenido") return;
    e.preventDefault();
    const box = el.parentElement?.classList.contains("pin-spacer") ? el.parentElement : el;
    scrollTo(box.getBoundingClientRect().top + window.scrollY - (id === "inicio" ? 0 : 80));
  });
}
