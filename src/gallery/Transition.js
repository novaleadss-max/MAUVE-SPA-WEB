/**
 * Image-to-content transition (GSAP Flip).
 *
 * Based on "Infinite Scroll Gallery with Page Transitions using GSAP"
 * by Surya Aditya for Codrops (MIT License):
 * https://github.com/surya-aditya/codrops-infinite-scroll-and-content-transition
 *
 * Mauve changes: the other slides sink back in depth while they fade, the
 * morph uses the house in-out curve, the text rises letter by letter out of
 * line masks, focus moves into the dialog and back, the page scroll is held
 * while it is open, and reduced motion swaps the morph for a crossfade.
 */
import { gsap, Flip, SplitText, env, lockScroll } from "../core/motion.js";
import { TIEMPOS } from "../config.js";

export default class Transition {
  constructor({ onClose } = {}) {
    this.onClose = onClose;
    this.content = document.querySelector(".content");
    this.preview = this.content.querySelector(".content__preview-img");
    this.previewImg = this.preview.querySelector("img");
    this.back = this.content.querySelector(".content__back");
    this.groups = [...this.content.querySelectorAll(".content__group")];
    this.state = "closed";
    this.tl = null;
    this.split = null;

    this.back.addEventListener("click", () => this.close());
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.state !== "closed") {
        e.stopPropagation();
        this.close();
      }
    });
    // Keep keyboard focus inside the dialog
    this.content.addEventListener("keydown", (e) => {
      if (e.key !== "Tab") return;
      const f = [...this.content.querySelectorAll("button, a[href]")].filter((el) => el.offsetParent);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /** slide: the clicked figure. others: the rest of its gallery. */
  async open(slide, index, others) {
    if (this.state !== "closed") return;
    this.state = "opening";
    this.slide = slide;
    this.others = others;
    this.index = index;
    this.returnFocus = document.activeElement;

    const img = slide.querySelector("img");
    this.previewImg.src = img.currentSrc || img.src;
    this.previewImg.alt = img.alt;
    this.groups.forEach((g) => g.classList.toggle("active", Number(g.dataset.index) === index));
    try { await this.previewImg.decode(); } catch { /* swap mid-flight: run anyway */ }
    if (this.state !== "opening") return;

    lockScroll(true);
    document.body.classList.add("is-preview");
    const wrapper = slide.querySelector(".gallery__img-wrapper");
    const caption = slide.querySelector("figcaption");
    wrapper.dataset.flipId = "preview";
    this.preview.dataset.flipId = "preview";
    gsap.set(wrapper, { rotationX: 0 });

    const state = Flip.getState(wrapper);
    this.content.hidden = false;
    gsap.killTweensOf(wrapper);
    gsap.set(wrapper, { autoAlpha: 0 });

    this.split = SplitText.create(this.content.querySelectorAll(".content__group.active > :not(a)"), {
      type: "lines,chars",
      linesClass: "split-line",
      charsClass: "char",
      mask: "lines",
    });
    const cta = this.content.querySelector(".content__group.active .content__cta");

    if (env.reduced) {
      this.tl = gsap.timeline({ onComplete: () => this.opened() })
        .to(others, { autoAlpha: 0, duration: 0.3 }, 0)
        .fromTo(this.content, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35 }, 0);
      gsap.set(this.previewImg, { scale: 1 });
      return;
    }

    gsap.set(this.content, { autoAlpha: 1 });
    this.tl = gsap
      .timeline({ onComplete: () => this.opened(), onReverseComplete: () => this.reset() })
      .to(others, { autoAlpha: 0, scale: 0.9, duration: 0.6, ease: "m-out", stagger: { amount: 0.12, from: "center" } }, 0)
      .to(caption, { autoAlpha: 0, duration: 0.25, ease: "m-out" }, 0)
      .add(Flip.from(state, { targets: this.preview, duration: TIEMPOS.morph, ease: "m-inOut", absolute: true }), 0)
      .fromTo(this.previewImg, { scale: 1.2 }, { scale: 1, duration: TIEMPOS.morph * 1.2, ease: "m-inOut" }, 0)
      .fromTo(this.back, { autoAlpha: 0, y: -12 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "m-out" }, 0.7);

    this.split.lines.forEach((line, i) => {
      this.tl.fromTo(
        line.querySelectorAll(".char"),
        { yPercent: 125 },
        { yPercent: 0, duration: 0.9, ease: "m-out", stagger: 0.012 },
        0.72 + i * 0.07,
      );
    });
    if (cta) this.tl.fromTo(cta, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: "m-out" }, 1.05);
  }

  opened() {
    this.state = "open";
    this.back.focus({ preventScroll: true });
  }

  close() {
    if (this.state === "opening") {
      this.state = "closing";
      if (!this.tl) return this.reset();
      this.tl.timeScale(1.6).reverse();
      return;
    }
    if (this.state !== "open") return;
    this.state = "closing";
    document.body.classList.remove("is-preview");

    const wrapper = this.slide.querySelector(".gallery__img-wrapper");
    const caption = this.slide.querySelector("figcaption");

    if (env.reduced) {
      this.tl = gsap.timeline({ onComplete: () => this.reset() })
        .to(this.content, { autoAlpha: 0, duration: 0.3 }, 0)
        .to(this.others, { autoAlpha: 1, duration: 0.3 }, 0);
      return;
    }

    // Exit is faster than the entrance: the system is responding, not presenting
    this.tl = gsap
      .timeline({ onComplete: () => this.reset() })
      .to(this.content.querySelectorAll(".content__group.active .split-line, .content__group.active .content__cta, .content__back"), {
        autoAlpha: 0, y: -10, duration: 0.3, stagger: 0.03, ease: "m-out",
      }, 0)
      .add(Flip.fit(this.preview, wrapper, { duration: TIEMPOS.morphCierre, ease: "m-inOut", absolute: true }), 0.05)
      .to(this.previewImg, { scale: 1.2, duration: TIEMPOS.morphCierre, ease: "m-inOut" }, 0.05)
      .to(this.others, { autoAlpha: 1, scale: 1, duration: 0.6, ease: "m-out", stagger: { amount: 0.1, from: "center" } }, 0.45)
      .to(caption, { autoAlpha: 1, duration: 0.4, ease: "m-out" }, 0.6);
  }

  reset() {
    const wrapper = this.slide.querySelector(".gallery__img-wrapper");
    delete wrapper.dataset.flipId;
    this.split?.revert();
    this.split = null;
    this.content.hidden = true;
    document.body.classList.remove("is-preview");
    gsap.set([this.preview, this.previewImg, this.back, this.content], { clearProps: "all" });
    gsap.set(this.content.querySelectorAll(".content__cta"), { clearProps: "all" });
    gsap.set(wrapper, { autoAlpha: 1, clearProps: "transform" });
    gsap.set(this.others, { scale: 1 });
    this.tl = null;
    this.state = "closed";
    if (!document.querySelector(".endless:not([hidden])")) lockScroll(false);
    this.returnFocus?.focus?.({ preventScroll: true });
    this.onClose?.();
  }
}
