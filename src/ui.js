/**
 * MAUVE — interacción: cursor, botones magnéticos y tilt 3D.
 * Todo esto existe solo con puntero fino (mouse/trackpad): en touch no hay
 * hover que imitar, así que no se instala.
 */
import { gsap, env } from "./core/motion.js";
import { INTERACCION } from "./config.js";

export function initCursor() {
  if (!env.finePointer) return;
  document.documentElement.classList.add("has-cursor");
  const el = document.querySelector(".cursor");
  const label = el.querySelector(".cursor__label");
  const d = INTERACCION.cursorSeguimiento;
  // Dot follows tightly, the ring trails: two speeds read as one object with mass
  const dot = { x: gsap.quickTo(el.querySelector(".cursor__dot"), "x", { duration: d * 0.4, ease: "m-out" }), y: gsap.quickTo(el.querySelector(".cursor__dot"), "y", { duration: d * 0.4, ease: "m-out" }) };
  const ring = { x: gsap.quickTo(el.querySelector(".cursor__ring"), "x", { duration: d * 2.2, ease: "m-out" }), y: gsap.quickTo(el.querySelector(".cursor__ring"), "y", { duration: d * 2.2, ease: "m-out" }) };

  window.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    dot.x(e.clientX); dot.y(e.clientY);
    ring.x(e.clientX); ring.y(e.clientY);
    el.classList.remove("is-hidden");
  }, { passive: true });
  document.addEventListener("pointerleave", () => el.classList.add("is-hidden"));
  window.addEventListener("pointerdown", () => el.classList.add("is-down"));
  window.addEventListener("pointerup", () => el.classList.remove("is-down"));

  const labels = { ver: "Ver", drag: "Desliza" };
  document.addEventListener("pointerover", (e) => {
    const t = e.target.closest("[data-cursor], a, button");
    let state = "";
    if (t?.dataset.cursor) state = t.dataset.cursor;
    else if (t) state = "link";
    el.dataset.state = state;
    if (labels[state]) label.textContent = labels[state];
  });
}

export function initMagnetic() {
  if (!env.finePointer || env.reduced) return;
  document.querySelectorAll(".js-magnetic").forEach((btn) => {
    const inner = btn.querySelector("span");
    // xPercent/yPercent so we never fight the timelines that own x / y
    const bx = gsap.quickTo(btn, "xPercent", { duration: 0.6, ease: "m-out" });
    const by = gsap.quickTo(btn, "yPercent", { duration: 0.6, ease: "m-out" });
    const ix = inner && gsap.quickTo(inner, "x", { duration: 0.6, ease: "m-out" });
    const iy = inner && gsap.quickTo(inner, "y", { duration: 0.6, ease: "m-out" });
    let active = false;

    const move = (e) => {
      const r = btn.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = e.clientX - cx, dy = e.clientY - cy;
      const reach = Math.max(r.width, r.height) * 0.5 * INTERACCION.radioMagnetico + 24;
      if (Math.hypot(dx, dy) < reach) {
        active = true;
        const m = INTERACCION.magnetismo;
        bx(((dx * m) / r.width) * 100); by(((dy * m) / r.height) * 100);
        ix?.(dx * m * 0.45); iy?.(dy * m * 0.45);
      } else if (active) {
        active = false;
        bx(0); by(0); ix?.(0); iy?.(0);
      }
    };
    window.addEventListener("pointermove", move, { passive: true });
  });
}

export function initTilt() {
  if (!env.finePointer || env.reduced) return;
  document.querySelectorAll(".js-tilt").forEach((card) => {
    const target = card.querySelector("picture") || card;
    gsap.set(target, { transformPerspective: 900 });
    const rx = gsap.quickTo(target, "rotationX", { duration: 0.7, ease: "m-out" });
    const ry = gsap.quickTo(target, "rotationY", { duration: 0.7, ease: "m-out" });
    const sc = gsap.quickTo(target, "scale", { duration: 0.7, ease: "m-out" });
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      rx(-py * INTERACCION.tiltMax);
      ry(px * INTERACCION.tiltMax);
      sc(1.04);
    });
    card.addEventListener("pointerleave", () => { rx(0); ry(0); sc(1); });
  });
}
