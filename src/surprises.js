/**
 * MAUVE — sorpresas.
 *  1. Lluvia de pétalos al tocar el tulipán del logo (canvas 2D, se apaga sola).
 *  2. Si cambias de pestaña, el título te guarda el lugar.
 * (La 3ª, "La sesión sin fin", vive en src/gallery/index.js;
 *  la 4ª, el tulipán que florece al pasar por el botón final, en sections.js.)
 */
import { env } from "./core/motion.js";
import { COLORS, SORPRESAS } from "./config.js";

export function initPetalRain() {
  const canvas = document.querySelector(".petal-rain");
  const ctx = canvas.getContext("2d");
  const colors = [COLORS.mauve, COLORS.lavanda, "#9a96cf", COLORS.rosaPalido];
  let petals = [];
  let running = false;
  let last = 0;
  const dpr = Math.min(window.devicePixelRatio, 2);

  const size = () => {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
  };

  // Almond petal, same outline as the logo's petals
  const draw = (p) => {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.scale(1, Math.cos(p.flip)); // the flip reads as 3D tumbling
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.moveTo(0, -p.s);
    ctx.bezierCurveTo(p.s * 0.7, -p.s * 0.45, p.s * 0.55, p.s * 0.7, 0, p.s);
    ctx.bezierCurveTo(-p.s * 0.55, p.s * 0.7, -p.s * 0.7, -p.s * 0.45, 0, -p.s);
    ctx.fill();
    ctx.restore();
  };

  const frame = (t) => {
    const dt = Math.min((t - last) / 1000, 0.05);
    last = t;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const h = window.innerHeight;
    petals = petals.filter((p) => p.y < h + 60);
    for (const p of petals) {
      p.vy += 180 * dt * (1 - p.vy / p.term); // gravity until terminal velocity
      p.y += p.vy * dt;
      p.x += (p.vx + Math.sin(t / 1000 * p.freq + p.phase) * p.sway) * dt;
      p.vx *= 0.985;
      p.rot += p.spin * dt;
      p.flip += p.flipSpeed * dt;
      draw(p);
    }
    if (petals.length) requestAnimationFrame(frame);
    else {
      running = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const burst = (ox, oy) => {
    const count = env.mobile ? Math.round(SORPRESAS.petalosLluvia / 2) : SORPRESAS.petalosLluvia;
    for (let i = 0; i < count; i++) {
      const fromOrigin = i < count * 0.35;
      petals.push({
        x: fromOrigin ? ox : Math.random() * window.innerWidth,
        y: fromOrigin ? oy : -40 - Math.random() * window.innerHeight * 0.6,
        vx: fromOrigin ? (Math.random() - 0.3) * 520 : (Math.random() - 0.5) * 40,
        vy: fromOrigin ? -200 - Math.random() * 260 : 40 + Math.random() * 60,
        term: 90 + Math.random() * 90,
        s: 7 + Math.random() * 11,
        rot: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 3,
        flip: Math.random() * Math.PI,
        flipSpeed: 2 + Math.random() * 4,
        sway: 30 + Math.random() * 50,
        freq: 1 + Math.random() * 1.5,
        phase: Math.random() * 6,
        color: colors[i % colors.length],
      });
    }
    if (!running) {
      running = true;
      size();
      last = performance.now();
      requestAnimationFrame(frame);
    }
  };

  window.addEventListener("resize", () => running && size());
  document.querySelectorAll(".js-logo").forEach((logo) =>
    logo.addEventListener("click", () => {
      if (env.reduced) return;
      const r = logo.querySelector(".brand__mark").getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2);
    }),
  );
  return { burst };
}

export function initTabTitle() {
  const original = document.title;
  document.addEventListener("visibilitychange", () => {
    document.title = document.hidden ? SORPRESAS.tituloAusente : original;
  });
}
