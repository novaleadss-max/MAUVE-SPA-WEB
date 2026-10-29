/**
 * MAUVE — secciones después del escenario: historia (cap. 6), cita (cap. 7),
 * marquee y footer. También el tema de la cabecera y el riel de capítulos.
 */
import { gsap, ScrollTrigger, env, scrollLength, splitWords, splitChars, scrollTo, lenis } from "./core/motion.js";
import { CAPITULO_6_SCROLL } from "./config.js";

const themed = () => document.querySelectorAll(".site-header, .rail, .cursor");
let currentTheme = "ink";
export function setTheme(t) {
  if (t === currentTheme) return;
  currentTheme = t;
  themed().forEach((el) => (el.dataset.theme = t));
}

let currentChapter = "";
export function setChapter(id) {
  if (id === currentChapter) return;
  currentChapter = id;
  document.querySelectorAll(".rail a").forEach((a) => {
    if (a.dataset.chapter === id) a.setAttribute("aria-current", "step");
    else a.removeAttribute("aria-current");
  });
}

/** Header/rail theme + active chapter for everything after the story. */
export function initSectionStates() {
  ["#galeria", ".marquee", "#historia", "#visitanos", ".footer"].forEach((sel) => {
    const el = document.querySelector(sel);
    const theme = sel === ".marquee" ? "ink" : el.dataset.theme;
    ScrollTrigger.create({
      trigger: el,
      start: "top 38px",
      end: "bottom 38px",
      onToggle: (self) => self.isActive && setTheme(theme),
    });
    if (el.dataset.chapter) {
      ScrollTrigger.create({
        trigger: el,
        start: "top 50%",
        end: "bottom 50%",
        onToggle: (self) => self.isActive && setChapter(el.dataset.chapter),
      });
    }
  });
  // The rail steps aside over the footer
  ScrollTrigger.create({
    trigger: ".footer",
    start: "top 70%",
    onToggle: (self) => document.querySelector(".rail").classList.toggle("is-hidden", self.isActive),
  });
}

/** Chapter 6: the paragraph fills with ink word by word as you scroll. */
export function initHistory() {
  const sec = document.querySelector(".history");
  const pin = sec.querySelector(".history__pin");
  const text = sec.querySelector(".js-fill");
  const split = SplitWords(text);
  gsap.set(split, { opacity: 0.14 });

  const len = scrollLength(CAPITULO_6_SCROLL);
  const tl = gsap.timeline({ defaults: { ease: "none" } });
  tl.to(split, { opacity: 1, stagger: 0.9 / split.length, duration: 0.1 }, 0.04);
  sec.querySelectorAll(".history__pic").forEach((pic) => {
    // Phones stack the pictures under the text, so they travel less
    const speed = parseFloat(pic.dataset.speed || 0) * (env.mobile ? 0.3 : 1);
    tl.fromTo(pic, { yPercent: speed * -120 }, { yPercent: speed * 120, duration: 1 }, 0);
    tl.fromTo(pic.querySelector("img"), { scale: 1.25 }, { scale: 1, duration: 1 }, 0);
  });

  ScrollTrigger.create({
    trigger: pin,
    start: "top top",
    end: () => `+=${len * window.innerHeight}`,
    pin: true,
    scrub: env.mobile ? 0.5 : 0.8,
    animation: tl,
    invalidateOnRefresh: true,
  });

  // The title arrives with the section
  const title = splitWords(sec.querySelector(".history__title"));
  gsap.from(title.words, {
    yPercent: 118, duration: 0.9, ease: "m-out", stagger: 0.05,
    scrollTrigger: { trigger: sec, start: "top 70%", once: true },
  });
}

/** Split a paragraph into word spans without touching its accessible text. */
function SplitWords(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.setAttribute("aria-label", el.textContent.trim());
  el.innerHTML = words.map((w) => `<span class="word" aria-hidden="true">${w}</span>`).join(" ");
  return [...el.querySelectorAll(".word")];
}

/** Chapter 7 + footer entrances, and the tulip's last appearance. */
export function initClosing({ tulip }) {
  const cta = document.querySelector(".cta");
  const title = splitWords(cta.querySelector(".cta__title"));
  const tl = gsap.timeline({ scrollTrigger: { trigger: cta, start: "top 62%", once: true } });
  tl.from(title.words, { yPercent: 118, duration: 1, ease: "m-out", stagger: 0.06 })
    .from(".cta__button", { scale: 0.9, autoAlpha: 0, duration: 1, ease: "m-out" }, 0.25)
    .from(".cta__info > div", { y: 28, autoAlpha: 0, duration: 0.8, ease: "m-out", stagger: 0.07 }, 0.4)
    .from(".cta__pic", { clipPath: "inset(100% 0% 0% 0%)", duration: 1.2, ease: "m-inOut" }, 0.2)
    .from(".cta__pic img", { scale: 1.3, duration: 1.6, ease: "m-out" }, 0.2);

  if (tulip) {
    const T = tulip.state;
    const btn = cta.querySelector(".js-bloom");
    // The flower sits on top of the button and travels with it (it lives on a
    // fixed canvas, so we place it from the button's real position each update)
    const place = () => {
      const r = btn.getBoundingClientRect();
      T.x = ((r.left + r.width * 0.5) / window.innerWidth) * 2 - 1;
      T.y = -(((r.top - r.height * 0.02) / window.innerHeight) * 2 - 1);
      T.scale = (r.height * 0.62) / window.innerHeight;
    };
    const show = gsap.timeline({ paused: true })
      .fromTo(T, { opacity: 0, open: 0.1, rotY: Math.PI * 4, rotX: 0, rotZ: 0, loose: 0 }, { opacity: 1, open: 0.62, rotY: Math.PI * 6, duration: 1.4, ease: "m-out", immediateRender: false });
    ScrollTrigger.create({
      trigger: cta,
      start: "top bottom",
      end: "bottom top",
      onUpdate: place,
      onEnter: () => { place(); show.timeScale(1).play(); },
      onEnterBack: () => { place(); show.timeScale(1).play(); },
      onLeave: () => show.timeScale(2).reverse(),
      onLeaveBack: () => show.timeScale(2).reverse(),
    });
    btn.addEventListener("pointerenter", () => tulip.bloom(true));
    btn.addEventListener("pointerleave", () => tulip.bloom(false));
    btn.addEventListener("focus", () => tulip.bloom(true));
    btn.addEventListener("blur", () => tulip.bloom(false));
  }

  // Footer: the name returns at full width, letter by letter
  const word = splitChars(document.querySelector(".footer__word"), { aria: "none" });
  gsap.from(word.chars, {
    yPercent: 118, duration: 1.2, ease: "m-out", stagger: 0.05,
    scrollTrigger: { trigger: ".footer__word", start: "top 95%", once: true },
  });
}

/** Infinite marquee. Speed follows scroll velocity; direction follows scroll direction. */
export function initMarquee() {
  const track = document.querySelector(".marquee__track");
  track.innerHTML += track.innerHTML;
  if (env.reduced) return;
  let x = 0;
  let dir = 1;
  let boost = 0;
  const base = env.mobile ? 50 : 70; // px per second
  const setX = gsap.quickSetter(track, "x", "px");
  const visible = { on: false };
  let paused = false;
  const el = document.querySelector(".marquee");
  el.addEventListener("pointerenter", () => (paused = true));
  el.addEventListener("pointerleave", () => (paused = false));
  ScrollTrigger.create({ trigger: ".marquee", start: "top bottom", end: "bottom top", onToggle: (s) => (visible.on = s.isActive) });
  gsap.ticker.add((_, dtMs) => {
    if (!visible.on || paused) return;
    const v = lenis ? lenis.velocity : 0;
    if (Math.abs(v) > 0.5) dir = v > 0 ? 1 : -1;
    boost += (Math.min(Math.abs(v) * 40, 900) - boost) * 0.08;
    const half = track.scrollWidth / 2;
    x -= ((base + boost) * dir * dtMs) / 1000;
    x = gsap.utils.wrap(-half, 0, x);
    setX(x);
  });
}

/** Rail + in-page links: smooth jumps that land on the start of each chapter. */
export function initNavigation({ chapterY }) {
  const sectionY = (el) => {
    const spacer = el.parentElement?.classList.contains("pin-spacer") ? el.parentElement : el;
    return spacer.getBoundingClientRect().top + window.scrollY;
  };
  const yFor = (id) => {
    if (chapterY?.[id]) return chapterY[id]();
    const el = document.getElementById(id);
    return el ? sectionY(el) : 0;
  };
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href").slice(1);
    if (!id || id === "contenido") return;
    e.preventDefault();
    scrollTo(yFor(id));
    // Move focus for keyboard users without a second jump
    const target = document.getElementById(id);
    if (target) {
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    }
  });
}
