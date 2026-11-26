"""[§9.219, richiesta dell'autore: "un pennello sabbia con stessa texture del
prato ma colore sabbia appunto"] La texture della sabbia per il pennello
dell'editor: lo sfondo del prato (green1, gmx/, dopo tools/01) con la sua
grana di carta, ricolorato: ogni pixel e' il colore sabbia SAND per la sua
luminosita' relativa (la media dello sfondo = SAND), col contrasto della
grana un po' piu' forte (CONTRAST: sul chiaro la grana si vedeva meno).
Scrive nuovi/sfondi/sabbia.png; tools/05_atlas.py la mette fra gli sfondi
ripetuti col nome del file (`sabbia`).

  python3 tools/22_sabbia.py
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "gmx", "background", "images", "green1.png")
OUT = os.path.join(ROOT, "nuovi", "sfondi", "sabbia.png")
SAND = (206, 186, 138)
CONTRAST = 1.15


def main():
    im = Image.open(SRC).convert("RGB")
    px = im.load()
    w, h = im.size
    lum = [[0.3 * px[x, y][0] + 0.59 * px[x, y][1] + 0.11 * px[x, y][2] for x in range(w)] for y in range(h)]
    mean = sum(map(sum, lum)) / (w * h)
    out = Image.new("RGB", (w, h))
    o = out.load()
    for y in range(h):
        for x in range(w):
            k = 1 + CONTRAST * (lum[y][x] / mean - 1)
            o[x, y] = tuple(max(0, min(255, round(c * k))) for c in SAND)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    out.save(OUT, optimize=True)
    print(OUT, os.path.getsize(OUT), "byte")


if __name__ == "__main__":
    main()
