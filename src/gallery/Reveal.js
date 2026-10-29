/**
 * Slide reveals (image + caption) as slides enter the viewport.
 *
 * Based on "Infinite Scroll Gallery with Page Transitions using GSAP"
 * by Surya Aditya for Codrops (MIT License):
 * https://github.com/surya-aditya/codrops-infinite-scroll-and-content-transition
 *
 * Mauve changes: the image settles from a deeper zoom as it fades in, and the
 * caption's words rise as they appear. Opacity and transform only: nothing here
 * makes the browser repaint while the gallery moves.
 */
import { gsap, SplitText } from "../core/motion.js";

export default class Reveal {
  constructor(root) {
    this.items = new Map();
    root.querySelectorAll(".gallery__slide").forEach((slide) => {
      const wrapper = slide.querySelector(".gallery__img-wrapper");
      const img = slide.querySelector(".gallery__img");
      // Whole words fade up (never single letters, so nothing reads as broken)
      const split = SplitText.create(slide.querySelector("figcaption"), {
        type: "words",
        wordsClass: "word",
        aria: "none",
      });
      gsap.set(wrapper, { autoAlpha: 0 });
      gsap.set(img, { scale: 1.42 });
      gsap.set(split.words, { autoAlpha: 0, yPercent: 70 });
      this.items.set(slide, { wrapper, img, words: split.words });
    });
  }

  toggle(changes, immediate = false) {
    changes
      .filter((c) => c.visible)
      .sort((a, b) => a.top - b.top)
      .forEach((c, i) => this.show(c.el, i * 0.1, immediate));
    changes.filter((c) => !c.visible).forEach((c) => this.hide(c.el));
  }

  show(slide, delay, immediate = false) {
    const it = this.items.get(slide);
    if (!it) return;
    const { wrapper, img, words } = it;
    if (immediate) {
      gsap.set(wrapper, { autoAlpha: 1, overwrite: true });
      gsap.set(img, { scale: 1.2, overwrite: true });
      gsap.set(words, { autoAlpha: 1, yPercent: 0, overwrite: true });
      return;
    }
    gsap.to(wrapper, { autoAlpha: 1, duration: 0.9, ease: "m-out", delay, overwrite: true });
    gsap.to(img, { scale: 1.2, duration: 1.6, ease: "m-out", delay, overwrite: true });
    gsap.to(words, { autoAlpha: 1, yPercent: 0, duration: 0.7, ease: "m-out", stagger: 0.022, delay: delay + 0.25, overwrite: true });
  }

  /** Instant reset so the reveal replays on the next entry */
  hide(slide) {
    const it = this.items.get(slide);
    if (!it) return;
    gsap.set(it.wrapper, { autoAlpha: 0, overwrite: true });
    gsap.set(it.img, { scale: 1.42, overwrite: true });
    gsap.set(it.words, { autoAlpha: 0, yPercent: 70, overwrite: true });
  }
}
