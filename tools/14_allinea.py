"""[§9.49] Origini degli sprite di una serie (nuovi.json, "serie") dalla
sagoma degli sprite del progetto corrispondenti.

Il lavoratore nemico dell'autore (nuovi/sprites/omino_blu/, b_ow11...) e'
lo stesso personaggio del lavoratore alleato (ow11...) ridisegnato, ogni
immagine in una tela 83x107 ma non sempre nello stesso punto. Per ogni
immagine si cerca lo spostamento che sovrappone meglio la sua sagoma (alpha
> 100) a quella dello sprite alleato (prima: i rettangoli allineati in
basso e al centro; poi +-8 px, il massimo dell'intersezione sull'unione);
l'origine e' quella dello sprite alleato riportata nell'immagine nuova. Cosi'
il nemico sta dove sta l'alleato, fotogramma per fotogramma.

Scrive "origini" nella serie in nuovi/nuovi.json e stampa la sovrapposizione
peggiore (sotto 0,7: probabilmente l'immagine sbagliata). Rilanciare se
cambiano le immagini.

Uso:  python3 tools/14_allinea.py
"""
import json
import os
import sys

from PIL import Image, ImageChops

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _paths import DATA_DIR, GMX_DIR, need  # noqa: E402
import nuovi  # noqa: E402

R = 8  # px di ricerca attorno al primo allineamento


def silhouette(im):
    return im.convert("RGBA").getchannel("A").point(lambda v: 255 if v > 100 else 0).convert("1")


def count(m):
    return m.histogram()[-1]


def align(ref, new):
    """(ox, oy, iou): il pixel (x, y) di new va su (x + ox, y + oy) di ref."""
    a, b = ref.getbbox(), new.getbbox()
    bx = round((a[0] + a[2]) / 2 - (b[0] + b[2]) / 2)
    by = a[3] - b[3]
    na, nb = count(ref), count(new)
    best = None
    for dy in range(-R, R + 1):
        for dx in range(-R, R + 1):
            ox, oy = bx + dx, by + dy
            c = Image.new("1", ref.size, 0)
            c.paste(new, (ox, oy))
            inter = count(ImageChops.logical_and(ref, c))
            iou = inter / (na + nb - inter)
            if best is None or iou > best[2]:
                best = (ox, oy, iou)
    return best


def main():
    path = os.path.join(nuovi.NUOVI_DIR, "nuovi.json")
    data = json.load(open(path, encoding="utf-8"))
    spr = {s["name"]: s for s in json.load(open(os.path.join(DATA_DIR, "sprites.json"), encoding="utf-8"))}
    for name, d in data["sprites"].items():
        if not d.get("serie"):
            continue
        folder = os.path.join(nuovi.SPRITE_DIR, d["serie"])
        origins, worst = {}, []
        for fn in sorted(os.listdir(folder)):
            if not fn.endswith(".png"):
                continue
            sname = fn[:-4]
            ref_name = sname[len(d.get("togli", "")):]
            s = spr[ref_name]
            ref = silhouette(Image.open(need(os.path.join(GMX_DIR, "sprites", "images", s["frames"][0]), ref_name)))
            ox, oy, iou = align(ref, silhouette(Image.open(os.path.join(folder, fn))))
            origins[sname] = [s["origin_x"] - ox, s["origin_y"] - oy]
            worst.append((iou, sname))
        d["origini"] = origins
        worst.sort()
        print("%s: %d sprite; sovrapposizione peggiore %s" % (name, len(origins),
              ", ".join("%s %.2f" % (n, v) for v, n in worst[:5])))
        bad = [n for v, n in worst if v < 0.7]
        if bad:
            print("  DA CONTROLLARE (sotto 0,7): " + ", ".join(bad))
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(json.dumps(data, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    main()
