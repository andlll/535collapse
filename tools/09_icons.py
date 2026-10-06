"""Icone della PWA e del browser dal logo del gioco (sprite logo535) ->
game/icons/ (versionate: sono piccole e servono anche senza la pipeline).

  icon-192.png, icon-512.png   manifest (logo all'80% della larghezza)
  icon-512-maskable.png        manifest, "maskable": logo nella zona
                               sicura (cerchio dell'80%), sfondo pieno
  apple-touch-icon.png         180x180, sfondo pieno (iOS non gestisce la
                               trasparenza sulle icone della home)
  favicon-32.png               scheda del browser

Sfondo: il colore della carta della mappa della campagna (#e8e2d0); il logo
e' scuro e sfuma verso il basso.
"""
import os
from PIL import Image
from _paths import GMX_DIR, REPO_DIR, need

BG = (232, 226, 208, 255)
OUT = os.path.join(REPO_DIR, "game", "icons")


def icon(logo, size, frac):
    canvas = Image.new("RGBA", (size, size), BG)
    w = round(size * frac)
    h = round(logo.height * w / logo.width)
    lg = logo.resize((w, h), Image.LANCZOS)
    canvas.alpha_composite(lg, ((size - w) // 2, (size - h) // 2))
    return canvas


def main():
    src = need(os.path.join(GMX_DIR, "sprites", "images", "logo535_0.png"), "lo sprite logo535")
    logo = Image.open(src).convert("RGBA")
    logo = logo.crop(logo.getbbox())
    os.makedirs(OUT, exist_ok=True)
    for name, size, frac in [("icon-192.png", 192, 0.8), ("icon-512.png", 512, 0.8),
                             ("icon-512-maskable.png", 512, 0.62), ("apple-touch-icon.png", 180, 0.8),
                             ("favicon-32.png", 32, 0.94)]:
        icon(logo, size, frac).convert("RGB").save(os.path.join(OUT, name), optimize=True)
        print(name)


if __name__ == "__main__":
    main()
