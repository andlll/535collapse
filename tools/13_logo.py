"""[§9.47] Il logo del menu "Dust Veil" -> nuovi/sprites/logo_dustveil.png

Al posto del "535" sfumato (sprite logo535 dell'originale): il titolo in
Cinzel Decorative Bold (nuovi/font/), dello stesso grigio (51, 51, 51) e con
la stessa sfumatura verso il basso, misurata riga per riga sul logo535 (in
proporzione all'altezza delle lettere). Lo sprite si usa da nuovi.json
(sprites, gruppo ambiente come il logo535); il PNG e' versionato: rilanciare
solo se cambiano testo, font o misura.

Uso:  python3 tools/13_logo.py
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _paths import GMX_DIR, REPO_DIR, need  # noqa: E402

TEXT = "Dust Veil"
FONT = os.path.join(REPO_DIR, "nuovi", "font", "CinzelDecorative-Bold.ttf")
CAP = 92            # altezza delle maiuscole in px
GREY = (51, 51, 51)
OUT = os.path.join(REPO_DIR, "nuovi", "sprites", "logo_dustveil.png")


def fade_profile():
    """Opacita' per riga del logo535, dalla cima alla fine dell'inchiostro (0..1)."""
    logo = Image.open(need(os.path.join(GMX_DIR, "sprites", "images", "logo535_0.png"), "lo sprite logo535"))
    a = logo.convert("RGBA").getchannel("A")
    top, bottom = a.getbbox()[1], a.getbbox()[3]
    prof = []
    for y in range(top, bottom):
        prof.append(max(a.getpixel((x, y)) for x in range(a.width)) / 255)
    return prof


def main():
    px = 20
    while True:
        f = ImageFont.truetype(FONT, px)
        if -f.getbbox("H", anchor="ls")[1] >= CAP:
            break
        px += 1
    bb = f.getbbox(TEXT)
    pad = 6
    im = Image.new("L", (bb[2] - bb[0] + 2 * pad, bb[3] - bb[1] + 2 * pad), 0)
    ImageDraw.Draw(im).text((pad - bb[0], pad - bb[1]), TEXT, font=f, fill=255)
    # la sfumatura sull'altezza delle maiuscole (dalla cima alla linea di
    # base), non sull'inchiostro: il ricciolo della V sale piu' in alto
    base = pad - bb[1] + f.getmetrics()[0]  # bb e' dalla cima dell'ascendente
    prof = fade_profile()
    px_ = im.load()
    for y in range(im.height):
        t = min(max((y - (base - CAP)) / CAP, 0), 1)
        k = prof[min(len(prof) - 1, int(t * (len(prof) - 1)))]
        for x in range(im.width):
            px_[x, y] = round(px_[x, y] * k)
    out = Image.new("RGBA", im.size, GREY + (0,))
    out.putalpha(im)
    out = out.crop(out.getbbox())
    out.save(OUT)
    print("%s: %dx%d (font %d px)" % (os.path.relpath(OUT, REPO_DIR), out.width, out.height, px))


if __name__ == "__main__":
    main()
