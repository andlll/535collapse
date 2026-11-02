"""[§9.97] Le texture ripetute di fiumi e strade disegnati come linee
(game/src/rivers.js), dai dipinti dell'autore:
- nuovi/fiumi/acqua.png: l'acqua di nuovi/sprites/Fiume_Completo.png, resa
  senza cuciture (incrocio col ritaglio spostato di mezza misura);
- nuovi/fiumi/sassi.png: i sassolini del sentiero di strada4 (gmx/), sei
  presi singoli dal dipinto (le macchie isolate di 45-90 px), in grigio
  (la luminosita' relativa, il colore lo da' il gioco) e alpha, uno ogni
  SASSO px: il "pennello" che il gioco timbra lungo le strade
  (suggerimento dell'autore: il sentiero e' un pennello che ripete la
  stessa particella con una gamma di colori).
- nuovi/fiumi/carta.png: la grana di carta dell'acqua, in grigio (media
  200): il gioco la colora per i ponti (piano, parapetti, facciata), come
  nel ponte dipinto (Ponte_5), che ha la stessa grana.
La pipeline (tools/05_atlas.py) le mette fra gli sfondi ripetuti.

  python3 tools/15_fiumi.py
"""
import os
from PIL import Image, ImageStat

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "nuovi", "sprites", "Fiume_Completo.png")
OUT = os.path.join(ROOT, "nuovi", "fiumi", "acqua.png")
ROAD_SRC = os.path.join(ROOT, "gmx", "sprites", "images", "strada4_0.png")
STONES_OUT = os.path.join(ROOT, "nuovi", "fiumi", "sassi.png")
PAPER_OUT = os.path.join(ROOT, "nuovi", "fiumi", "carta.png")
SASSO, N_SASSI = 16, 6
BOX = (2620, 1005, 2620 + 256, 1005 + 192)  # solo acqua, niente bordi


def seamless(im):
    w, h = im.size
    a = im.load()
    rolled = Image.new("RGBA", (w, h))
    rolled.paste(im.crop((w // 2, h // 2, w, h)), (0, 0))
    rolled.paste(im.crop((0, h // 2, w // 2, h)), (w - w // 2, 0))
    rolled.paste(im.crop((w // 2, 0, w, h // 2)), (0, h - h // 2))
    rolled.paste(im.crop((0, 0, w // 2, h // 2)), (w - w // 2, h - h // 2))
    b = rolled.load()
    out = Image.new("RGBA", (w, h))
    o = out.load()
    for y in range(h):
        for x in range(w):
            # peso dell'originale: 1 al centro, 0 sui bordi (dove il ritaglio
            # spostato e' continuo con la piastrella accanto)
            m = min(x, w - 1 - x) / (w / 2), min(y, h - 1 - y) / (h / 2)
            k = min(1.0, 2 * min(m))
            o[x, y] = tuple(round(a[x, y][c] * k + b[x, y][c] * (1 - k)) for c in range(3)) + (255,)
    return out


def convex(px):
    """Ogni riga e ogni colonna della macchia e' un tratto solo (niente
    buchi): una macchia sola, non due vicine."""
    rows, cols = {}, {}
    for x, y in px:
        rows.setdefault(y, []).append(x)
        cols.setdefault(x, []).append(y)
    return all(max(v) - min(v) + 1 == len(v) for d in (rows, cols) for v in d.values())


def stones(im):
    """I sassolini singoli di strada4: componenti connesse dell'alpha di
    45-90 px, larghe 8-14 e alte 5-10, piene almeno al 62% del riquadro
    (non due sassi uniti da pixel tenui), i primi
    N_SASSI da sinistra; ognuno al centro della sua cella."""
    w, h = im.size
    a = im.load()
    seen = bytearray(w * h)
    found = []
    for x in range(w):
        for y in range(h):
            if a[x, y][3] <= 40 or seen[y * w + x]:
                continue
            st, px = [(x, y)], []
            seen[y * w + x] = 1
            while st:
                cx, cy = st.pop()
                px.append((cx, cy))
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = cx + dx, cy + dy
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx] and a[nx, ny][3] > 40:
                        seen[ny * w + nx] = 1
                        st.append((nx, ny))
            xs, ys = [p[0] for p in px], [p[1] for p in px]
            bw, bh = max(xs) - min(xs) + 1, max(ys) - min(ys) + 1
            # piena come un'ellisse (0,785 del riquadro): non due sassi uniti
            if 45 <= len(px) <= 90 and 8 <= bw <= 14 and 5 <= bh <= 10 and len(px) >= 0.62 * bw * bh and convex(px):
                found.append((min(xs), min(ys), bw, bh, px))
    sheet = Image.new("RGBA", (SASSO * N_SASSI, SASSO), (255, 255, 255, 0))
    q = sheet.load()
    for i, (x0, y0, bw, bh, cell) in enumerate(found[:N_SASSI]):
        lum = [0.3 * a[x, y][0] + 0.59 * a[x, y][1] + 0.11 * a[x, y][2] for x, y in cell]
        mean = sum(lum) / len(lum)
        ox, oy = i * SASSO + (SASSO - bw) // 2, (SASSO - bh) // 2
        for (x, y), l in zip(cell, lum):
            g = max(0, min(255, round(200 * l / mean)))  # 200 = la media: un po' di margine per le luci
            q[ox + x - x0, oy + y - y0] = (g, g, g, a[x, y][3])
    assert len(found) >= N_SASSI, "troppo pochi sassolini singoli"
    return sheet


def main():
    im = Image.open(SRC).convert("RGBA").crop(BOX)
    assert im.getextrema()[3][0] == 255, "il ritaglio deve essere tutto acqua"
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    water = seamless(im)
    water.save(OUT, optimize=True)
    print(OUT, os.path.getsize(OUT), "byte")
    lum = water.convert("L")
    mean = ImageStat.Stat(lum).mean[0]
    paper = lum.point(lambda v: max(0, min(255, round(200 + (v - mean) * 1.0)))).convert("RGBA")
    paper.save(PAPER_OUT, optimize=True)
    print(PAPER_OUT, os.path.getsize(PAPER_OUT), "byte")
    stones(Image.open(ROAD_SRC).convert("RGBA")).save(STONES_OUT, optimize=True)
    print(STONES_OUT, os.path.getsize(STONES_OUT), "byte")


if __name__ == "__main__":
    main()
