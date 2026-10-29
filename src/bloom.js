/**
 * MAUVE — el tulipán lila que florece.
 *
 * Viene de un video (assets/originales/tulipan-video.mp4) recortado de su
 * pantalla verde y convertido en una hoja de 36 cuadros con transparencia
 * (public/flor/, script: scripts/flor-desde-video.py). Una hoja de cuadros en
 * vez de un video con alfa porque Safari/iPhone no muestran video transparente.
 *
 * `state.open` (0 = capullo, 1 = abierto) elige el cuadro: el scroll hace
 * florecer la flor. Entre dos cuadros se funden para que no se note el salto.
 * Sólo se redibuja el canvas cuando la apertura cambia; moverla, escalarla e
 * inclinarla es transform puro, sin dibujar nada.
 */
import { gsap } from "gsap";
import { TULIPAN } from "./config.js";

const SHEET = {
  desktop: { src: "/flor/tulipan-desktop.webp", w: 680, h: 492 },
  mobile: { src: "/flor/tulipan-mobile.webp", w: 380, h: 275 },
  frames: 36,
  cols: 6,
};

export class Bloom {
  constructor(el, { state, intro, hover, mobile = false }) {
    this.el = el;
    this.state = state;
    this.intro = intro;
    this.hover = hover;
    this.mobile = mobile;
    this.tiltEl = el.querySelector(".bloom__tilt");
    this.canvas = el.querySelector(".bloom__canvas");
    this.ctx = this.canvas.getContext("2d");
    this.sheet = mobile ? SHEET.mobile : SHEET.desktop;
    this.canvas.width = this.sheet.w;
    this.canvas.height = this.sheet.h;
    this.pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    this.appear = { v: 0 };
    this.time = 0;
    this.drawn = -1;
    this.hidden = true;

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

  /** Download and decode the frames off the critical path; fade in when ready. */
  load() {
    const img = new Image();
    img.decoding = "async";
    img.src = this.sheet.src;
    return img.decode()
      .then(() => (window.createImageBitmap ? createImageBitmap(img) : img))
      .then((bmp) => {
        this.bitmap = bmp;
        this.drawn = -1;
        gsap.to(this.appear, { v: 1, duration: 0.9, ease: "m-out" });
      })
      .catch(() => {});
  }

  /** The box keeps the frame's proportions; its height is sized once. */
  resize() {
    this.vw = window.innerWidth;
    this.vh = window.innerHeight;
    this.unit = Math.min(this.vh, this.vw * 1.3);
    this.boxH = Math.round((0.4 * this.unit) / 0.9); // the flower is ~90% of the frame height
    this.boxW = Math.round(this.boxH * (this.sheet.w / this.sheet.h));
    this.el.style.width = `${this.boxW}px`;
    this.el.style.height = `${this.boxH}px`;
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
      window.addEventListener("touchend", () => {
        DOE.requestPermission().then((s) => s === "granted" && window.addEventListener("deviceorientation", onOrient)).catch(() => {});
      }, { once: true });
    } else {
      window.addEventListener("deviceorientation", onOrient);
    }
  }

  /** Draw the bloom at a fractional frame: two neighbours blended. */
  draw(f) {
    const { w, h } = this.sheet;
    const i = Math.floor(f);
    const t = f - i;
    const c = this.ctx;
    const src = (n) => [(n % SHEET.cols) * w, Math.floor(n / SHEET.cols) * h];
    c.clearRect(0, 0, w, h);
    c.globalAlpha = 1;
    c.drawImage(this.bitmap, ...src(i), w, h, 0, 0, w, h);
    if (t > 0.02 && i + 1 < SHEET.frames) {
      c.globalAlpha = t;
      c.drawImage(this.bitmap, ...src(i + 1), w, h, 0, 0, w, h);
    }
  }

  tick(_, deltaMs) {
    const s = this.state;
    const alpha = s.opacity * Math.min(1, this.intro.v * 1.6) * this.appear.v;
    if (alpha < 0.005 || !this.bitmap) {
      if (!this.hidden) {
        this.el.style.visibility = "hidden";
        this.hidden = true;
      }
      return;
    }
    if (this.hidden) {
      this.el.style.visibility = "visible";
      this.hidden = false;
    }

    const dt = Math.min(deltaMs / 1000, 0.05);
    this.time += dt;
    const k = 1 - Math.pow(1 - TULIPAN.respuestaMouse, dt * 60);
    this.pointer.x += (this.pointer.tx - this.pointer.x) * k;
    this.pointer.y += (this.pointer.ty - this.pointer.y) * k;

    // Place: one transform on the box (compositor only)
    const flowerPx = s.scale * this.unit * (0.55 + 0.45 * this.intro.v);
    const fit = flowerPx / (0.9 * this.boxH);
    const bob = Math.sin(this.time * 1.1) * TULIPAN.flotacion * this.unit;
    const x = ((s.x + 1) / 2) * this.vw - this.boxW / 2;
    const y = ((1 - s.y) / 2) * this.vh - this.boxH / 2 + bob;
    this.el.style.opacity = alpha.toFixed(3);
    this.el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${fit.toFixed(4)}) rotate(${(s.rotZ * 40).toFixed(2)}deg)`;

    // Tilt: small angles only, it is a photograph (a gentle lean, never a card flip)
    const max = TULIPAN.inclinacionMouse * 30;
    const sway = Math.sin(s.rotY) * 8 + Math.sin(this.time * 0.7) * 3 + this.hover.look * -8;
    this.tiltEl.style.transform = `rotateX(${(this.pointer.y * max * 0.5 + s.rotX * 20).toFixed(2)}deg) rotateY(${(this.pointer.x * max + sway).toFixed(2)}deg)`;

    // Bloom: the scroll (and the CTA hover) choose the frame. At rest nothing redraws.
    const open = gsap.utils.clamp(0, 1, s.open + this.hover.open);
    const f = Math.round(open * (SHEET.frames - 1) * 64) / 64;
    if (f !== this.drawn) {
      this.draw(f);
      this.drawn = f;
    }
  }
}
