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
  [§9.40, il fiume e il ponte del livello 4]
  maschera  "alpha": maschera precisa dai pixel non trasparenti dello sprite
            (invece di <sprite>_mask.png)
  poligono  [[x, y], ...]: sprite di sola maschera (niente immagine, niente
            atlas), un poligono pieno in una tela "misura" [w, h]
  buchi     [{"sprite": s, "a": [x, y]}]: la maschera dello sprite s, messa
            in (x, y), si toglie da questa (il varco del ponte nel fiume)
  acqua     true: le celle d'acqua per riflessi, schiuma e pioggia
            (tools/06_masks.py, come i fiume* del progetto)
  pezzi     lato dei riquadri in cui lo sprite si disegna (uno sprite
            <sprite>#<n> per riquadro non vuoto), tutti alla depth
            dell'istanza: per sprite piu' grandi di una pagina d'atlas
  gruppo    gruppo d'atlas (tools/05_atlas.py), di norma "edifici"
  [§9.49] serie: una cartella di nuovi/sprites/ con uno sprite per PNG (il
            lavoratore nemico, 144 immagini): "serie" la cartella, "origini"
            {sprite: [x, y]} (le scrive tools/14_allinea.py, dalla sagoma
            dello sprite del progetto corrispondente: "togli" il prefisso del
            nome, b_ow11 -> ow11), "gruppo"
  [§9.85] su: lo sprite del progetto di cui questo e' uno stadio di danno
            (torre_b_r1 su torre_b): l'immagine dell'autore, ritagliata sul
            disegno e a un'altra scala, si scala di "scala" e si mette in "a"
            [x, y] su una tela grande come quella dello sprite "su" (allargata
            se il disegno sporge), con la sua origine (scala e posizione:
            tools/14_allinea.py)
  differenza {"sprite": s, "a": [x, y]}: i pixel uguali a quelli dello
            sprite s (questo messo in x, y dentro s) diventano trasparenti:
            gli stadi del ponte disegnano solo cio' che cambia, e l'acqua
            (coi suoi effetti) resta quella del fiume
"""
import json
import os

from PIL import Image, ImageChops, ImageDraw

from _paths import DATA_DIR, REPO_DIR

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


def _difference(im, d):
    """[§9.40] I pixel di im uguali (a meno di 6 in somma) a quelli dello
    sprite d["sprite"] nel riquadro che im occupa in (d["a"]) diventano
    trasparenti."""
    ref = image(d["sprite"]).crop((d["a"][0], d["a"][1], d["a"][0] + im.width, d["a"][1] + im.height))
    diff = ImageChops.difference(im, ref)
    r, g, b, a = diff.split()
    total = ImageChops.add(ImageChops.add(r, g), ImageChops.add(b, a))
    keep = total.point(lambda v: 255 if v > 6 else 0)
    out = im.copy()
    out.putalpha(ImageChops.multiply(im.getchannel("A"), keep))
    return out


def _polygon(size, pts):
    m = Image.new("L", tuple(size), 0)
    ImageDraw.Draw(m).polygon([tuple(p) for p in pts], fill=255)
    return m


def _mask_of(name, d, im, cache):
    if name in cache:
        return cache[name]
    if d.get("poligono"):
        m = _polygon(d["misura"], d["poligono"])
    elif d.get("maschera") == "alpha":
        m = im.getchannel("A").point(lambda v: 255 if v > 0 else 0)
    else:
        m = mask(name)
    for h in d.get("buchi", []):
        all_ = load()["sprites"]
        hm = _mask_of(h["sprite"], all_[h["sprite"]], None, cache)
        hole = Image.new("L", m.size, 0)
        hole.paste(hm, tuple(h["a"]))
        m = ImageChops.subtract(m, hole)
    cache[name] = m
    return m


def sprites():
    """{nome: {"image" (o None; il primo fotogramma), "frames", "mask" (o None), "origin", "fette":
    [(x0, x1, front)], "pezzi": [(x0, y0, x1, y1)], "gruppo", "acqua"}}"""
    out, cache = {}, {}
    for name, d in load()["sprites"].items():
        if d.get("serie"):  # [§9.49] uno sprite per PNG della cartella
            for sname, o in d["origini"].items():
                im = Image.open(os.path.join(SPRITE_DIR, d["serie"], sname + ".png")).convert("RGBA")
                out[sname] = {"image": im, "frames": [im], "mask": None, "origin": list(o), "fette": [], "pezzi": [],
                              "gruppo": d.get("gruppo", "edifici"), "acqua": False}
            continue
        # [§9.48] sprite a piu' fotogrammi: un PNG per fotogramma (stessa misura)
        frames = [image(f) for f in d["fotogrammi"]] if d.get("fotogrammi") else None
        if frames and any(f.size != frames[0].size for f in frames):
            raise SystemExit("%s: i fotogrammi non hanno la stessa misura" % name)
        im = frames[0] if frames else None if d.get("poligono") else image(name)
        if d.get("su"):  # [§9.85] sulla tela dello sprite integro, con la sua origine
            im, d = _on_base(name, d, im)
        if im is not None and d.get("differenza"):
            im = _difference(im, d["differenza"])
        m = _mask_of(name, d, im, cache)
        if im is not None and m is not None and m.size != im.size:
            raise SystemExit("%s: la maschera e' %dx%d, lo sprite %dx%d" % (name, *m.size, *im.size))
        size = im.size if im is not None else tuple(d["misura"])
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
            o = [size[0] // 2, size[1] // 2]
        slices = []
        if d.get("fette"):
            if m is None:
                raise SystemExit("%s: fette senza maschera" % name)
            S, W = d["fette"], size[0]
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
        tiles = []
        if d.get("pezzi"):
            T, a = d["pezzi"], im.getchannel("A")
            for y0 in range(0, im.height, T):
                for x0 in range(0, im.width, T):
                    box = (x0, y0, min(im.width, x0 + T), min(im.height, y0 + T))
                    if a.crop(box).getbbox():
                        tiles.append(box)
        out[name] = {"image": im, "frames": frames or [im], "mask": m, "origin": o, "fette": slices, "pezzi": tiles,
                     "gruppo": d.get("gruppo", "edifici"), "acqua": bool(d.get("acqua"))}
    return out


_PROJECT = None


def _on_base(name, d, im):
    """[§9.85] (immagine, d con l'origine dello sprite "su")."""
    global _PROJECT
    if _PROJECT is None:
        _PROJECT = {s["name"]: s for s in json.load(open(os.path.join(DATA_DIR, "sprites.json"), encoding="utf-8"))}
    if "scala" not in d or "a" not in d:
        raise SystemExit("%s: manca scala o posizione su %s (lancia tools/14_allinea.py)" % (name, d["su"]))
    b = _PROJECT[d["su"]]
    sc = d["scala"]
    im = im.resize((max(1, round(im.width * sc)), max(1, round(im.height * sc))), Image.LANCZOS)
    # tela grande come quella dell'integro, allargata se il disegno sporge
    # (i muri verticali danneggiati: 14 px sopra)
    ax, ay = d["a"]
    x0, y0 = min(0, ax), min(0, ay)
    x1, y1 = max(b["width"], ax + im.width), max(b["height"], ay + im.height)
    out = Image.new("RGBA", (x1 - x0, y1 - y0), (0, 0, 0, 0))
    out.paste(im, (ax - x0, ay - y0), im)
    return out, {**d, "origin": [b["origin_x"] - x0, b["origin_y"] - y0]}


def tile_image(im, box):
    """Il riquadro box dello sprite, nella tela intera (stessa origine)."""
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    out.paste(im.crop(box), box[:2])
    return out


def slice_image(im, x0, x1):
    """La fetta [x0, x1) dello sprite, nella tela intera (stessa origine)."""
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    out.paste(im.crop((x0, 0, x1, im.height)), (x0, 0))
    return out


def derived():
    """[(nome, gruppo, immagine, origine)] degli sprite derivati (nuovi.json
    "derivati"): uno sprite nuovo rimpicciolito a `lato` px di larghezza,
    ritagliato sull'alpha, con l'origine al centro."""
    out = []
    for name, d in load().get("derivati", {}).items():
        im = image(d["da"])
        im = im.crop(im.getchannel("A").getbbox())
        w = d["lato"]
        im = im.resize((w, max(1, round(im.height * w / im.width))), Image.LANCZOS)
        if d.get("alpha") is not None:  # [§9.42] come le icone dell'originale (alpha 179/255)
            im.putalpha(im.getchannel("A").point(lambda v: round(v * d["alpha"])))
        out.append((name, d.get("gruppo", "gui"), im, (im.width // 2, im.height // 2)))
    return out
