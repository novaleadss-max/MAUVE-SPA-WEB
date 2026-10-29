/**
 * Image pipeline: assets/fotos/*.png  ->  public/img/<name>-<width>.{avif,webp}
 * Also writes src/data/images.json with each image's real dimensions,
 * so the markup can reserve space (no layout shift) and build srcset.
 * Run: npm run images
 */
import sharp from "sharp";
import { readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SRC = "assets/fotos";
const OUT = "public/img";
const WIDTHS = [480, 800, 1200];

await mkdir(OUT, { recursive: true });
await mkdir("src/data", { recursive: true });

const manifest = {};
for (const file of (await readdir(SRC)).filter((f) => f.endsWith(".png"))) {
  const name = path.basename(file, ".png");
  const img = sharp(path.join(SRC, file));
  const { width, height } = await img.metadata();
  const widths = WIDTHS.filter((w) => w < width).concat(width > 1200 ? [] : [width]);
  for (const w of widths) {
    const resized = sharp(path.join(SRC, file)).resize({ width: w });
    await resized.clone().avif({ quality: 55, effort: 6 }).toFile(`${OUT}/${name}-${w}.avif`);
    await resized.clone().webp({ quality: 78, effort: 6 }).toFile(`${OUT}/${name}-${w}.webp`);
  }
  manifest[name] = { w: width, h: height, widths };
  console.log(name, width, height, widths.join(","));
}
await writeFile("src/data/images.json", JSON.stringify(manifest, null, 2));
