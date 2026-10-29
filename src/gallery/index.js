/**
 * Gallery wiring: the pinned in-page gallery, the full-screen endless mode
 * and the shared Flip preview.
 */
import { gsap, ScrollTrigger, env, scrollLength, lockScroll } from "../core/motion.js";
import { GALERIA_SCROLL } from "../config.js";
import Slider from "./Slider.js";
import Reveal from "./Reveal.js";
import Transition from "./Transition.js";

export function initGallery() {
  const section = document.querySelector(".gallery-sec");
  const root = section.querySelector(".gallery");
  let active = null; // slider currently receiving input

  const transition = new Transition({ onClose: () => active?.start() });

  const bindSlides = (gallery, slider) => {
    const slides = [...gallery.querySelectorAll(".gallery__slide")];
    slides.forEach((slide, i) => {
      slide.tabIndex = 0;
      slide.setAttribute("role", "button");
      const open = () => {
        if (transition.state !== "closed") return;
        slider?.stop();
        active = slider;
        transition.open(slide, i, slides.filter((s) => s !== slide));
      };
      slide.addEventListener("click", open);
      slide.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      });
      if (env.finePointer && !env.reduced) {
        const img = slide.querySelector(".gallery__img");
        slide.addEventListener("pointerenter", () => gsap.to(img, { scale: 1.1, duration: 0.9, ease: "m-out", overwrite: "auto" }));
        slide.addEventListener("pointerleave", () => gsap.to(img, { scale: 1.2, duration: 0.7, ease: "m-out", overwrite: "auto" }));
      }
    });
    return slides;
  };

  // Endless mode markup is a copy of the in-page gallery
  const endlessEl = document.querySelector(".endless");
  const endlessGallery = endlessEl.querySelector(".gallery");
  endlessGallery.innerHTML = root.innerHTML;

  if (env.reduced) {
    document.documentElement.classList.remove("js-gallery");
    bindSlides(root, null);
    initEndlessReduced(endlessEl, endlessGallery, bindSlides);
    return;
  }

  const reveal = new Reveal(root);
  const slider = new Slider({
    root,
    driver: "scroll",
    enabled: () => transition.state === "closed",
    onToggle: (changes, immediate) => reveal.toggle(changes, immediate),
  });
  active = slider;
  bindSlides(root, slider);

  // Pinned: the page scroll becomes the gallery's input while it lasts
  let lastY = 0;
  ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: () => `+=${scrollLength(GALERIA_SCROLL) * window.innerHeight}`,
    pin: true,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    onEnter: (self) => (lastY = self.scroll()),
    onEnterBack: (self) => (lastY = self.scroll()),
    onUpdate: (self) => {
      const y = self.scroll();
      slider.push(y - lastY);
      lastY = y;
    },
  });

  // Gentle drift on entry so the gallery is already alive when it arrives
  ScrollTrigger.create({
    trigger: section,
    start: "top bottom",
    end: "top top",
    onUpdate: (self) => {
      const y = self.scroll();
      if (self.isActive) slider.push((y - lastY) * 0.4);
      lastY = y;
    },
  });

  initEndless(endlessEl, endlessGallery, bindSlides, transition, (s) => (active = s), () => slider);
}

/** Full-screen endless gallery driven by wheel and touch (Observer). */
function initEndless(el, gallery, bindSlides, transition, setActive, getPageSlider) {
  let slider = null;
  let reveal = null;
  let returnFocus = null;
  const close = el.querySelector(".endless__close");

  const open = (origin) => {
    returnFocus = origin;
    el.hidden = false;
    lockScroll(true);
    getPageSlider().stop();
    if (!slider) {
      reveal = new Reveal(gallery);
      slider = new Slider({
        root: gallery,
        driver: "observer",
        enabled: () => transition.state === "closed",
        onToggle: (c, i) => reveal.toggle(c, i),
      });
      bindSlides(gallery, slider);
    } else {
      slider.rebuild();
      slider.start();
    }
    setActive(slider);

    // Unexpected full-screen move: the room opens as a circle from the button
    const r = origin.getBoundingClientRect();
    const cx = ((r.left + r.width / 2) / window.innerWidth) * 100;
    const cy = ((r.top + r.height / 2) / window.innerHeight) * 100;
    gsap.fromTo(el, { clipPath: `circle(0% at ${cx}% ${cy}%)` }, { clipPath: `circle(150% at ${cx}% ${cy}%)`, duration: 1.1, ease: "m-inOut" });
    gsap.fromTo([close, el.querySelector(".endless__hint")], { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "m-out", delay: 0.6, stagger: 0.08 });
    close.focus({ preventScroll: true });
  };

  const shut = () => {
    if (el.hidden || transition.state !== "closed") return;
    slider.stop();
    const r = returnFocus.getBoundingClientRect();
    const cx = ((r.left + r.width / 2) / window.innerWidth) * 100;
    const cy = ((r.top + r.height / 2) / window.innerHeight) * 100;
    gsap.to(el, {
      clipPath: `circle(0% at ${cx}% ${cy}%)`,
      duration: 0.75,
      ease: "m-inOut",
      onComplete: () => {
        el.hidden = true;
        gsap.set(el, { clearProps: "clipPath" });
        lockScroll(false);
        const page = getPageSlider();
        page.start();
        setActive(page);
        returnFocus?.focus({ preventScroll: true });
      },
    });
  };

  document.querySelectorAll(".js-endless").forEach((b) => b.addEventListener("click", () => open(b)));
  close.addEventListener("click", shut);
  document.addEventListener("keydown", (e) => e.key === "Escape" && shut());
}

/** Reduced motion: the endless mode is a calm, natively scrolling column. */
function initEndlessReduced(el, gallery, bindSlides) {
  el.style.overflowY = "auto";
  el.style.touchAction = "auto";
  const close = el.querySelector(".endless__close");
  let returnFocus = null;
  bindSlides(gallery, null);
  document.querySelectorAll(".js-endless").forEach((b) =>
    b.addEventListener("click", () => {
      returnFocus = b;
      el.hidden = false;
      lockScroll(true);
      close.focus();
    }),
  );
  const shut = () => {
    if (el.hidden) return;
    el.hidden = true;
    lockScroll(false);
    returnFocus?.focus();
  };
  close.addEventListener("click", shut);
  document.addEventListener("keydown", (e) => e.key === "Escape" && shut());
}
