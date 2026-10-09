"""Mappa di Tiled (.tmx, fatta col kit di tools/11_tiled_kit.py) -> scenario
del gioco. STUDIO.md §9.

Legge la mappa e i tileset del kit, riconosce ogni oggetto dalla tile
(classe = nome dell'oggetto GameMaker), riporta posizione, scala,
ribaltamento e rotazione all'istanza (tools/tiledkit.py from_tiled), riempie
di alberi le forme del livello "boschi" e scrive lo scenario:

  scenari/<nome>.json   {"format": "535-scenario", "version": 1, "name",
                         "width", "height", "background", "colour", "view",
                         "instances": [{"object", "x", "y", "scale_x",
                         "scale_y", "rotation", "sprite"?, "group"?}]}

Le istanze sono nell'ordine di creazione di Tiled (l'id dell'oggetto), come
l'ordine delle istanze di una room di GameMaker; gli alberi di un bosco
prendono il posto della forma. "sprite" c'e' solo per gli oggetti con piu'
varianti (la tile scelta in Tiled).

Controlli: tile o forme che non vengono dal kit, oggetti con l'origine
fuori dalla mappa, manager mancante o doppio, vista iniziale mancante.

Uso:
  python3 tools/12_tiled_import.py mappa.tmx [--out file.json] [--anteprima [scala]]
  python3 tools/12_tiled_import.py --check match [lvl01 ...]
      collaudo: la room convertita dal kit (build/535-tiled-kit/mappe/<room>.tmx)
      deve ridare le istanze di data/rooms/<room>.json
  --anteprima: build/anteprime/<nome>.png, la mappa intera con gli sprite del
      kit nell'ordine di disegno del gioco (scala predefinita 0.125)
"""
import json
import math
import os
import random
import re
import sys
import xml.etree.ElementTree as ET

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _paths import REPO_DIR  # noqa: E402
import tiledkit as tk  # noqa: E402

OUT_DIR = os.path.join(REPO_DIR, "scenari")
PREVIEW_DIR = os.path.join(REPO_DIR, "build", "anteprime")
FORMAT, VERSION = "535-scenario", 1
PLAYABLE = {"edifici", "unita", "nemici", "risorse"}


class MapError(Exception):
    pass


def props(elem):
    out = {}
    p = elem.find("properties")
    if p is not None:
        for e in p.findall("property"):
            v = e.get("value", e.text or "")
            t = e.get("type", "string")
            out[e.get("name")] = int(v) if t == "int" else float(v) if t == "float" else v
    return out


def shape_of(o):
    """La forma di un oggetto senza tile: ("rect"|"ellipse"|"polygon", dati)."""
    x, y = float(o.get("x", 0)), float(o.get("y", 0))
    w, h = float(o.get("width", 0)), float(o.get("height", 0))
    rot = float(o.get("rotation", 0))
    poly = o.find("polygon")
    if poly is not None:
        pts = [tuple(float(v) for v in p.split(",")) for p in poly.get("points").split()]
    elif o.find("ellipse") is not None:
        pts = [(w / 2 + w / 2 * math.cos(2 * math.pi * k / 64), h / 2 + h / 2 * math.sin(2 * math.pi * k / 64))
               for k in range(64)]
    elif o.find("polyline") is not None or o.find("point") is not None or o.find("text") is not None:
        return None
    else:
        pts = [(0, 0), (w, 0), (w, h), (0, h)]
    # rotazione di Tiled (oraria) attorno a (x, y)
    t = math.radians(rot)
    c, s = math.cos(t), math.sin(t)
    return [(x + px * c - py * s, y + px * s + py * c) for px, py in pts]


def inside(pt, poly):
    x, y = pt
    n, ins = len(poly), False
    for k in range(n):
        x1, y1 = poly[k]
        x2, y2 = poly[(k + 1) % n]
        if (y1 > y) != (y2 > y) and x < x1 + (y - y1) * (x2 - x1) / (y2 - y1):
            ins = not ins
    return ins


def forest(poly, spacing, seed):
    """Punti dentro il poligono, a distanza >= spacing l'uno dall'altro
    (campionamento di Poisson, Bridson): fitti ma senza file ne' grumi."""
    rnd = random.Random(seed)
    xs, ys = [p[0] for p in poly], [p[1] for p in poly]
    x0, y0, x1, y1 = min(xs), min(ys), max(xs), max(ys)
    cell = spacing / math.sqrt(2)
    grid = {}
    pts, active = [], []

    def ok(p):
        if not (x0 <= p[0] <= x1 and y0 <= p[1] <= y1) or not inside(p, poly):
            return False
        gx, gy = int((p[0] - x0) / cell), int((p[1] - y0) / cell)
        for ix in range(gx - 2, gx + 3):
            for iy in range(gy - 2, gy + 3):
                q = grid.get((ix, iy))
                if q and (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2 < spacing * spacing:
                    return False
        return True

    def add(p):
        pts.append(p)
        active.append(p)
        grid[(int((p[0] - x0) / cell), int((p[1] - y0) / cell))] = p

    for _ in range(200):  # un primo punto dentro la forma
        p = (rnd.uniform(x0, x1), rnd.uniform(y0, y1))
        if inside(p, poly):
            add(p)
            break
    while active:
        k = rnd.randrange(len(active))
        a = active[k]
        for _ in range(30):
            r, t = spacing * (1 + rnd.random()), rnd.uniform(0, 2 * math.pi)
            p = (a[0] + r * math.cos(t), a[1] + r * math.sin(t))
            if ok(p):
                add(p)
                break
        else:
            active.pop(k)
    # dall'alto in basso, come si mettono a mano
    return sorted(pts, key=lambda p: (round(p[1]), p[0]))


def box(tile, x, y, w, h, rotation):
    """Rettangolo che contiene l'oggetto di Tiled (ruotato attorno all'ancora)."""
    ax, ay = tk.ALIGN[tile["align"]]
    t = math.radians(rotation)
    c, s = math.cos(t), math.sin(t)
    pts = [(x + px * c - py * s, y + px * s + py * c)
           for px in (-ax * w, (1 - ax) * w) for py in (-ay * h, (1 - ay) * h)]
    return (min(p[0] for p in pts), min(p[1] for p in pts), max(p[0] for p in pts), max(p[1] for p in pts))


def load_map(path, kit=None):
    """Legge una mappa .tmx: (scenario, avvisi)."""
    kit = kit or tk.load_manifest()
    root = ET.parse(path).getroot()
    if root.tag != "map":
        raise MapError("%s non e' una mappa di Tiled (.tmx)" % path)
    if root.get("orientation") != "orthogonal" or root.get("infinite") == "1":
        raise MapError("la mappa deve essere ortogonale e non infinita (Map > Map Properties)")
    T = int(root.get("tilewidth")), int(root.get("tileheight"))
    width, height = int(root.get("width")) * T[0], int(root.get("height")) * T[1]
    name = os.path.splitext(os.path.basename(path))[0]
    warn = []

    # gid -> tile del kit, dai tileset della mappa (per nome del file .tsx)
    tiles = []  # (firstgid, nome, tiles per id)
    for ts in root.findall("tileset"):
        src = ts.get("source")
        tsname = os.path.splitext(os.path.basename(src))[0] if src else ts.get("name")
        if tsname not in kit["tilesets"]:
            raise MapError("tileset %r non e' del kit (usa solo i tileset in tileset/)" % tsname)
        k = kit["tilesets"][tsname]
        tiles.append((int(ts.get("firstgid")), tsname,
                      {t["id"]: dict(t, align=k["align"], tileset=tsname) for t in k["tiles"]}))
    tiles.sort(key=lambda t: -t[0])
    variants = {}
    for k in kit["tilesets"].values():
        for t in k["tiles"]:
            variants[t["object"]] = variants.get(t["object"], 0) + 1

    def tile_of(gid):
        for first, tsname, by in tiles:
            if gid >= first:
                return by.get(gid - first)
        return None

    background = None
    for il in root.iter("imagelayer"):
        img = il.find("image")
        if img is not None and il.get("visible", "1") != "0":
            b = os.path.splitext(os.path.basename(img.get("source")))[0]
            if b in kit["sfondi"]:
                background = b
            else:
                warn.append("sfondo %r non e' fra quelli del kit: ignorato" % b)
    colour = root.get("backgroundcolor", "#c0c0c0").lstrip("#")[-6:]
    rgb = int(colour, 16)
    gm_colour = ((rgb & 0xFF) << 16) | (rgb & 0xFF00) | ((rgb >> 16) & 0xFF)

    entries, view = [], None  # (id, [istanze])
    for g in root.iter("objectgroup"):
        layer = g.get("name", "")
        # [§9.11] livello "gruppo <nome>": gli oggetti che la regia del livello
        # tiene da parte (creati piu' tardi, o neutrali finche' non passano al
        # giocatore)
        group = layer[len("gruppo "):].strip() if layer.lower().startswith("gruppo ") else None
        for o in g.findall("object"):
            oid = int(o.get("id"))
            where = "oggetto %d nel livello %r" % (oid, layer)
            gid = o.get("gid")
            if gid is not None:
                gid = int(gid)
                fh, fv = bool(gid & tk.FLIP_H), bool(gid & tk.FLIP_V)
                tile = tile_of(gid & tk.GID_MASK)
                if tile is None:
                    warn.append("%s: tile sconosciuta (gid %d), ignorato" % (where, gid & tk.GID_MASK))
                    continue
                cls = o.get("type") or o.get("class")
                if cls and cls != tile["object"]:
                    warn.append("%s: classe %r cambiata a mano, vale quella della tile (%s)"
                                % (where, cls, tile["object"]))
                W, H = tile["size"]
                w = float(o.get("width", W))
                h = float(o.get("height", H))
                x, y, sx, sy, ang = tk.from_tiled(tile, float(o.get("x", 0)), float(o.get("y", 0)), w, h,
                                                  float(o.get("rotation", 0)), fh, fv)
                inst = {"object": tile["object"], "x": round(x), "y": round(y),
                        "scale_x": round(sx, 6), "scale_y": round(sy, 6), "rotation": round(ang, 4)}
                if variants[tile["object"]] > 1:
                    inst["sprite"] = tile["sprite"]
                if group:
                    inst["group"] = group
                # unita', edifici e risorse con l'origine fuori dalla mappa; il
                # resto (montagne, chiazze a cavallo del bordo) solo se non se
                # ne vede niente
                if tile["tileset"] in PLAYABLE:
                    if not (0 <= inst["x"] <= width and 0 <= inst["y"] <= height):
                        warn.append("%s (%s): origine fuori dalla mappa (%d, %d)"
                                    % (where, tile["object"], inst["x"], inst["y"]))
                else:
                    bx0, by0, bx1, by1 = box(tile, float(o.get("x", 0)), float(o.get("y", 0)), w, h,
                                             float(o.get("rotation", 0)))
                    if bx1 < 0 or by1 < 0 or bx0 > width or by0 > height:
                        warn.append("%s (%s): tutto fuori dalla mappa (%d, %d)"
                                    % (where, tile["object"], inst["x"], inst["y"]))
                entries.append((oid, [inst]))
                continue
            cls = o.get("type") or o.get("class") or ""
            if cls == tk.VIEW_TYPE:
                if view:
                    warn.append("%s: seconda vista iniziale, ignorata" % where)
                    continue
                view = {"x": round(float(o.get("x", 0))), "y": round(float(o.get("y", 0))),
                        "w": round(float(o.get("width", 3000))), "h": round(float(o.get("height", 2000)))}
                continue
            if layer == tk.FOREST_LAYER or cls == "bosco":
                poly = shape_of(o)
                if not poly:
                    warn.append("%s: nel livello boschi vanno rettangoli, ellissi o poligoni" % where)
                    continue
                p = props(o)
                spacing = float(p.get("distanza", tk.FOREST_SPACING))
                obj = p.get("oggetto", "albero")
                if obj not in variants:
                    warn.append("%s: oggetto %r sconosciuto, uso albero" % (where, obj))
                    obj = "albero"
                if spacing < 20:
                    warn.append("%s: distanza %g troppo piccola, uso 20" % (where, spacing))
                    spacing = 20
                trees = [{"object": obj, "x": round(px), "y": round(py), "scale_x": 1, "scale_y": 1,
                          "rotation": 0} for px, py in forest(poly, spacing, "%s:%d" % (name, oid))]
                entries.append((oid, trees))
                continue
            warn.append("%s: forma senza tile fuori dal livello boschi, ignorata" % where)

    entries.sort(key=lambda e: e[0])
    instances = [i for _, l in entries for i in l]
    n_manager = sum(1 for i in instances if i["object"] == "manager")
    if n_manager != 1:
        warn.append("ci vuole un manager (livello regia), ne ho trovati %d" % n_manager)
    if view is None:
        warn.append("manca la vista iniziale (rettangolo di classe \"vista\" nel livello regia): uso 0,0")
        view = {"x": 0, "y": 0, "w": 3000, "h": 2000}
    scen = {"format": FORMAT, "version": VERSION, "name": name, "width": width, "height": height,
            "background": background, "colour": gm_colour, "view": view, "instances": instances}
    return scen, warn


# ---------------------------------------------------------------- collaudo

def check_room(room, kit):
    """La room dell'autore -> kit -> scenario deve ridare le stesse istanze."""
    path = os.path.join(tk.KIT_DIR, "mappe", room + ".tmx")
    scen, warn = load_map(path, kit)
    r = tk.room_json(room)
    a, b = r["instances"], scen["instances"]
    bad = []
    if len(a) != len(b):
        bad.append("istanze: %d nella room, %d dallo scenario" % (len(a), len(b)))
    for k, (i, j) in enumerate(zip(a, b)):
        diff = [f for f, tol in (("x", 0), ("y", 0), ("scale_x", 1e-4), ("scale_y", 1e-4), ("rotation", 1e-3))
                if abs(i[f] - j[f]) > tol]
        if i["object"] != j["object"]:
            diff.insert(0, "object")
        if diff:
            bad.append("#%d %s: %s" % (k, i["object"], ", ".join("%s %s -> %s" % (f, i.get(f), j.get(f))
                                                                 for f in diff)))
    v = r["views"][0]
    if scen["view"] != {"x": v["xview"], "y": v["yview"], "w": v["wview"], "h": v["hview"]}:
        bad.append("vista: %s" % scen["view"])
    if (scen["width"], scen["height"]) != (r["width"], r["height"]):
        bad.append("dimensioni: %dx%d" % (scen["width"], scen["height"]))
    bg = next((x["name"] for x in r["backgrounds"] if x["visible"] and x["name"]), None)
    if scen["background"] != bg or scen["colour"] != r["colour"]:
        bad.append("sfondo: %s %s" % (scen["background"], scen["colour"]))
    print("%-6s %4d istanze  %s" % (room, len(b), "identiche" if not bad else "DIVERSE"))
    for line in bad[:20]:
        print("   ", line)
    return not bad


# --------------------------------------------------------------- anteprima

def game_order(instances, info):
    """Ordine di disegno del gioco: il suolo cotto sotto tutto (ground.js),
    poi per depth decrescente (depth -y + k per chi la imposta), a parita'
    nell'ordine di creazione."""
    ground = re.compile(r"^(traccia\d+|strada_\d+|chiazza01|erba_1|prato1)$")

    def depth(i):
        e = info.get(i["object"], {})
        if any(p in ("ally_unit", "enemy_unit") for p in e.get("parents", [])):
            return -i["y"]
        if i["object"] in tk.DECOR:
            return -i["y"] + 300  # le fasce piu' alte della macchia
        d = e.get("depth", 0)
        return -i["y"] + d["y"] if isinstance(d, dict) else d
    keyed = [(0 if ground.match(i["object"]) else 1, -depth(i), k, i) for k, i in enumerate(instances)]
    return [t[3] for t in sorted(keyed, key=lambda t: t[:3])]


def draw_instance(canvas, img, origin, inst, S):
    """Disegna lo sprite com'e' in GameMaker (origine, scala, rotazione)."""
    sx, sy, ang = inst["scale_x"], inst["scale_y"], inst["rotation"]
    w, h = abs(sx) * img.width * S, abs(sy) * img.height * S
    if w < 0.5 or h < 0.5:
        return
    im = img.resize((max(1, round(w)), max(1, round(h))), Image.LANCZOS)
    ox, oy = origin[0] * abs(sx) * S, origin[1] * abs(sy) * S
    if sx < 0:
        im, ox = im.transpose(Image.FLIP_LEFT_RIGHT), w - ox
    if sy < 0:
        im, oy = im.transpose(Image.FLIP_TOP_BOTTOM), h - oy
    if ang % 360:
        cx, cy = im.width / 2, im.height / 2
        im = im.rotate(ang, Image.BICUBIC, expand=True)
        rx, ry = tk._rot(ang, ox - cx, oy - cy)
        ox, oy = im.width / 2 + rx, im.height / 2 + ry
    _paste_clipped(canvas, im, round(inst["x"] * S - ox), round(inst["y"] * S - oy))


def _paste_clipped(canvas, im, x, y):
    x0, y0 = max(0, x), max(0, y)
    x1, y1 = min(canvas.width, x + im.width), min(canvas.height, y + im.height)
    if x1 > x0 and y1 > y0:
        canvas.alpha_composite(im.crop((x0 - x, y0 - y, x1 - x, y1 - y)), (x0, y0))


def preview(scen, kit, S, out_path, order=None):
    base = os.path.dirname(os.path.join(tk.KIT_DIR, "kit.json"))
    tiles = {}
    for k in kit["tilesets"].values():
        for t in k["tiles"]:
            tiles.setdefault(t["object"], {})[t["sprite"]] = t
    W, H = round(scen["width"] * S), round(scen["height"] * S)
    c = scen["colour"]
    canvas = Image.new("RGBA", (W, H), (c & 0xFF, (c >> 8) & 0xFF, (c >> 16) & 0xFF, 255))
    if scen["background"]:
        bg = Image.open(os.path.join(base, kit["sfondi"][scen["background"]]["image"])).convert("RGBA")
        bg = bg.resize((max(1, round(bg.width * S)), max(1, round(bg.height * S))), Image.LANCZOS)
        for y in range(0, H, bg.height):
            for x in range(0, W, bg.width):
                canvas.alpha_composite(bg, (x, y))
    info_path = os.path.join(REPO_DIR, "game", "assets", "objects.json")
    info = json.load(open(info_path, encoding="utf-8")) if os.path.exists(info_path) else {}
    cache = {}
    for k, inst in enumerate((order or game_order)(scen["instances"], info)):
        by = tiles[inst["object"]]
        # senza variante scelta (alberi dei boschi) una a caso, come nel gioco
        t = by.get(inst.get("sprite")) or list(by.values())[random.Random(k).randrange(len(by))]
        if t["image"] not in cache:
            cache[t["image"]] = Image.open(os.path.join(base, t["image"])).convert("RGBA")
        draw_instance(canvas, cache[t["image"]], t["origin"], inst, S)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    canvas.convert("RGB").save(out_path)
    return out_path


def main():
    args = sys.argv[1:]
    if not args or args[0] in ("-h", "--help"):
        print(__doc__)
        return
    kit = tk.load_manifest()
    if args[0] == "--check":
        ok = all([check_room(r, kit) for r in args[1:] or ["match", "lvl01", "lvl02"]])
        if not ok:
            raise SystemExit(1)
        return
    path = args[0]
    try:
        scen, warn = load_map(path, kit)
    except MapError as e:
        raise SystemExit("errore: %s" % e)
    for w in warn:
        print("avviso:", w)
    out = args[args.index("--out") + 1] if "--out" in args else os.path.join(OUT_DIR, scen["name"] + ".json")
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    with open(out, "w", encoding="utf-8", newline="\n") as f:
        json.dump(scen, f, ensure_ascii=False, separators=(",", ":"))
    counts = {}
    for i in scen["instances"]:
        counts[i["object"]] = counts.get(i["object"], 0) + 1
    print("%s: %dx%d, %d istanze (%s), %d avvisi -> %s"
          % (scen["name"], scen["width"], scen["height"], len(scen["instances"]),
             ", ".join("%s %d" % kv for kv in sorted(counts.items(), key=lambda kv: -kv[1])[:6]),
             len(warn), os.path.relpath(out, REPO_DIR)))
    if "--anteprima" in args:
        k = args.index("--anteprima")
        S = float(args[k + 1]) if k + 1 < len(args) and re.fullmatch(r"[\d.]+", args[k + 1]) else 0.125
        p = preview(scen, kit, S, os.path.join(PREVIEW_DIR, scen["name"] + ".png"))
        print("anteprima:", os.path.relpath(p, REPO_DIR))


if __name__ == "__main__":
    main()
