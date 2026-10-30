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

[§9.85] Gli sprite danneggiati dell'autore ("su": lo sprite del progetto
integro, es. torre_b_r1 su torre_b) sono ritagliati sul disegno ed esportati
a un'altra scala (~1,05). Per ognuno: la scala (0,90-1,10 a passi di
0,005) e lo spostamento che sovrappongono meglio contorni neri e sagoma a
quelli dell'integro (correlazione con la FFT: richiede numpy, solo qui; la
pipeline legge i numeri scritti); poi una scala unica per tutti (la mediana:
vengono dalla stessa esportazione) e gli spostamenti rifatti con quella.
Scrive "scala" e "a" (il pixel (0, 0) dello sprite scalato va in (x, y)
dell'integro) e stampa la sovrapposizione.

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


def _features(im):
    import numpy as np
    a = np.asarray(im.convert("RGBA"), dtype=np.float32) / 255
    lum = a[..., :3].mean(axis=2)
    solid = a[..., 3] > 0.5
    return (solid & (lum < 0.3)).astype(np.float32) * 2 + solid * 0.5


def _register(ref, new, scales):
    """(punteggio, scala, x, y): new scalato e messo in (x, y) su ref."""
    import numpy as np
    FR = _features(ref)
    best = None
    for sc in scales:
        n = new.resize((max(1, round(new.width * sc)), max(1, round(new.height * sc))), Image.BICUBIC)
        FN = _features(n)
        H, W = FR.shape[0] + FN.shape[0], FR.shape[1] + FN.shape[1]
        c = np.fft.irfft2(np.fft.rfft2(FR, (H, W)) * np.fft.rfft2(FN[::-1, ::-1], (H, W)), (H, W))
        k = np.unravel_index(np.argmax(c), c.shape)
        score = float(c[k] / np.sqrt((FR ** 2).sum() * (FN ** 2).sum()))
        if best is None or score > best[0]:
            best = (score, round(float(sc), 3), int(k[1] - (FN.shape[1] - 1)), int(k[0] - (FN.shape[0] - 1)))
    return best


def damaged(data, spr):
    """[§9.85] scala e posizione degli sprite danneggiati ("su")."""
    items = [(name, d) for name, d in data["sprites"].items() if d.get("su")]
    if not items:
        return
    img = lambda n: Image.open(need(os.path.join(GMX_DIR, "sprites", "images", spr[n]["frames"][0]), n)).convert("RGBA")
    scales = [0.9 + 0.005 * k for k in range(41)]
    first = {name: _register(img(d["su"]), nuovi.image(name), scales) for name, d in items}
    sc = sorted(v[1] for v in first.values())[len(first) // 2]
    for name, d in items:
        score, _, x, y = _register(img(d["su"]), nuovi.image(name), [sc])
        d["scala"], d["a"] = sc, [x, y]
        print("%-14s su %-10s scala %.3f in (%d, %d), sovrapposizione %.2f (scala propria %.3f)"
              % (name, d["su"], sc, x, y, score, first[name][1]))


def main():
    path = os.path.join(nuovi.NUOVI_DIR, "nuovi.json")
    data = json.load(open(path, encoding="utf-8"))
    spr = {s["name"]: s for s in json.load(open(os.path.join(DATA_DIR, "sprites.json"), encoding="utf-8"))}
    damaged(data, spr)
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
