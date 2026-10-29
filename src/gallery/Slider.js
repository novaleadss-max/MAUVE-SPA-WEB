/**
 * Infinite gallery slider.
 *
 * Based on "Infinite Scroll Gallery with Page Transitions using GSAP"
 * by Surya Aditya for Codrops (MIT License):
 * https://github.com/surya-aditya/codrops-infinite-scroll-and-content-transition
 *
 * Mauve changes: one engine, two drivers. "scroll" is fed page-scroll deltas
 * while its section is pinned; "observer" listens to wheel/touch itself
 * (the full-screen endless mode). Slides also bend in 3D with the playhead's
 * velocity, so fast flicks feel like the paper is moving through air.
 */
import { gsap, Observer } from "../core/motion.js";
import verticalLoop from "./verticalLoop.js";
import { GALERIA } from "../config.js";

export default class Slider {
  constructor({ root, driver = "scroll", enabled = () => true, onToggle } = {}) {
    this.root = root;
    this.driver = driver;
    this.enabled = enabled;
    this.onToggle = onToggle;
    this.slides = [...root.querySelectorAll(".gallery__slide")];
    this.wrappers = this.slides.map((s) => s.querySelector(".gallery__img-wrapper"));
    this.bend = this.wrappers.map((w) => gsap.quickSetter(w, "rotationX", "deg"));

    this.createLoop();
    this.createParallax();
    this.createScrub();
    if (driver === "observer") this.createObserver();
    this.onResize = this.debounce(() => this.rebuild(), 200);
    window.addEventListener("resize", this.onResize);
  }

  /** Paused one-lap timeline: its playhead is our position */
  createLoop() {
    const gap = parseFloat(getComputedStyle(this.root).rowGap);
    this.loop = verticalLoop(this.slides, {
      repeat: -1,
      paused: true,
      paddingBottom: gap,
      speed: GALERIA.pxPorSegundo / 100,
    });
    this.wrap = gsap.utils.wrap(0, this.loop.duration());
  }

  /** Every slide travels at its own speed (data-speed, from content.js) */
  createParallax() {
    this.parallax = this.slides.map((el) => ({
      el,
      // Softened: the original anchors at the top edge, ours at the centre
      factor: (parseFloat(el.dataset.speed || 1) - 1) * 0.75,
      offset: 0,
      visible: false,
    }));
    this.applyParallax(true);
  }

  applyParallax(immediate = false) {
    const changes = [];
    const vh = window.innerHeight;
    this.parallax.forEach((item) => {
      const rect = item.el.getBoundingClientRect();
      const loopTop = rect.top - item.offset;
      // Zero offset when the slide crosses the middle of the screen, so speeds
      // diverge evenly above and below instead of tearing open gaps at the bottom
      item.offset = item.factor * (loopTop + rect.height / 2 - vh / 2);
      gsap.set(item.el, { y: item.offset });
      const top = loopTop + item.offset;
      const visible = top < vh && top + rect.height > 0;
      if (visible !== item.visible) {
        item.visible = visible;
        changes.push({ el: item.el, visible, top });
      }
    });
    if (changes.length) this.onToggle?.(changes, immediate);
  }

  /** Eased playhead (power3.out) that smooths the input into loop time */
  createScrub() {
    this.playhead = { time: 0 };
    this.last = { time: 0, at: performance.now(), vel: 0 };
    this.scrub = gsap.to(this.playhead, {
      time: 0,
      duration: GALERIA.inercia,
      ease: "power3.out",
      paused: true,
      onUpdate: () => {
        this.loop.time(this.wrap(this.playhead.time));
        this.applyParallax();
        this.applyBend();
      },
      onComplete: () => this.relax(),
    });
  }

  /** Velocity -> rotationX on each image: the faster, the more it bends */
  applyBend() {
    const now = performance.now();
    const dt = Math.max(now - this.last.at, 1);
    const v = ((this.playhead.time - this.last.time) / dt) * 1000; // loop-seconds per second
    this.last = { time: this.playhead.time, at: now, vel: v };
    const deg = gsap.utils.clamp(-14, 14, v * -0.9);
    this.bend.forEach((set) => set(deg));
  }

  relax() {
    gsap.to(this.wrappers, { rotationX: 0, duration: 0.6, ease: "m-out", overwrite: "auto" });
  }

  createObserver() {
    this.observer = Observer.create({
      target: this.root.closest(".endless") || window,
      type: "wheel,touch",
      preventDefault: true,
      onChange: ({ deltaX, deltaY, event }) => {
        const touch = event.type.startsWith("touch") || event.pointerType === "touch";
        const d = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
        this.push(touch ? -d * 1.6 : d);
      },
    });
  }

  /** Move the scrub target by a distance in px */
  push(px) {
    if (!this.enabled()) return;
    this.scrub.vars.time += (px * GALERIA.multiplicadorScroll) / 100;
    this.scrub.invalidate().restart();
  }

  freeze() {
    this.scrub.pause();
    this.scrub.vars.time = this.playhead.time;
    this.scrub.invalidate();
    this.relax();
  }

  stop() {
    this.observer?.disable();
    this.freeze();
  }

  start() {
    this.observer?.enable();
  }

  rebuild() {
    const progress = this.loop.progress();
    this.freeze();
    this.loop.kill();
    gsap.set(this.slides, { clearProps: "transform" });
    this.createLoop();
    this.loop.progress(progress, true);
    this.parallax.forEach((item) => (item.offset = 0));
    this.applyParallax(true);
    this.playhead.time = this.loop.time();
    this.scrub.vars.time = this.playhead.time;
    this.scrub.invalidate();
  }

  destroy() {
    window.removeEventListener("resize", this.onResize);
    this.observer?.kill();
    this.scrub.kill();
    this.loop.kill();
    gsap.set(this.slides, { clearProps: "transform" });
  }

  debounce(fn, ms) {
    let id;
    return () => {
      clearTimeout(id);
      id = setTimeout(fn, ms);
    };
  }
}
