"""Kit per disegnare le mappe in Tiled (mapeditor.org) con gli sprite del
gioco. STUDIO.md §9.

Scrive (non versionato, si rigenera) build/535-tiled-kit/ e lo zip
build/535-tiled-kit.zip:

  LEGGIMI.md             come si usa il kit
  535.tiled-project      il progetto di Tiled: cartelle e la classe "bosco"
  kit.json               tile -> oggetto, sprite, dimensioni e origine
                         (lo legge tools/12_tiled_import.py)
  tileset/<nome>.tsx     un tileset "collezione di immagini" per categoria
                         (tools/tiledkit.py TILESETS)
  img/<tileset>/*.png    un'immagine per sprite (le unita' in una sola
                         posa), ritagliata e con l'origine nel centro
  img/sfondi/*.png       gli sfondi ripetuti delle room (green1, city2...)
  mappe/nuova.tmx        mappa vuota 6000x6000 coi livelli gia' pronti
  mappe/<room>.tmx       le room dell'autore (match, lvl01, lvl02) convertite:
                         esempi, e il collaudo del kit (tools/12 --check)
  mappe/lvl03.tmx ...    i livelli nuovi, copiati da mappe/ del repo

Le macchie d'erba, di spighe e di fili d'erba (burst_erba1, burst_grano1,
chiazzaparticellare) nel gioco sono particelle senza sprite: nel kit sono
un'immagine della macchia com'e' in partita (stesse particelle, stessa
ellisse di 1000x600 px), disegnata qui una volta.

Uso:
  python3 tools/11_tiled_kit.py                      kit completo + zip
  python3 tools/11_tiled_kit.py --nuova lvl03 4000x6000
                                                     in piu' una mappa vuota
                                                     mappe/lvl03.tmx 4000x6000
"""
import glob
import hashlib
import importlib.util
import json
import math
import os
import random
import shutil
import sys
import xml.etree.ElementTree as ET
import zipfile

from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _paths import DATA_DIR, GMX_DIR, REPO_DIR, SRC_DIR, TOOLS, need  # noqa: E402
import tiledkit as tk  # noqa: E402
import nuovi  # noqa: E402

ROOMS = ["match", "lvl01", "lvl02"]
# Sprite del gioco diversi da quelli del progetto GameMaker [§8.16]: il campo
# coltivato e' campo_grano (ricavato da tools/05_atlas.py)
SPRITE_OVERRIDE = {"campo": ["campo_grano"]}
TEMPLATE_SIZE = (6000, 6000)
TILED_VERSION = ("1.10", "1.11.2")   # formato dei file, versione di Tiled di riferimento


def atlas_module():
    spec = importlib.util.spec_from_file_location("atlas05", os.path.join(TOOLS, "05_atlas.py"))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def sprite_frame(name):
    return Image.open(os.path.join(GMX_DIR, "sprites", "images", name + "_0.png")).convert("RGBA")


# ------------------------------------------------------------ immagini

def centered(im, ox, oy):
    """Ritaglia sull'alpha e allarga con bordo trasparente finche' (ox, oy)
    sta nel centro esatto dell'immagine. Restituisce (immagine, origine)."""
    bb = im.getchannel("A").getbbox() or (0, 0, im.width, im.height)
    im = im.crop(bb)
    ox, oy = ox - bb[0], oy - bb[1]
    hw = max(ox, im.width - ox, 1)
    hh = max(oy, im.height - oy, 1)
    hw, hh = math.ceil(hw), math.ceil(hh)
    out = Image.new("RGBA", (2 * hw, 2 * hh), (0, 0, 0, 0))
    out.paste(im, (round(hw - ox), round(hh - oy)))
    return out, (hw, hh)


def topleft(im, ox, oy):
    """Origine in alto a sinistra (0, 0): si ritaglia solo a destra e in basso."""
    assert (ox, oy) == (0, 0)
    bb = im.getchannel("A").getbbox() or (0, 0, im.width, im.height)
    return im.crop((0, 0, bb[2], bb[3])), (0, 0)


def font(size):
    try:
        return ImageFont.load_default(size)
    except TypeError:  # Pillow vecchio
        return ImageFont.load_default()


def labelled(marker, mo, text):
    """Segnalino di regia: lo sprite dell'editor (o un quadrato) e il nome
    dell'oggetto sotto, su fondo scuro. L'origine resta quella del segnalino."""
    f = font(18)
    tw = int(f.getlength(text)) + 12
    if marker is None:
        marker = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
        d = ImageDraw.Draw(marker)
        d.rectangle((2, 2, 61, 61), fill=(40, 40, 60, 200), outline=(255, 210, 80, 255), width=3)
        mo = (32, 32)
    w = max(marker.width, tw)
    out = Image.new("RGBA", (w, marker.height + 28), (0, 0, 0, 0))
    mx = (w - marker.width) // 2
    out.alpha_composite(marker, (mx, 0))
    d = ImageDraw.Draw(out)
    lx = (w - tw) // 2
    d.rounded_rectangle((lx, marker.height + 2, lx + tw - 1, marker.height + 26), 5, fill=(20, 20, 30, 210))
    d.text((lx + 6, marker.height + 5), text, font=f, fill=(255, 230, 150, 255))
    return out, (mo[0] + mx, mo[1])


def tint(im, rgb, alpha):
    r, g, b, a = im.split()
    r = r.point(lambda v: v * rgb[0] // 255)
    g = g.point(lambda v: v * rgb[1] // 255)
    b = b.point(lambda v: v * rgb[2] // 255)
    a = a.point(lambda v: round(v * alpha))
    return Image.merge("RGBA", (r, g, b, a))


def decor_image(name, atlas):
    """La macchia com'e' in partita (game/src/effects.js DECOR, regione
    ellisse 1000x600 gaussiana, particelle ferme). Origine al centro."""
    rnd = random.Random(name)
    derived = {n: im for n, _, im, _ in atlas.derived_sprites()}
    shapes = {n: im for n, im, _ in atlas.particle_shapes()}
    lerp = lambda a, b, t: tuple(round(x + (y - x) * t) for x, y in zip(a, b))
    if name == "burst_erba1":
        base = derived["erba_chiara"]
        groups = [(((51, 70, 36), (80, 105, 52)), 1100), (((80, 105, 52), (114, 132, 66)), 1000),
                  (((114, 132, 66), (145, 155, 80)), 500)]
        parts = [(base, rnd.uniform(0.4, 0.7), rnd.uniform(-15, 15), lerp(*c, rnd.random()), 0.35)
                 for c, n in groups for _ in range(n)]
        rnd.shuffle(parts)
    elif name == "burst_grano1":
        base = sprite_frame("part_crop")
        parts = [(base, rnd.uniform(0.4, 0.7), rnd.uniform(-15, 15), (255, 255, 255), 0.3) for _ in range(2500)]
    else:  # chiazzaparticellare: fili d'erba (pt_shape_line, quasi verticali)
        base = shapes["__pt_line"]
        parts = [(base, rnd.uniform(0.1, 0.3), rnd.uniform(85, 95),
                  lerp((52, 94, 10), (113, 151, 56), rnd.random()), 1.0) for _ in range(1700)]
    M = 60
    out = Image.new("RGBA", (1000 + 2 * M, 600 + 2 * M), (0, 0, 0, 0))
    cache = {}
    for im, s, ang, col, alpha in parts:
        while True:
            u = (rnd.random() + rnd.random() + rnd.random()) / 3
            v = (rnd.random() + rnd.random() + rnd.random()) / 3
            if (u * 2 - 1) ** 2 + (v * 2 - 1) ** 2 <= 1:
                break
        x, y = M + u * 1000, M + v * 600
        key = (id(im), round(s, 2), round(ang), col, alpha)
        p = cache.get(key)
        if p is None:
            p = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
            p = tint(p, col, alpha).rotate(ang, Image.BICUBIC, expand=True)
            cache[key] = p
        out.alpha_composite(p, (round(x - p.width / 2), round(y - p.height / 2)))
    return out, (M + 500, M + 300)


# ------------------------------------------------------------- catalogo

def catalogue():
    """[(tileset, oggetto, sprite, immagine, origine)] di tutto cio' che si piazza."""
    need(os.path.join(GMX_DIR, "sprites", "images"), "gmx/sprites/images (lancia 01_unpack.py)")
    gpath = os.path.join(REPO_DIR, "game", "assets", "objects.json")
    need(gpath, "game/assets/objects.json (lancia tools/07_scene.py)")
    info = json.load(open(gpath, encoding="utf-8"))
    data = {o["name"]: o for o in json.load(open(os.path.join(DATA_DIR, "objects.json"), encoding="utf-8"))}
    sprites = {s["name"]: s for s in json.load(open(os.path.join(DATA_DIR, "sprites.json"), encoding="utf-8"))}
    atlas = atlas_module()
    derived = {n: (im, o) for n, _, im, o in atlas.derived_sprites()}

    def create_code(name):
        for c in [name] + info[name]["parents"]:
            p = os.path.join(SRC_DIR, "objects", c, "Create.gml")
            if os.path.exists(p):
                return open(p, encoding="utf-8").read()
        return ""

    def variants(name):
        if name in SPRITE_OVERRIDE:
            return SPRITE_OVERRIDE[name]
        e = info[name]
        out = list(e.get("choices") or ([e["sprite"]] if e["sprite"] else []))
        # chiazza01: tipo=irandom_range(1,2), se 2 chiazza2 [C]: lo sprite
        # dell'oggetto e' l'altra variante
        if "irandom" in create_code(name) and data[name]["sprite"] and data[name]["sprite"] not in out:
            out.insert(0, data[name]["sprite"])
        return out

    new_objs = {k: v for k, v in nuovi.load()["objects"].items() if v.get("kit", True) and v["sprite"]}
    new_sprites = nuovi.sprites()
    out = []
    for name in sorted(info):
        cat = tk.category(name, info[name], new_objs)
        if cat is None:
            continue
        if cat == "nuovi":
            sp = new_objs[name]["sprite"]
            out.append((cat, name, sp, new_sprites[sp]["image"], tuple(new_sprites[sp]["origin"])))
            continue
        if name in tk.DECOR:
            im, o = decor_image(name, atlas)
            out.append((cat, name, name, im, o))
            continue
        for sp in variants(name):
            if sp in derived:
                im, o = derived[sp]
            else:
                im, o = sprite_frame(sp), (sprites[sp]["origin_x"], sprites[sp]["origin_y"])
            out.append((cat, name, sp, im, o))
    for name in tk.regia_objects(info):
        if name not in data:  # oggetti di regia nuovi (nuovi.json, kit: false)
            continue
        sp = data[name]["sprite"]
        marker = sprite_frame(sp) if sp else None
        mo = (sprites[sp]["origin_x"], sprites[sp]["origin_y"]) if sp else None
        im, o = labelled(marker, mo, name)
        out.append(("regia", name, sp or "", im, o))
    return out, info


# --------------------------------------------------------------- scrittura

def xml_write(root, path):
    tk.indent(root)
    with open(path, "wb") as f:
        f.write(b'<?xml version="1.0" encoding="UTF-8"?>\n')
        f.write(ET.tostring(root, encoding="utf-8"))
        f.write(b"\n")


def build_kit(out_dir):
    items, info = catalogue()
    if os.path.isdir(out_dir):
        shutil.rmtree(out_dir)
    for d in ("tileset", "img/sfondi", "mappe"):
        os.makedirs(os.path.join(out_dir, d), exist_ok=True)
    manifest = {"formato": "535-tiled-kit", "versione": tk.KIT_VERSION, "tile": tk.TILE,
                "tilesets": {}, "sfondi": {}}
    ram = {}
    nvar = {}
    for _, obj, _, _, _ in items:
        nvar[obj] = nvar.get(obj, 0) + 1
    for ts, title, align in tk.TILESETS:
        tiles = []
        os.makedirs(os.path.join(out_dir, "img", ts), exist_ok=True)
        for cat, obj, sp, im, o in items:
            if cat != ts:
                continue
            im, o = (topleft if align == "topleft" else centered)(im, *o)
            fn = (obj + ".png") if nvar[obj] == 1 else "%s__%s.png" % (obj, sp)
            rel = "img/%s/%s" % (ts, fn)
            im.save(os.path.join(out_dir, rel), optimize=True)
            tiles.append({"id": len(tiles), "object": obj, "sprite": sp, "image": rel,
                          "size": [im.width, im.height], "origin": list(o)})
            ram[ts] = ram.get(ts, 0) + im.width * im.height * 4
        manifest["tilesets"][ts] = {"titolo": title, "align": align, "tiles": tiles}
        root = ET.Element("tileset", {
            "version": TILED_VERSION[0], "tiledversion": TILED_VERSION[1], "name": ts,
            "tilewidth": str(max(t["size"][0] for t in tiles)),
            "tileheight": str(max(t["size"][1] for t in tiles)),
            "tilecount": str(len(tiles)), "columns": "0", "objectalignment": align})
        props = ET.SubElement(ET.SubElement(root, "properties"), "property")
        props.attrib.update({"name": "descrizione", "value": title})
        ET.SubElement(root, "grid", {"orientation": "orthogonal", "width": "1", "height": "1"})
        for t in tiles:
            e = ET.SubElement(root, "tile", {"id": str(t["id"]), "type": t["object"]})
            p = ET.SubElement(e, "properties")
            ET.SubElement(p, "property", {"name": "sprite", "value": t["sprite"]})
            ET.SubElement(e, "image", {"source": "../" + t["image"], "width": str(t["size"][0]),
                                       "height": str(t["size"][1])})
        xml_write(root, os.path.join(out_dir, "tileset", ts + ".tsx"))
    for b in json.load(open(os.path.join(DATA_DIR, "backgrounds.json"), encoding="utf-8")):
        im = Image.open(os.path.join(GMX_DIR, "background", "images", b["image"])).convert("RGBA")
        rel = "img/sfondi/%s.png" % b["name"]
        im.save(os.path.join(out_dir, rel), optimize=True)
        manifest["sfondi"][b["name"]] = {"image": rel, "size": [im.width, im.height]}
    with open(os.path.join(out_dir, "kit.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)
    write_project(out_dir)
    n = sum(len(t["tiles"]) for t in manifest["tilesets"].values())
    print("kit: %d tile in %d tileset, memoria delle immagini in Tiled %.0f MB"
          % (n, len(manifest["tilesets"]), sum(ram.values()) / 1e6))
    for ts, b in ram.items():
        print("  %-15s %3d tile %6.1f MB" % (ts, len(manifest["tilesets"][ts]["tiles"]), b / 1e6))
    return manifest, info


def write_project(out_dir):
    """Progetto di Tiled: la cartella del kit, la classe "bosco" (con i
    valori predefiniti che usa tools/12_tiled_import.py) e la classe "vista"."""
    proj = {
        "automappingRulesFile": "",
        "commands": [],
        "compatibilityVersion": 1100,
        "extensionsPath": "extensions",
        "folders": ["."],
        "properties": [],
        "propertyTypes": [{
            "id": 1, "name": "bosco", "type": "class", "useAs": ["object"],
            "color": "#ff2e7d32", "drawFill": True,
            "members": [
                {"name": "distanza", "type": "int", "value": tk.FOREST_SPACING},
                {"name": "oggetto", "type": "string", "value": "albero"},
            ]}, {
            # la vista iniziale: solo il contorno, senza coprire la mappa
            "id": 2, "name": tk.VIEW_TYPE, "type": "class", "useAs": ["object"],
            "color": "#ffffb000", "drawFill": False, "members": []}],
    }
    with open(os.path.join(out_dir, "535.tiled-project"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(proj, f, indent=4)


class MapWriter:
    """Una mappa di Tiled coi tileset del kit e i livelli di tk.LAYERS."""

    def __init__(self, manifest, width, height, background, colour=0xC0C0C0):
        self.m = manifest
        self.width, self.height = width, height
        self.firstgid, gid = {}, 1
        for ts in manifest["tilesets"]:
            self.firstgid[ts] = gid
            gid += len(manifest["tilesets"][ts]["tiles"])
        self.by_obj = {}
        for ts, t in manifest["tilesets"].items():
            for tile in t["tiles"]:
                tile = dict(tile, align=t["align"], tileset=ts)
                self.by_obj.setdefault(tile["object"], []).append(tile)
        self.background, self.colour = background, colour
        self.layers = {name: [] for name in tk.LAYERS}
        self.next_id = 1

    def add(self, layer, obj, x, y, sx=1, sy=1, angle=0, sprite=None):
        tiles = self.by_obj.get(obj)
        if not tiles:
            raise KeyError(obj)
        tile = next((t for t in tiles if t["sprite"] == sprite), tiles[0])
        tx, ty, w, h, rot, fh, fv = tk.to_tiled(tile, x, y, sx, sy, angle)
        gid = self.firstgid[tile["tileset"]] + tile["id"]
        gid |= (tk.FLIP_H if fh else 0) | (tk.FLIP_V if fv else 0)
        a = {"id": str(self.next_id), "gid": str(gid), "x": tk.num(tx), "y": tk.num(ty),
             "width": tk.num(w), "height": tk.num(h)}
        if rot:
            a["rotation"] = tk.num(rot)
        self.layers[layer].append(a)
        self.next_id += 1

    def add_view(self, x, y, w, h):
        self.layers["regia"].append({"id": str(self.next_id), "name": "vista iniziale", "type": tk.VIEW_TYPE,
                                     "x": tk.num(x), "y": tk.num(y), "width": tk.num(w), "height": tk.num(h)})
        self.next_id += 1

    def write(self, path):
        T = tk.TILE
        root = ET.Element("map", {
            "version": TILED_VERSION[0], "tiledversion": TILED_VERSION[1], "orientation": "orthogonal",
            "renderorder": "right-down", "width": str(math.ceil(self.width / T)),
            "height": str(math.ceil(self.height / T)), "tilewidth": str(T), "tileheight": str(T),
            "infinite": "0", "backgroundcolor": "#%06x" % self.colour,
            "nextlayerid": str(len(tk.LAYERS) + 2), "nextobjectid": str(self.next_id)})
        for ts in self.m["tilesets"]:
            ET.SubElement(root, "tileset", {"firstgid": str(self.firstgid[ts]), "source": "../tileset/%s.tsx" % ts})
        bg = self.m["sfondi"][self.background]
        il = ET.SubElement(root, "imagelayer", {"id": "1", "name": "sfondo", "locked": "1",
                                                "repeatx": "1", "repeaty": "1"})
        ET.SubElement(il, "image", {"source": "../" + bg["image"], "width": str(bg["size"][0]),
                                    "height": str(bg["size"][1])})
        for k, layer in enumerate(tk.LAYERS):
            attrs = {"id": str(k + 2), "name": layer,
                     "draworder": "topdown" if layer in ("terreno", "oggetti") else "index"}
            if layer == tk.FOREST_LAYER:
                attrs.update({"color": "#2e7d32", "opacity": "0.6"})
            if layer == "regia":
                attrs["color"] = "#ffb000"
            g = ET.SubElement(root, "objectgroup", attrs)
            for a in self.layers[layer]:
                ET.SubElement(g, "object", a)
        xml_write(root, path)


def room_to_map(manifest, info, room):
    r = tk.room_json(room)
    bg = next((b["name"] for b in r["backgrounds"] if b["visible"] and b["name"]), "green1")
    colour = r["colour"]
    rgb = ((colour & 0xFF) << 16) | (colour & 0xFF00) | ((colour >> 16) & 0xFF)  # GM: BGR
    mw = MapWriter(manifest, r["width"], r["height"], bg, rgb)
    missing = set()
    for k, i in enumerate(r["instances"]):
        o = i["object"]
        tiles = mw.by_obj.get(o)
        if not tiles:
            missing.add(o)
            continue
        # variante "a caso" ma sempre la stessa per la stessa istanza
        h = int(hashlib.md5(("%s:%d" % (room, k)).encode()).hexdigest(), 16)
        sprite = tiles[h % len(tiles)]["sprite"]
        cat = tiles[0]["tileset"]
        mw.add(tk.layer_of(o, info[o], cat), o, i["x"], i["y"], i["scale_x"], i["scale_y"], i["rotation"], sprite)
    if missing:
        raise SystemExit("%s: oggetti senza tile nel kit: %s" % (room, ", ".join(sorted(missing))))
    v = r["views"][0]
    mw.add_view(v["xview"], v["yview"], v["wview"], v["hview"])
    return mw


def new_map(manifest, w, h, bg="green1"):
    mw = MapWriter(manifest, w, h, bg)
    mw.add("regia", "manager", 100, 100)
    mw.add_view(0, 0, 3000, 2000)
    return mw


def write_readme(out_dir, manifest):
    rows = "\n".join("| `%s` | %s | %d |" % (ts, t["titolo"], len(t["tiles"]))
                     for ts, t in manifest["tilesets"].items())
    text = README.format(tilesets=rows, spacing=tk.FOREST_SPACING, tile=tk.TILE)
    with open(os.path.join(out_dir, "LEGGIMI.md"), "w", encoding="utf-8", newline="\n") as f:
        f.write(text)


README = """# Kit per Tiled — 535

Kit per disegnare le mappe dei livelli in [Tiled](https://www.mapeditor.org)
con gli sprite veri del gioco. Generato da `tools/11_tiled_kit.py`: non
modificare i file del kit a mano (si rigenerano); le mappe che disegni,
invece, sono tue.

## Per cominciare

1. Estrai lo zip dove vuoi, **senza spostare le cartelle** fra loro (le
   mappe trovano tileset e immagini con percorsi relativi).
2. In Tiled: *File → Open File or Project…* e apri `535.tiled-project`
   (aggiunge la classe `bosco` e mostra le cartelle del kit nel pannello
   *Project*).
3. I livelli gia' disegnati sono in `mappe/` (`lvl03.tmx`, il monastero):
   continua da quelli, **non dalla tua copia vecchia** (e' fatta col kit di
   prima e qui non torna). Per un livello nuovo apri `mappe/nuova.tmx` e
   salvala subito con un altro nome
   (*File → Save As…*, per esempio `mappe/lvl03.tmx`), oppure apri una delle
   room dell'autore gia' convertite (`mappe/match.tmx`, `lvl01.tmx`,
   `lvl02.tmx`) per vedere come sono fatte.
4. Dimensioni: *Map → Resize Map…* (la griglia e' di {tile} px: una mappa di
   6000 px e' larga 120 celle). Le coordinate in pixel sono quelle del gioco.

## Livelli della mappa (dal basso)

| Livello | Cosa ci va | Ordine di disegno |
|---|---|---|
| `sfondo` | lo sfondo ripetuto (bloccato: per cambiarlo, *Image* nelle proprieta' del livello, da `img/sfondi/`) | — |
| `suolo` | strade, sentieri, prati, erba, chiazze, fiori, campi | nell'ordine in cui li metti |
| `erba e spighe` | le macchie d'erba e di spighe (`natura`) | nell'ordine in cui li metti |
| `terreno` | montagne, fiumi | dall'alto in basso, come nel gioco |
| `oggetti` | tutto il resto: alberi, risorse, edifici, unita', citta' | dall'alto in basso, come nel gioco |
| `boschi` | forme da riempire di alberi (vedi sotto) | — |
| `regia` | `manager` (uno per mappa, obbligatorio), segnali, suggerimenti, dialoghi, il rettangolo `vista iniziale` | — |

I livelli servono solo a lavorare comodi (bloccane uno col lucchetto per
non spostarlo per sbaglio): **il gioco non li vede**, ordina tutto da se'
con la regola "piu' in basso = davanti". Un oggetto messo nel livello
sbagliato non e' un errore. Unica differenza fra Tiled e il gioco: Tiled
disegna sempre `terreno` sotto `oggetti`, il gioco li mescola per y; cambia
qualcosa solo se un albero o un edificio sta proprio sul bordo alto di una
montagna o di un fiume.

## Piazzare gli oggetti

- Pannello *Tilesets*: un tileset per categoria, una tile per sprite.
  Scegli la tile e usa lo strumento *Insert Tile* (**T**) sul livello giusto.
- Il punto in cui clicchi e' il punto dell'istanza nel gioco (l'origine
  dello sprite): ogni immagine del kit ha l'origine nel centro esatto (per
  questo alcune hanno molto bordo trasparente). Montagne, fiumi e chiazze
  invece sono ancorati in alto a sinistra, come nel gioco.
- Si possono **ruotare** (**Z** / **Shift+Z**, o il campo *Rotation*),
  **ribaltare** (**X** / **Y**) e **ridimensionare** (strumento di
  selezione, maniglie): diventano rotazione, scala e scala negativa
  dell'istanza, attorno all'origine come in GameMaker.
- Nella scheda *Properties* di un oggetto la *Class* e' il nome
  dell'oggetto del gioco: e' quello che conta. Non cambiarla a mano.
- **Varianti**: alberi, case e chiazze hanno piu' tile con la stessa classe
  (`albero` = alb1…alb8). Nel gioco lo sprite lo sceglie ancora il gioco, a
  caso: la variante in Tiled e' solo per vedere l'effetto.
- **Unita'**: si vedono in una sola posa; nel gioco si animano e si girano
  da sole. Non ribaltarle e non ingrandirle: cambiano sprite da sole.
- Rotazione, ribaltamento e scala valgono anche per le collisioni: una
  montagna o un fiume ruotati bloccano le unita' nella forma ruotata.
- **Macchie d'erba e di spighe** (`burst_erba1`, `burst_grano1`,
  `chiazzaparticellare`): nel gioco sono migliaia di fili d'erba in
  un'ellisse di 1000x600 px; l'immagine del kit e' una macchia com'e' in
  partita (i fili cambiano ogni volta, la forma no). Nel gioco le unita' ci
  passano in mezzo; in Tiled stanno sopra.
- Un oggetto si nasconde solo in Tiled col pulsante dell'occhio del
  livello; per toglierlo dal gioco va cancellato.

## Spostare e scegliere fra oggetti sovrapposti

- Strumento *Select Objects* (**S**): clic e trascina per spostare; le
  frecce spostano di 1 px; X e Y esatti nel pannello *Properties*.
- **Blocca i livelli** che non stai toccando (lucchetto nel pannello
  *Layers*): un livello bloccato non si seleziona. E' il modo piu' comodo,
  soprattutto per `suolo` e `terreno`: strade, montagne e fiumi hanno
  immagini grandi (con bordo trasparente) e "prendono" i clic.
- **Pannello *Objects*** (*View → Views and Toolbars → Objects*): l'elenco
  di tutti gli oggetti, livello per livello. Un clic nell'elenco seleziona
  l'oggetto nella mappa anche se e' coperto; poi lo sposti con le frecce o
  coi campi X e Y.
- **Alt + clic** sull'oggetto: seleziona quello sotto; ripetendo si passa
  al successivo.
- **Alt + trascinamento**: sposta l'oggetto sotto il cursore senza
  cambiare la selezione.

## Boschi (il pennello)

Per non piazzare centinaia di alberi a mano: nel livello `boschi` disegna
rettangoli, ellissi o poligoni (**R**, **C**, **P**). Ogni forma diventa un
bosco: lo script la riempie di alberi a caso ma ben distribuiti, a circa
`distanza` px l'uno dall'altro (predefinito {spacing}; i boschi dell'autore in
`match` stanno a circa 100). Per cambiare: scegli la classe `bosco` nella
forma e modifica `distanza` (piu' piccola = piu' fitto) o `oggetto`
(`albero`, che si taglia per il legno, oppure `albero_fake`, solo
decorazione). La stessa forma da' sempre gli stessi alberi.
Non e' un'anteprima: in Tiled la forma resta una macchia verde; gli alberi
li vedi nell'anteprima dello script o nel gioco.

## Gruppi (oggetti che la regia del livello tiene da parte)

Un livello che si chiama `gruppo <nome>` (per esempio `gruppo citta`) mette
da parte i suoi oggetti: la regia del livello decide quando entrano in
gioco. In `lvl03`: `gruppo citta` (il villaggio) non c'e' finche' i soldati
non arrivano, poi compare ed e' tuo; `gruppo monastero` (cinta, porta,
torri) c'e' da subito ma neutrale, e diventa tuo alla rivelazione. Per
spostare un oggetto in un gruppo: tasto destro sull'oggetto,
*Move to Layer*. Per un gruppo nuovo dimmi cosa deve fare.

## Vista iniziale e regia

- `vista iniziale` (livello `regia`) e' il rettangolo dello schermo
  all'inizio della partita: spostalo dove vuoi che parta la telecamera.
- `manager` deve esserci (uno): e' l'oggetto che fa girare la partita.
- La logica del livello (obiettivi, dialoghi, ondate, risorse iniziali)
  per ora si scrive nel codice del gioco: descrivila a parole quando
  consegni la mappa.

## Consegnare una mappa

Manda il file `.tmx` (solo quello: tileset e immagini li ho gia'). Se hai
Python: `python3 tools/12_tiled_import.py tuamappa.tmx --anteprima`
controlla la mappa (oggetti sconosciuti, coordinate fuori mappa, manager
mancante) e disegna un'immagine della mappa intera con i boschi riempiti.

## Sprite nuovi

I tuoi sprite (il monastero) sono nel tileset `nuovi`. Per aggiungerne
altri non toccare i tileset del kit: mandami l'immagine (e la maschera di
collisione `_mask.png`, stessa misura) e dimmi come si comportano; li metto
io in `nuovi/` e rigenero il kit. Il tileset `nuovi` cresce in fondo, le
mappe gia' fatte restano valide.

## Tileset

| Tileset | Contenuto | Tile |
|---|---|---|
{tilesets}
"""


def main():
    args = sys.argv[1:]
    manifest, info = build_kit(tk.KIT_DIR)
    write_readme(tk.KIT_DIR, manifest)
    maps = os.path.join(tk.KIT_DIR, "mappe")
    new_map(manifest, *TEMPLATE_SIZE).write(os.path.join(maps, "nuova.tmx"))
    # [§9.14] una room dell'autore modificata in Tiled (mappe/<room>.tmx del
    # repo) prende il posto dell'originale nel kit; la conversione
    # dell'originale va in mappe/originali/ (il collaudo, tools/12 --check)
    os.makedirs(os.path.join(maps, "originali"), exist_ok=True)
    for room in ROOMS:
        mw = room_to_map(manifest, info, room)
        edited = os.path.exists(os.path.join(REPO_DIR, "mappe", room + ".tmx"))
        sub = "originali" if edited else ""
        mw.write(os.path.join(maps, sub, room + ".tmx"))
        print("mappe/%s%s.tmx: %d oggetti" % (sub + "/" if sub else "", room, mw.next_id - 2))
    # [§9.10] le mappe dei livelli nuovi (mappe/ del repo), per continuare a
    # disegnarle col kit
    for src in sorted(glob.glob(os.path.join(REPO_DIR, "mappe", "*.tmx"))):
        shutil.copy(src, os.path.join(maps, os.path.basename(src)))
        print("mappe/%s: dal repo" % os.path.basename(src))
    if "--nuova" in args:
        k = args.index("--nuova")
        name, size = args[k + 1], args[k + 2]
        w, h = (int(v) for v in size.lower().split("x"))
        new_map(manifest, w, h).write(os.path.join(maps, name + ".tmx"))
        print("mappe/%s.tmx: mappa vuota %dx%d" % (name, w, h))
    zpath = tk.KIT_DIR + ".zip"
    with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as z:
        for base, _, files in os.walk(tk.KIT_DIR):
            for fn in sorted(files):
                p = os.path.join(base, fn)
                z.write(p, os.path.relpath(p, os.path.dirname(tk.KIT_DIR)))
    print("zip: %s (%.1f MB)" % (os.path.relpath(zpath, REPO_DIR), os.path.getsize(zpath) / 1e6))


if __name__ == "__main__":
    main()
