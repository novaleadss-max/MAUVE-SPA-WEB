/**
 * MAUVE — el tulipán del logo en 3D ligero (CSS, sin WebGL).
 *
 * Los cinco pétalos del logo son capas SVG separadas, cada una a una
 * profundidad distinta (translateZ) dentro de un contenedor con perspectiva.
 * Al inclinarse con el mouse o el giroscopio, las capas se desplazan entre sí
 * y la flor gana volumen. Abrirla = rotar cada pétalo desde su base.
 *
 * Todo es transform y opacity: la GPU lo compone sin volver a dibujar nada.
 * Los capítulos animan `state` con GSAP; aquí sólo se traduce a estilos.
 */
import { gsap } from "gsap";
import { TULIPAN } from "./config.js";

export class Bloom {
  constructor(el, { state, intro, hover, mobile = false }) {
    this.el = el;
    this.state = state;
    this.intro = intro;
    this.hover = hover;
    this.mobile = mobile;
    this.tiltEl = el.querySelector(".bloom__tilt");
    this.petals = [...el.querySelectorAll(".bloom__petal")].map((p) => ({
      el: p,
      ring: p.dataset.ring, // outer | mid | center
      side: Number(p.dataset.side || 0), // -1 left, 1 right, 0 centre
      z: Number(p.dataset.z || 0),
    }));
    this.loose = el.querySelector(".bloom__loose");
    this.pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    this.time = 0;
    this.last = "";

    this.resize();
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("pointermove", (e) => {
      this.pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      this.pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
    this.listenGyro();
    this.tick = this.tick.bind(this);
    gsap.ticker.add(this.tick);
  }

  /** The box is sized once for the largest flower the story uses. */
  resize() {
    this.vw = window.innerWidth;
    this.vh = window.innerHeight;
    this.unit = Math.min(this.vh, this.vw * 1.3);
    this.size = Math.round(0.4 * this.unit / 0.8); // flower ≈ 80% of the box height
    this.el.style.width = this.el.style.height = `${this.size}px`;
  }

  listenGyro() {
    const onOrient = (e) => {
      if (e.gamma == null) return;
      this.pointer.tx = gsap.utils.clamp(-1, 1, e.gamma / 25);
      this.pointer.ty = gsap.utils.clamp(-1, 1, (e.beta - 45) / 25);
    };
    const DOE = window.DeviceOrientationEvent;
    if (!DOE || !matchMedia("(pointer: coarse)").matches) return;
    if (typeof DOE.requestPermission === "function") {
      // iOS needs a gesture: ask once, on the first tap anywhere
      window.addEventListener("touchend", () => {
        DOE.requestPermission().then((s) => s === "granted" && window.addEventListener("deviceorientation", onOrient)).catch(() => {});
      }, { once: true });
    } else {
      window.addEventListener("deviceorientation", onOrient);
    }
  }

  tick(_, deltaMs) {
    const s = this.state;
    const alpha = s.opacity * Math.min(1, this.intro.v * 1.6);
    if (alpha < 0.005) {
      if (this.last !== "hidden") {
        this.el.style.opacity = "0";
        this.el.style.visibility = "hidden";
        this.last = "hidden";
      }
      return;
    }
    if (this.last === "hidden") this.el.style.visibility = "visible";
    this.last = "shown";

    const dt = Math.min(deltaMs / 1000, 0.05);
    this.time += dt;
    const k = 1 - Math.pow(1 - TULIPAN.respuestaMouse, dt * 60);
    this.pointer.x += (this.pointer.tx - this.pointer.x) * k;
    this.pointer.y += (this.pointer.ty - this.pointer.y) * k;

    // Place: one transform on the box
    const flowerPx = s.scale * this.unit * (0.55 + 0.45 * this.intro.v);
    const fit = flowerPx / (0.8 * this.size);
    const bob = Math.sin(this.time * 1.1) * TULIPAN.flotacion * this.unit;
    const x = ((s.x + 1) / 2) * this.vw - this.size / 2;
    const y = ((1 - s.y) / 2) * this.vh - this.size / 2 + bob;
    this.el.style.opacity = alpha.toFixed(3);
    this.el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${fit.toFixed(4)}) rotate(${(s.rotZ * 57.3).toFixed(2)}deg)`;

    // Tilt: pointer + a slow sway driven by the story's rotY (a flat-layered
    // flower never turns fully edge-on, so rotY becomes a sway, not a spin)
    const deg = 57.2958;
    const max = TULIPAN.inclinacionMouse * deg;
    const sway = Math.sin(s.rotY) * 24 + Math.sin(this.time * 0.7) * 6 + this.hover.look * -16;
    const rx = this.pointer.y * max * 0.6 + 8 + s.rotX * deg;
    const ry = this.pointer.x * max + sway;
    this.tiltEl.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;

    // Open: each petal rotates out from its base
    const open = gsap.utils.clamp(0, 1.2, s.open + this.hover.open);
    const breathe = Math.sin(this.time * 1.3) * 1.5;
    for (const p of this.petals) {
      let a = 0;
      let sc = 1;
      if (p.ring === "outer") a = p.side * (-20 + 46 * open + breathe);
      else if (p.ring === "mid") a = p.side * (-11 + 26 * open + breathe * 0.6);
      else sc = 0.92 + 0.12 * open;
      p.el.style.transform = `translateZ(${p.z}px) rotate(${a.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
    }
    if (this.loose) this.loose.style.opacity = (gsap.utils.clamp(0, 1, s.loose) * (this.mobile ? 0 : 1)).toFixed(3);
  }
}
