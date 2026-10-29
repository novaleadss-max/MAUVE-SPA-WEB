import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
import { BRAND, GALLERY, SERVICES, HAIR_SEQUENCE, NAILS, wa, mapsUrl } from "./src/data/content.js";

/**
 * Builds the repeated markup (gallery, services, image stacks) from
 * src/data/content.js at build time, so the HTML ships with real content
 * (SEO, no-JS) and the copy lives in one file.
 */
const images = () => JSON.parse(readFileSync("./src/data/images.json", "utf8"));

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/** <picture> with AVIF + WebP srcset and real dimensions (no layout shift). */
function pic(name, { alt = "", sizes = "100vw", cls = "", eager = false, imgCls = "" } = {}) {
  const meta = images()[name];
  if (!meta) throw new Error(`Imagen desconocida: ${name}`);
  const set = (ext) => meta.widths.map((w) => `/img/${name}-${w}.${ext} ${w}w`).join(", ");
  const fallback = meta.widths.includes(800) ? 800 : meta.widths[0];
  return `<picture class="${cls}"><source type="image/avif" srcset="${set("avif")}" sizes="${sizes}"><source type="image/webp" srcset="${set("webp")}" sizes="${sizes}"><img class="${imgCls}" src="/img/${name}-${fallback}.webp" width="${meta.w}" height="${meta.h}" alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" draggable="false"></picture>`;
}

const blocks = {
  HAIR: () =>
    HAIR_SEQUENCE.map(
      (h, i) =>
        `<div class="hair__frame" data-label="${esc(h.label)}" style="--i:${i}">${pic(h.img, { alt: h.alt, sizes: "(max-width: 760px) 80vw, 40vw", eager: i === 0 })}</div>`,
    ).join(""),

  NAILS: () =>
    NAILS.map(
      (n, i) =>
        `<figure class="nails__card" style="--i:${i}">${pic(n.img, { alt: n.alt, sizes: "(max-width: 760px) 44vw, 20vw" })}</figure>`,
    ).join(""),

  SERVICES: () =>
    SERVICES.map(
      (s) => `
      <article class="svc svc--${s.layout}" id="servicio-${s.id}">
        <div class="svc__media js-tilt" data-cursor="ver">${pic(s.img, { alt: s.alt, sizes: "(max-width: 760px) 70vw, 32vw" })}</div>
        <div class="svc__text">
          <h3 class="svc__title">${esc(s.title)}</h3>
          <p class="svc__line">${esc(s.line)}</p>
          <a class="link-line svc__cta" href="${wa(`Hola Mauve, quiero información de ${s.title.toLowerCase()}.`)}" target="_blank" rel="noopener">Pregunta precio y cita</a>
        </div>
      </article>`,
    ).join(""),

  GALLERY: () =>
    GALLERY.map(
      (g, i) => `
      <div class="gallery__slide" style="--stagger:${g.stagger}vw;--img-w:${g.width}vw" data-speed="${g.speed}" data-index="${i}" data-cursor="ver" aria-label="Ver ${esc(g.title)}">
        <figure>
          <div class="gallery__img-wrapper">${pic(g.img, { alt: `${g.title}: ${g.desc}`, sizes: `(max-width: 760px) 60vw, ${Math.ceil(g.width * 1.2)}vw`, imgCls: "gallery__img" })}</div>
          <figcaption><span>${esc(g.title)}</span><span class="gallery__svc">${esc(g.service)}</span></figcaption>
        </figure>
      </div>`,
    ).join(""),

  GALLERY_CONTENT: () =>
    GALLERY.map(
      (g, i) => `
      <div class="content__group" data-index="${i}">
        <p class="content__svc">${esc(g.service)}</p>
        <h2 class="content__title">${esc(g.title)}</h2>
        <p class="content__description">${esc(g.desc)}</p>
        <a class="btn btn--light content__cta js-magnetic" href="${wa(`Hola Mauve, me encantó «${g.title}». ¿Me ayudan a agendar?`)}" target="_blank" rel="noopener"><span>Quiero agendarlo</span></a>
      </div>`,
    ).join(""),
};

const tokens = {
  WA_MAIN: () => wa("Hola Mauve, quiero agendar una cita."),
  WA_DISPLAY: () => BRAND.whatsappDisplay,
  IG: () => `https://www.instagram.com/${BRAND.instagram}`,
  IG_HANDLE: () => `@${BRAND.instagram}`,
  MAPS: () => mapsUrl,
  STREET: () => BRAND.address.street,
  AREA: () => BRAND.address.area,
  CITY: () => `${BRAND.address.postal} ${BRAND.address.city}, ${BRAND.address.region}`,
  HOURS: () => BRAND.hours ?? "Pregunta horarios por WhatsApp",
  URL: () => BRAND.url,
  YEAR: () => String(new Date().getFullYear()),
  PIC_HERO: () => pic("retrato-recorte", { alt: "Modelo con maquillaje cálido y ondas suaves, peinada y maquillada en Mauve", sizes: "(max-width: 760px) 100vw, 60vw", eager: true, cls: "hero__pic" }),
  PIC_SALON: () => pic("salon-muro", { alt: "Clienta de espaldas con ondas suaves frente al muro con el logo de Mauve", sizes: "100vw", cls: "finale__pic" }),
  PIC_STORY_A: () => pic("maquillaje-natural", { alt: "Maquillaje natural con piel luminosa", sizes: "(max-width: 760px) 40vw, 22vw" }),
  PIC_STORY_B: () => pic("unas-rosas", { alt: "Uñas pintadas a mano sosteniendo rosas amarillas", sizes: "(max-width: 760px) 40vw, 20vw" }),
  PIC_STORY_C: () => pic("ondas-mechas", { alt: "Ondas largas con luces caramelo", sizes: "(max-width: 760px) 36vw, 18vw" }),
  PIC_CTA: () => pic("maquillaje-delineado", { alt: "Maquillaje terminado con delineado y labio nude", sizes: "(max-width: 760px) 50vw, 24vw" }),
};

function mauveContent() {
  return {
    name: "mauve-content",
    transformIndexHtml(html) {
      return html
        .replace(/<!--\s*BLOCK:(\w+)\s*-->/g, (_, k) => blocks[k]())
        .replace(/%%(\w+)%%/g, (_, k) => tokens[k]());
    },
  };
}

export default defineConfig({
  plugins: [mauveContent()],
  build: { target: "es2022", assetsInlineLimit: 0 },
  server: { host: true, port: 5173 },
});
