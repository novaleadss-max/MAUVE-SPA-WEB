/**
 * MAUVE — preloader.
 * Fondo ciruela. El contorno del tulipán se dibuja, se llena de abajo hacia
 * arriba con el avance real de la carga y, al terminar, sus pétalos se
 * vuelven una ventana (máscara SVG) que crece hasta mostrar el hero.
 */
import { gsap, env } from "./core/motion.js";
import { TIEMPOS } from "./config.js";

export function runPreloader(tasks) {
  const root = document.querySelector(".preloader");
  const fill = root.querySelector(".preloader__tulip--fill");
  const outline = root.querySelector(".preloader__tulip:not(.preloader__tulip--fill)");
  const num = root.querySelector(".preloader__num");
  const hole = root.querySelector(".preloader__hole");
  const mark = root.querySelector(".preloader__mark");

  document.body.classList.add("is-loading");

  // Real progress: each task resolving moves the target forward
  let done = 0;
  const shown = { v: 0 };
  const target = () => (done / tasks.length) * 100;
  tasks.forEach((p) => Promise.resolve(p).catch(() => {}).finally(() => {
    done++;
    gsap.to(shown, { v: target(), duration: 0.8, ease: "m-out", overwrite: true, onUpdate: render });
  }));
  function render() {
    num.textContent = Math.round(shown.v);
    gsap.set(fill, { clipPath: `inset(${100 - shown.v}% 0% 0% 0%)` });
  }

  // Outline draws itself while we wait
  const paths = outline.querySelectorAll("path");
  paths.forEach((p) => {
    const len = p.getTotalLength();
    gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
  });
  gsap.to(paths, { strokeDashoffset: 0, duration: 1.4, ease: "m-inOut", stagger: 0.08 });
  gsap.set(hole, { scale: 0, svgOrigin: "50 50" });

  const minTime = new Promise((r) => setTimeout(r, env.reduced ? 200 : TIEMPOS.preloaderMin * 1000));

  return Promise.all([Promise.allSettled(tasks), minTime]).then(
    () =>
      new Promise((resolve) => {
        gsap.to(shown, {
          v: 100, duration: 0.4, ease: "m-out", overwrite: true, onUpdate: render,
          onComplete: () => {
            if (env.reduced) {
              gsap.to(root, { autoAlpha: 0, duration: 0.4, onComplete: () => finish(resolve) });
              resolve({ revealAt: 0 });
              return;
            }
            const tl = gsap.timeline({ onComplete: () => finish() });
            tl.to(num, { autoAlpha: 0, yPercent: -30, duration: 0.4, ease: "m-out" }, 0)
              .to(outline, { autoAlpha: 0, duration: 0.3, ease: "m-out" }, 0)
              .to(fill.querySelector(".t-arch"), { autoAlpha: 0, duration: 0.3 }, 0)
              // The filled petals become windows onto the page
              .set(hole, { scale: 1 }, 0.32)
              .set(mark, { autoAlpha: 0 }, 0.32)
              .to(hole, { scale: 36, duration: TIEMPOS.mascara, ease: "m-inOut" }, 0.34);
            resolve({ revealAt: 0.34 + TIEMPOS.mascara * 0.42 });
          },
        });
      }),
  );

  function finish() {
    root.remove();
    document.body.classList.remove("is-loading");
  }
}
