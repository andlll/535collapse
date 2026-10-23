"""[§9.47, §9.72] Il logo del menu "Dust Veil: Collapse" -> nuovi/sprites/logo_dustveil.png

Al posto del "535" sfumato (sprite logo535 dell'originale). Due righe:
"Dust Veil" in Cinzel Decorative Bold (nuovi/font/) e "COLLAPSE" in Cinzel
Bold spaziato, fra due filetti con una losanga in punta. Lo stesso grigio
del logo535 (51, 51, 51) e una sfumatura verso il basso su tutto il blocco,
con la forma di quella del logo535 (misurata riga per riga, dalla cima delle
maiuscole della prima riga alla linea di base dell'ultima) ma che finisce a
FADE_LO invece che a 0: con la sfumatura intera "COLLAPSE" spariva. Dietro le
lettere un alone chiaro sfocato, che le stacca dalla nebbia grigia del menu.
Con --tre-righe: "Dust" / "Veil" / "COLLAPSE" (la variante scartata).

Lo sprite si usa da nuovi.json (sprites, gruppo ambiente come il logo535);
il PNG e' versionato: rilanciare solo se cambiano testo, font o misura.

Uso:  python3 tools/13_logo.py [--tre-righe]
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _paths import GMX_DIR, REPO_DIR, need  # noqa: E402

DECO = os.path.join(REPO_DIR, "nuovi", "font", "CinzelDecorative-Bold.ttf")
CINZEL = os.path.join(REPO_DIR, "nuovi", "font", "Cinzel[wght].ttf")
GREY = (51, 51, 51)
HALO = (235, 235, 230)   # l'alone: quasi bianco, come i pulsanti del menu
HALO_A = 0.6             # sua opacita' massima
SCALE = 1.4              # tutte le misure: il menu lo rimpicciolisce (menu.js), sugli schermi grandi non si sgrana
FADE_LO = 0.3            # opacita' in fondo alla sfumatura
OUT = os.path.join(REPO_DIR, "nuovi", "sprites", "logo_dustveil.png")


def fade_profile():
    """Opacita' per riga del logo535, dalla cima alla fine dell'inchiostro (0..1)."""
    logo = Image.open(need(os.path.join(GMX_DIR, "sprites", "images", "logo535_0.png"), "lo sprite logo535"))
    a = logo.convert("RGBA").getchannel("A")
    top, bottom = a.getbbox()[1], a.getbbox()[3]
    return [max(a.getpixel((x, y)) for x in range(a.width)) / 255 for y in range(top, bottom)]


def z(v):
    return round(v * SCALE)


def font(path, cap, weight=None):
    """Il font con le maiuscole alte `cap` px (per SCALE; weight: asse del Cinzel variabile)."""
    cap = z(cap)
    px = 10
    while True:
        f = ImageFont.truetype(path, px)
        if weight:
            f.set_variation_by_axes([weight])
        if -f.getbbox("H", anchor="ls")[1] >= cap:
            return f
        px += 1


def line(text, f, track=0):
    """Una riga (canale alfa) con `track` px fra le lettere: immagine, y della linea di base, altezza delle maiuscole."""
    widths = [f.getlength(ch) for ch in text]
    asc, desc = f.getmetrics()
    im = Image.new("L", (int(sum(widths) + track * (len(text) - 1)) + 40, asc + desc + 40), 0)
    d = ImageDraw.Draw(im)
    x = 20
    for ch, w in zip(text, widths):
        d.text((x, 20 + asc), ch, font=f, fill=255, anchor="ls")
        x += w + track
    return im, 20 + asc, -f.getbbox("H", anchor="ls")[1]


def main():
    three = "--tre-righe" in sys.argv
    sub = (font(CINZEL, 40, 700), z(18))  # COLLAPSE: maiuscole di 40 px, 18 px fra le lettere
    if three:
        big = font(DECO, 100)
        rows, gaps = [("Dust", big, 0), ("Veil", big, 0), ("COLLAPSE",) + sub], [z(34), z(40)]
    else:
        rows, gaps = [("Dust Veil", font(DECO, 92), 0), ("COLLAPSE",) + sub], [z(38)]
    lines = [line(*r) for r in rows]
    PAD = z(50)  # margine della tela: ci sta l'alone
    RULE, GAP_R, TIP = z(120), z(26), z(10)  # filetti: lunghezza, distanza dal testo, punta della losanga
    sub_bb = lines[-1][0].getbbox()
    half = (sub_bb[2] - sub_bb[0]) // 2
    W = max(max(im.width for im, _, _ in lines), 2 * (half + GAP_R + RULE + TIP)) + 2 * PAD
    bases, y = [], 0
    for k, (_, _, cap) in enumerate(lines):
        y = cap + PAD if k == 0 else y + gaps[k - 1] + cap
        bases.append(y)
    ink = Image.new("L", (W, bases[-1] + 2 * PAD), 0)
    for (im, base, _), yb in zip(lines, bases):
        ink.paste(255, ((W - im.width) // 2, yb - base), im)
    # i filetti ai lati dell'ultima riga, con la losanga in punta
    cy = bases[-1] - lines[-1][2] // 2
    d = ImageDraw.Draw(ink)
    for s in (-1, 1):
        x0 = W // 2 + s * (half + GAP_R)
        x1 = x0 + s * RULE
        d.line([(x0, cy), (x1, cy)], fill=255, width=z(3))
        d.polygon([(x1 + s * TIP, cy), (x1, cy - z(6)), (x1 - s * TIP, cy), (x1, cy + z(6))], fill=255)
    # l'alone: le lettere allargate e sfocate (prima della sfumatura)
    glow = ink.filter(ImageFilter.MaxFilter(z(6) | 1)).filter(ImageFilter.GaussianBlur(z(20))).point(lambda v: round(v * HALO_A))
    # la sfumatura verso il basso su tutto il blocco
    prof = fade_profile()
    top, h = bases[0] - lines[0][2], bases[-1] - (bases[0] - lines[0][2])
    px = ink.load()
    for yy in range(ink.height):
        t = min(max((yy - top) / h, 0), 1)
        k = FADE_LO + (1 - FADE_LO) * prof[min(len(prof) - 1, int(t * (len(prof) - 1)))]
        for xx in range(ink.width):
            px[xx, yy] = round(px[xx, yy] * k)
    out = Image.new("RGBA", ink.size, HALO + (0,))
    out.putalpha(glow)
    text = Image.new("RGBA", ink.size, GREY + (0,))
    text.putalpha(ink)
    out.alpha_composite(text)
    out = out.crop(out.getbbox())
    out.save(OUT)
    print("%s: %dx%d" % (os.path.relpath(OUT, REPO_DIR), out.width, out.height))


if __name__ == "__main__":
    main()
