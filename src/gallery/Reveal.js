/**
 * Slide reveals (image + caption) as slides enter the viewport.
 *
 * Based on "Infinite Scroll Gallery with Page Transitions using GSAP"
 * by Surya Aditya for Codrops (MIT License):
 * https://github.com/surya-aditya/codrops-infinite-scroll-and-content-transition
 *
 * Mauve changes: the image also opens with a clip from the bottom and settles
 * from a deeper zoom, and the caption characters rise out of a line mask
 * instead of only fading.
 */
import { gsap, SplitText } from "../core/motion.js";

export default class Reveal {
  constructor(root) {
    this.items = new Map();
    root.querySelectorAll(".gallery__slide").forEach((slide) => {
      const wrapper = slide.querySelector(".gallery__img-wrapper");
      const img = slide.querySelector(".gallery__img");
      const split = SplitText.create(slide.querySelector("figcaption"), {
        type: "chars",
        charsClass: "char",
        aria: "none",
      });
      gsap.set(wrapper, { autoAlpha: 0, clipPath: "inset(18% 0% 0% 0%)" });
      gsap.set(img, { scale: 1.42 });
      gsap.set(split.chars, { autoAlpha: 0, yPercent: 70 });
      this.items.set(slide, { wrapper, img, chars: split.chars });
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
    const { wrapper, img, chars } = it;
    if (immediate) {
      gsap.set(wrapper, { autoAlpha: 1, clipPath: "inset(0% 0% 0% 0%)", overwrite: true });
      gsap.set(img, { scale: 1.2, overwrite: true });
      gsap.set(chars, { autoAlpha: 1, yPercent: 0, overwrite: true });
      return;
    }
    gsap.to(wrapper, { autoAlpha: 1, clipPath: "inset(0% 0% 0% 0%)", duration: 1.1, ease: "m-out", delay, overwrite: true });
    gsap.to(img, { scale: 1.2, duration: 1.6, ease: "m-out", delay, overwrite: true });
    gsap.to(chars, { autoAlpha: 1, yPercent: 0, duration: 0.7, ease: "m-out", stagger: 0.022, delay: delay + 0.25, overwrite: true });
  }

  /** Instant reset so the reveal replays on the next entry */
  hide(slide) {
    const it = this.items.get(slide);
    if (!it) return;
    gsap.set(it.wrapper, { autoAlpha: 0, clipPath: "inset(18% 0% 0% 0%)", overwrite: true });
    gsap.set(it.img, { scale: 1.42, overwrite: true });
    gsap.set(it.chars, { autoAlpha: 0, yPercent: 70, overwrite: true });
  }
}
