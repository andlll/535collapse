"""Sprite e oggetti nuovi dell'autore (nuovi/nuovi.json, nuovi/sprites/),
fatti dopo il progetto GameMaker: non passano da gmx/ e data/ (che si
rigenerano dagli zip). STUDIO.md §9.10. Li leggono 05_atlas (sprite e
fette), 06_masks (maschere), 07_scene (oggetti) e 11_tiled_kit (tileset).

Per ogni sprite:
  origin    [x, y], "centro" (centro dell'immagine) o "maschera" (baricentro
            dei pixel pieni della maschera: la base dell'edificio, come
            l'origine degli edifici dell'originale)
  mask      nuovi/sprites/<sprite>_mask.png se c'e': maschera precisa
            (pixel con alpha > 0), stessa misura dello sprite
  fette     larghezza delle fette verticali. Un edificio lungo e in
            diagonale (il muro di cinta, il corpo del monastero) con una sola
            depth -y sbaglia l'ordine di disegno da una delle due parti:
            ogni fetta si disegna con la depth del bordo anteriore della
            maschera nella sua colonna (front, in px dall'origine), cosi'
            chi sta dietro il muro resta dietro e chi sta davanti passa
            davanti, lungo tutto il muro.
"""
import json
import os

from PIL import Image

from _paths import REPO_DIR

NUOVI_DIR = os.path.join(REPO_DIR, "nuovi")
SPRITE_DIR = os.path.join(NUOVI_DIR, "sprites")
SLICE_SEP = "#"   # nome di una fetta: <sprite>#<n>


def load():
    p = os.path.join(NUOVI_DIR, "nuovi.json")
    if not os.path.exists(p):
        return {"sprites": {}, "objects": {}}
    return json.load(open(p, encoding="utf-8"))


def image(name):
    return Image.open(os.path.join(SPRITE_DIR, name + ".png")).convert("RGBA")


def mask(name):
    p = os.path.join(SPRITE_DIR, name + "_mask.png")
    if not os.path.exists(p):
        return None
    return Image.open(p).convert("RGBA").getchannel("A").point(lambda v: 255 if v > 0 else 0)


def sprites():
    """{nome: {"image", "mask" (o None), "origin", "fette": [(x0, x1, front)]}}"""
    out = {}
    for name, d in load()["sprites"].items():
        im, m = image(name), mask(name)
        if m is not None and m.size != im.size:
            raise SystemExit("%s: la maschera e' %dx%d, lo sprite %dx%d" % (name, *m.size, *im.size))
        o = d.get("origin", "centro")
        if o == "maschera":
            if m is None:
                raise SystemExit("%s: origin 'maschera' senza %s_mask.png" % (name, name))
            px, n, sx, sy = m.load(), 0, 0, 0
            for y in range(m.height):
                for x in range(m.width):
                    if px[x, y]:
                        n += 1
                        sx += x
                        sy += y
            o = [round(sx / n), round(sy / n)]
        elif o == "centro":
            o = [im.width // 2, im.height // 2]
        slices = []
        if d.get("fette"):
            if m is None:
                raise SystemExit("%s: fette senza maschera" % name)
            S, W = d["fette"], im.width
            fronts = []
            for x0 in range(0, W, S):
                col = m.crop((x0, 0, min(W, x0 + S), m.height)).getbbox()
                fronts.append(col[3] - 1 if col else None)
            # colonne senza maschera (bordi dell'immagine): la fetta vicina
            for k in range(len(fronts)):
                if fronts[k] is None:
                    near = [f for f in fronts[k + 1:] + fronts[:k][::-1] if f is not None]
                    fronts[k] = near[0] if near else m.height - 1
            slices = [(x0, min(W, x0 + S), fronts[k] - o[1]) for k, x0 in enumerate(range(0, W, S))]
        out[name] = {"image": im, "mask": m, "origin": o, "fette": slices}
    return out


def slice_image(im, x0, x1):
    """La fetta [x0, x1) dello sprite, nella tela intera (stessa origine)."""
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    out.paste(im.crop((x0, 0, x1, im.height)), (x0, 0))
    return out
