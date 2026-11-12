/** Procesa sólo las imágenes indicadas: node scripts/build-images-solo.mjs nombre1 nombre2 ... */
import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
const names = process.argv.slice(2);
const manifest = JSON.parse(await readFile("src/data/images.json", "utf8"));
for (const name of names) {
  const src = `assets/fotos/${name}.png`;
  const { width, height } = await sharp(src).metadata();
  const widths = [480, 800, 1200].filter((w) => w < width).concat(width > 1200 ? [] : [width]);
  for (const w of widths) {
    const r = sharp(src).resize({ width: w });
    await r.clone().avif({ quality: 55, effort: 4 }).toFile(`public/img/${name}-${w}.avif`);
    await r.clone().webp({ quality: 78, effort: 4 }).toFile(`public/img/${name}-${w}.webp`);
  }
  manifest[name] = { w: width, h: height, widths };
  console.log(name, width, height, widths.join(","));
}
await writeFile("src/data/images.json", JSON.stringify(manifest, null, 2));
