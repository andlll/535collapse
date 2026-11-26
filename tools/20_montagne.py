"""[§9.213] La texture ripetuta delle montagne fatte dal generatore
(game/src/mountains.js), dai disegni dell'autore:
- nuovi/montagne/roccia.png: la pietra grigia marmorizzata di montagna9
  (gmx/, dopo tools/01), un tratto di 258 x 256 px tutto pietra, senza
  inchiostro e con poche macchie grandi (scelto cercando, in tutte le dieci
  montagne, il quadrato con la luminosita' a blocchi di 32 px piu' uniforme),
  reso senza cuciture come l'acqua dei fiumi (tools/15_fiumi.py: incrocio
  col ritaglio spostato di mezza misura, un asse per volta).
  La carta dei disegni ha righe verticali ogni ~3 px: la larghezza (258) e
  lo spostamento orizzontale (129) sono multipli di 3, cosi' le righe del
  ritaglio spostato restano in fase con quelle dell'originale e la
  piastrella si ripete senza salti.
  [§9.214, richiesta dell'autore: "il colore mi sembra un po' scuro"] schiarita
  del 4% (luminosita' media 158 -> ~164, quella della pietra dei disegni:
  162-166), perche' le facce in luce del generatore la lasciano com'e' e le
  altre la scuriscono.

  python3 tools/20_montagne.py
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "gmx", "sprites", "images", "montagna9_0.png")
OUT = os.path.join(ROOT, "nuovi", "montagne", "roccia.png")
W, H = 258, 256
BOX = (1536, 512, 1536 + W, 512 + H)  # solo pietra, niente linee
LIGHTER = 1.04


def roll(im, sx, sy):
    w, h = im.size
    out = Image.new("RGBA", (w, h))
    out.paste(im.crop((sx, sy, w, h)), (0, 0))
    out.paste(im.crop((0, sy, sx, h)), (w - sx, 0))
    out.paste(im.crop((sx, 0, w, sy)), (0, h - sy))
    out.paste(im.crop((0, 0, sx, sy)), (w - sx, h - sy))
    return out


def blend(im, rolled, axis):
    """Lungo un asse: l'originale al centro, il ritaglio spostato (continuo
    con la piastrella accanto) sui bordi; il salto del ritaglio spostato sta
    al centro, dove pesa zero. Un asse per volta: incrociati insieme, vicino
    agli angoli il salto del ritaglio si vedeva a meta' piastrella."""
    w, h = im.size
    a, b = im.load(), rolled.load()
    out = Image.new("RGBA", (w, h))
    o = out.load()
    for y in range(h):
        for x in range(w):
            m = min(x, w - 1 - x) / (w / 2) if axis == 0 else min(y, h - 1 - y) / (h / 2)
            k = min(1.0, 2 * m)
            o[x, y] = tuple(round(a[x, y][c] * k + b[x, y][c] * (1 - k)) for c in range(3)) + (255,)
    return out


def seamless(im, sx, sy):
    im = blend(im, roll(im, sx, 0), 0)
    return blend(im, roll(im, 0, sy), 1)


def main():
    im = Image.open(SRC).convert("RGBA").crop(BOX)
    assert im.getextrema()[3][0] == 255, "il ritaglio deve essere tutto pietra"
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    out = seamless(im, W // 2, H // 2)
    out = Image.eval(out.convert("RGB"), lambda v: min(255, round(v * LIGHTER))).convert("RGBA")
    out.save(OUT, optimize=True)
    print(OUT, os.path.getsize(OUT), "byte")


if __name__ == "__main__":
    main()
