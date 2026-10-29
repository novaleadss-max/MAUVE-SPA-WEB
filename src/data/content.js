/**
 * MAUVE — contenido del sitio.
 * Todo el texto y los datos de contacto viven aquí. El HTML de la galería y de
 * los servicios se genera desde este archivo al compilar (ver vite.config.js).
 *
 * Datos verificados:
 *  - WhatsApp: +52 222 470 3861 (dado por el cliente)
 *  - Instagram: @mauve_puebla (dado por el cliente)
 *  - Dirección: listado público de Fresha "Mauve Salón Uñas Spa" — CONFIRMAR con el cliente.
 * Placeholders (pendientes del cliente): horario, precios.
 */

export const BRAND = {
  name: "Mauve",
  legalName: "Mauve Salón · Uñas · Spa",
  tagline: "Salón, uñas y spa en Puebla.",
  whatsapp: "522224703861",
  whatsappDisplay: "+52 222 470 3861",
  instagram: "mauve_puebla",
  address: {
    street: "Del Rey 1701",
    area: "Reserva Territorial Atlixcáyotl",
    postal: "72480",
    city: "Puebla",
    region: "Pue.",
  },
  // PLACEHOLDER: el cliente no ha dado horario. Mientras sea null se invita a preguntar por WhatsApp.
  hours: null,
  url: "https://mauve-puebla.example/", // PLACEHOLDER: dominio final
};

export const wa = (text) =>
  `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(text)}`;

export const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `Mauve Salón ${BRAND.address.street}, ${BRAND.address.area}, ${BRAND.address.postal} ${BRAND.address.city}`,
)}`;

/** Capítulo 2: secuencia de color (se recorre con el scroll). */
export const HAIR_SEQUENCE = [
  { img: "balayage-perfil", label: "Balayage", alt: "Cabello largo y liso con balayage rubio miel, de perfil" },
  { img: "balayage-liso", label: "Balayage", alt: "Cabello liso de espalda con raíz oscura fundida en rubio" },
  { img: "ondas-espalda", label: "Ondas", alt: "Ondas definidas con mechas caramelo, vista de espalda" },
  { img: "ondas-mechas", label: "Ondas", alt: "Ondas largas sobre base oscura con luces caramelo" },
  { img: "corte-capas", label: "Capas", alt: "Corte en capas con volumen y mechas suaves" },
  { img: "capas-castano", label: "Capas", alt: "Capas largas en castaño con luces doradas" },
];

/** Capítulo 3: uñas que entran en abanico 3D. */
export const NAILS = [
  { img: "unas-arte-color", alt: "Uñas con diseño a mano en lila, amarillo y colores vivos" },
  { img: "unas-french-negro", alt: "Uñas estilo francés con punta negra y detalle floral" },
  { img: "unas-rosas", alt: "Uñas almendra amarillas con trazos negros sosteniendo rosas" },
  { img: "unas-perla", alt: "Uñas almendra cortas con efecto perla" },
  { img: "unas-french-nude", alt: "Uñas almendra nude con punta amarilla" },
];

/** Capítulo 5: servicios (sin precios: el cliente no los ha dado). */
export const SERVICES = [
  {
    id: "cabello",
    title: "Cabello",
    line: "Color, balayage, corte en capas y peinado.",
    img: "corte-capas",
    alt: "Corte en capas con mechas suaves",
    layout: "a",
  },
  {
    id: "maquillaje",
    title: "Maquillaje",
    line: "De día, para un evento o para tu foto.",
    img: "maquillaje-delineado",
    alt: "Maquillaje con delineado alargado y labio nude",
    layout: "b",
  },
  {
    id: "unas",
    title: "Uñas",
    line: "Gel, estilo francés y diseño pintado a mano.",
    img: "unas-arte-color",
    alt: "Uñas con arte de colores pintado a mano",
    layout: "c",
  },
  {
    id: "faciales",
    title: "Faciales",
    line: "Limpieza facial profunda en cabina.",
    img: "facial",
    alt: "Especialista realizando una limpieza facial",
    layout: "a",
  },
  {
    id: "masajes",
    title: "Masajes",
    line: "Masaje relajante de rostro y cuello.",
    img: "masaje-facial",
    alt: "Terapeuta dando un masaje de cuello y rostro",
    layout: "b",
  },
  {
    id: "pedicure",
    title: "Pedicure",
    line: "Cuidado completo para tus pies.",
    img: "pedicure",
    alt: "Especialista realizando un pedicure",
    layout: "c",
  },
];

/**
 * Galería infinita: 18 fotos de la sesión.
 * stagger / width: desfase lateral y ancho (vw) de cada foto en escritorio.
 * speed: factor de parallax de cada foto (>1 más rápida, <1 más lenta).
 */
export const GALLERY = [
  { img: "maquillaje-natural", title: "Glow natural", service: "Maquillaje", desc: "Piel luminosa, rubor durazno y labio nude. Un maquillaje que se ve como tú, en tu mejor día.", stagger: -24, width: 21, speed: 1.3 },
  { img: "balayage-perfil", title: "Balayage miel", service: "Color", desc: "Raíz oscura que se funde en rubio miel, liso y con brillo de punta a punta.", stagger: 16, width: 15, speed: 0.8 },
  { img: "ondas-espalda", title: "Ondas definidas", service: "Peinado", desc: "Rizos marcados de medios a puntas sobre mechas caramelo.", stagger: -14, width: 24, speed: 1.15 },
  { img: "unas-arte-color", title: "Arte en color", service: "Uñas", desc: "Diseño pintado a mano en lila, amarillo y toques de color vivo.", stagger: 24, width: 17, speed: 0.7 },
  { img: "unas-french-negro", title: "Francés negro", service: "Uñas", desc: "Punta negra fina con un detalle floral en cada mano.", stagger: -27, width: 18, speed: 1.25 },
  { img: "facial", title: "Limpieza facial", service: "Faciales", desc: "Limpieza profunda y extracción en cabina, con la piel protegida en todo momento.", stagger: 26, width: 26, speed: 0.85 },
  { img: "corte-capas", title: "Capas con volumen", service: "Corte", desc: "Corte en capas con mechas suaves, peinado hacia afuera.", stagger: -18, width: 19, speed: 1.3 },
  { img: "maquillaje-delineado", title: "Delineado felino", service: "Maquillaje", desc: "Sombra cálida, delineado alargado y labio rosado mate.", stagger: 10, width: 25, speed: 0.8 },
  { img: "pedicure", title: "Pedicure spa", service: "Pedicure", desc: "Cuidado completo de pies, de la cutícula al esmalte.", stagger: -20, width: 22, speed: 1.15 },
  { img: "balayage-liso", title: "Rubio fundido", service: "Color", desc: "Balayage largo y pulido: la raíz se queda, el rubio aparece de a poco.", stagger: 18, width: 16, speed: 0.7 },
  { img: "ondas-mechas", title: "Ondas caramelo", service: "Peinado", desc: "Ondas largas sobre base oscura con luces caramelo.", stagger: -24, width: 20, speed: 1.25 },
  { img: "unas-french-nude", title: "Francés limón", service: "Uñas", desc: "Almendra nude con punta amarilla, fina y limpia.", stagger: 27, width: 14, speed: 0.85 },
  { img: "masaje-facial", title: "Masaje facial", service: "Masajes", desc: "Masaje relajante de cuello y rostro para soltar la tensión del día.", stagger: -16, width: 23, speed: 1.3 },
  { img: "capas-castano", title: "Castaño iluminado", service: "Color", desc: "Capas largas en castaño con luces doradas alrededor del rostro.", stagger: 22, width: 19, speed: 0.8 },
  { img: "retrato-hero", title: "Ojos de día", service: "Maquillaje", desc: "Sombra en tonos tierra, pestañas definidas y labio rosado.", stagger: -26, width: 18, speed: 1.15 },
  { img: "unas-rosas", title: "Trazos a mano", service: "Uñas", desc: "Almendra larga en amarillo pastel con trazos negros pintados a mano.", stagger: 14, width: 24, speed: 0.7 },
  { img: "unas-perla", title: "Efecto perla", service: "Uñas", desc: "Almendra corta con brillo perlado que cambia con la luz.", stagger: -20, width: 17, speed: 1.25 },
  { img: "salon-muro", title: "Ondas al natural", service: "Peinado", desc: "Cabello negro con ondas suaves, frente a nuestro muro en el salón.", stagger: 20, width: 22, speed: 0.85 },
];
