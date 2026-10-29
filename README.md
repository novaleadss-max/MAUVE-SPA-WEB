# Mauve · sitio web

Salón, uñas y spa en Puebla. Sitio de una sola página con scrollytelling,
un tulipán en 3D (el del logo) y una galería infinita de la sesión de fotos.

## Correr el proyecto

```bash
npm install
npm run dev        # http://localhost:5173 (también visible en tu red local, para probar en el celular)
npm run build      # genera dist/ listo para subir a cualquier hosting estático
npm run preview    # sirve dist/ para revisarlo antes de publicar
npm run images     # vuelve a generar las fotos (AVIF + WebP en 480/800/1200 px)
```

## Dónde se ajusta cada cosa

| Quiero cambiar…                         | Archivo                                       |
| --------------------------------------- | --------------------------------------------- |
| Textos, servicios, fotos de la galería, WhatsApp, dirección, horario | `src/data/content.js` |
| Duración de cada capítulo (`CAPITULO_N_SCROLL`) | `src/config.js`                        |
| Curvas, tiempos, velocidad de la galería, 3D, magnetismo, sorpresas | `src/config.js` |
| Colores y tipografía                     | `src/styles/tokens.css` (y `COLORS` en `src/config.js`) |
| Animaciones de los capítulos 1 a 5      | `src/story.js`                                |
| Capítulos 6 y 7, marquee, footer        | `src/sections.js`                             |
| Galería infinita y preview              | `src/gallery/`                                |
| Tulipán 3D                              | `src/three/Tulip.js`                          |

Para agregar fotos: pon el PNG/JPG en `assets/fotos/` y corre `npm run images`.
Las originales que mandaste están en `assets/originales/`.

## Pendiente antes de publicar

- `BRAND.url` en `src/data/content.js`, y `public/robots.txt` y `public/sitemap.xml`: poner el dominio real.
- `BRAND.hours`: horario (mientras sea `null` se muestra "Pregunta horarios por WhatsApp").
- Confirmar la dirección (tomada del listado público de Fresha).
- Precios: no se muestran; cada servicio invita a preguntar por WhatsApp.

## Créditos

La galería infinita parte de "Infinite Scroll Gallery with Page Transitions using GSAP"
de Surya Aditya para Codrops (licencia MIT). Los créditos están en los archivos de `src/gallery/`.
