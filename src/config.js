/**
 * MAUVE — perillas de ajuste.
 * Todo lo que controla tiempos, velocidades y colores está aquí arriba.
 * Cambia un valor, guarda y el navegador se recarga solo (npm run dev).
 */

/* ── Colores (mismos valores que en src/styles/tokens.css) ─────────────── */
export const COLORS = {
  rosa: "#C98086", // el fondo de la sesión de fotos: fondo de la página
  rosaPalido: "#F1D9D6",
  ciruela: "#2A1520", // oscuro de marca (preloader, servicios, footer)
  mauve: "#7D78B8", // lavanda del logo
  lavanda: "#B3B0DD",
  crema: "#F6EEE9",
};

/* ── Duración de scroll de cada capítulo ───────────────────────────────────
 * "+=150%" = el capítulo dura 1.5 alturas de pantalla de scroll.
 * Súbelo para que el capítulo vaya más lento; bájalo para que pase más rápido. */
export const CAPITULO_1_SCROLL = "+=130%"; // Inicio: el tulipán se abre
export const CAPITULO_2_SCROLL = "+=180%"; // El color: secuencia de cabello
export const CAPITULO_3_SCROLL = "+=150%"; // El detalle: abanico de uñas
export const CAPITULO_4_SCROLL = "+=150%"; // El remate: el salón + la marca
export const CAPITULO_5_SCROLL = "+=280%"; // Servicios: carril horizontal
export const GALERIA_SCROLL = "+=240%"; // Galería infinita fijada
export const CAPITULO_6_SCROLL = "+=110%"; // Historia: texto que se rellena

/** En celular todos los capítulos se acortan por este factor (menos pin, nada "atorado"). */
export const FACTOR_SCROLL_MOVIL = 0.62;

/* ── Curvas (cubic-bezier hechas a medida, registradas como CustomEase) ── */
export const EASES = {
  out: "0.23, 1, 0.32, 1", // entradas: arranca rápido, frena largo
  inOut: "0.77, 0, 0.175, 1", // movimientos en pantalla: morph, cortinas
  drawer: "0.32, 0.72, 0, 1", // estilo iOS: paneles y preview
  soft: "0.45, 0, 0.2, 1", // fondos y cambios de tono
};

/* ── Tiempos (segundos) según el peso de cada elemento ──────────────────── */
export const TIEMPOS = {
  presion: 0.14, // botones al presionar
  hover: 0.22, // hovers y subrayados
  letra: 0.9, // cada letra en un reveal
  staggerLetra: 0.028, // retraso entre letras
  titular: 1.3, // titulares grandes
  preloaderMin: 1.6, // el preloader dura al menos esto, aunque todo cargue antes
  mascara: 1.45, // el tulipán del preloader abriéndose a pantalla completa
  morph: 1.15, // galería: foto -> preview
  morphCierre: 0.9,
};

/* ── Galería infinita (referencia Codrops) ─────────────────────────────── */
export const GALERIA = {
  inercia: 0.7, // duración del suavizado del playhead (power3.out)
  pxPorSegundo: 100, // velocidad base del loop
  multiplicadorScroll: 1.35, // cuánto avanza la galería por px de scroll
};

/* ── 3D: tulipán ──────────────────────────────────────────────────────── */
export const TULIPAN = {
  dprMax: 1.5, // densidad de píxeles máxima en escritorio
  dprMaxMovil: 1.25,
  segmentos: 28, // resolución de cada pétalo (móvil usa la mitad)
  respuestaMouse: 0.06, // qué tan rápido sigue al mouse (0-1)
  inclinacionMouse: 0.38, // radianes máximos de inclinación con el mouse
  flotacion: 0.06, // amplitud del flotado
  giroLento: 0.12, // rad/s de rotación en reposo
};

/* ── Interacción ───────────────────────────────────────────────────────── */
export const INTERACCION = {
  magnetismo: 0.32, // cuánto se acerca un botón magnético al cursor
  radioMagnetico: 1.35, // multiplicador del tamaño del botón para activar el imán
  tiltMax: 8, // grados de inclinación 3D en tarjetas
  cursorSeguimiento: 0.16, // segundos que tarda el cursor en alcanzar al puntero
};

/* ── Sorpresas ─────────────────────────────────────────────────────────── */
export const SORPRESAS = {
  petalosLluvia: 70, // pétalos al hacer clic en el logo (móvil usa la mitad)
  tituloAusente: "Te guardamos tu lugar · Mauve",
};
