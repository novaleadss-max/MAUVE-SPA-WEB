# Turns the green-screen tulip video into transparent sprite sheets (public/flor/).
# Usage: extract frames with ffmpeg (-t 5.6 -vf fps=24 f%03d.png), then
#   python3 scripts/flor-desde-video.py <frames-dir> <out-dir>
# Green-screen key + edge decontamination, common crop, sprite sheets.
import sys, glob, numpy as np
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
files = sorted(glob.glob(f"{src}/f*.png"))
N = 36
pick = [files[round(i * (len(files) - 1) / (N - 1))] for i in range(N)]
bg = np.array([16, 198, 30], np.float32)
frames = []
for f in pick:
    c = np.asarray(Image.open(f).convert("RGB")).astype(np.float32)
    ge = c[..., 1] - np.maximum(c[..., 0], c[..., 2])          # green excess
    a = np.clip((118 - ge) / (118 - 50), 0, 1)                   # stem (~15) stays, screen (~168) goes
    # pull the edge in by one pixel and soften it: no pale fringe around the petals
    from PIL import ImageFilter
    am = Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.7))
    a = np.asarray(am).astype(np.float32) / 255
    a3 = a[..., None]
    # unmix the screen colour out of semi-transparent edge pixels
    col = np.where(a3 > 0.02, (c - (1 - a3) * bg) / np.maximum(a3, 0.02), 0)
    col[..., 1] = np.minimum(col[..., 1], np.maximum(col[..., 0], col[..., 2]) + 12)  # despill
    rgba = np.dstack([np.clip(col, 0, 255), a * 255]).astype(np.uint8)
    frames.append(rgba)
alpha_any = np.max([f[..., 3] for f in frames], axis=0) > 8
ys, xs = np.where(alpha_any)
pad = 6
y0, y1, x0, x1 = max(ys.min() - pad, 0), ys.max() + pad, max(xs.min() - pad, 0), xs.max() + pad
# square-ish box centred horizontally on the flower
w, h = x1 - x0, y1 - y0
print("crop", x0, y0, w, h)
for size, name in [(680, "desktop"), (380, "mobile")]:
    sc = size / w
    fw, fh = size, round(h * sc)
    cols = 6
    rows = (N + cols - 1) // cols
    sheet = Image.new("RGBA", (fw * cols, fh * rows), (0, 0, 0, 0))
    for i, fr in enumerate(frames):
        crop = fr[y0:y1, x0:x1].copy()
        # the stem was cut by the video frame: let it end softly instead
        hh = crop.shape[0]; ramp = np.ones(hh, np.float32); n = int(hh * 0.1)
        ramp[hh - n:] = np.linspace(1, 0, n) ** 1.4
        crop[..., 3] = (crop[..., 3] * ramp[:, None]).astype(np.uint8)
        im = Image.fromarray(crop).resize((fw, fh), Image.LANCZOS)
        sheet.paste(im, ((i % cols) * fw, (i // cols) * fh))
    sheet.save(f"{out}/tulipan-{name}.webp", "WEBP", quality=80, method=6, alpha_quality=85)
    print(name, fw, fh, cols, rows)
# preview on page colour
prev = Image.new("RGBA", (fw * 6, fh), (201, 128, 134, 255))
for k, i in enumerate([0, 7, 14, 21, 28, 35]):
    im = Image.fromarray(frames[i][y0:y1, x0:x1]).resize((fw, fh), Image.LANCZOS)
    prev.alpha_composite(im, (k * fw, 0))
prev.convert("RGB").save(f"{out}/preview.png")
