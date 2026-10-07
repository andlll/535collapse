"""Atlas per gruppo di sprite: ritaglio, scala, impacchettamento, WebP.

Lezione di NIMBUS (STUDIO.md §0.8): il budget di memoria texture si fissa
all'inizio. Qui ogni gruppo ha una scala e un tier di caricamento, e il tool
stampa la memoria GPU che occupera' (pagine x 2048 x 2048 x 4 byte), non
solo il peso su disco.

Gruppi (dalle cartelle di sprite dell'autore, data/sprites.json "folder"):

  gui       icone, segnalini, capocce, sprite alla radice   tier core
  campagna  mappa e segnaposti della campagna               tier menu
  terreno   natura con lato >= 512 px (montagne, fiumi, strade, tracce),
            pagine 4096 (montagna10 e' larga 2342 px)       tier gioco
  ambiente  il resto di natura, alberi, props, altro        tier gioco
  edifici   edifici e mura                                  tier gioco
  alleati   unita' romane (8 direzioni)                     tier gioco
  nemici    unita' barbare (cartelle b_*)                   tier gioco
  citta     citta' romana (lvl01/lvl02)                     tier citta

Nel gruppo gui anche i tre font bitmap rasterizzati da GameMaker (Seagram
tfb, STUDIO.md §2.5: foglio intero come pseudo-sprite "__font_<nome>", piu'
la tabella dei glifi in atlas.json "fonts"), "__white", un quadratino
bianco per rettangoli, cerchi e linee, e le forme delle particelle
("__pt_flare", "__pt_line", "__pt_pixel"): niente texture in piu' da legare.

Esclusi: sprite usati solo come maschera di collisione (nessun riferimento
come sprite di un oggetto ne' nel codice): servono solo a tools/06_masks.py.

Ogni frame e' ritagliato sull'alpha, ridimensionato alla scala del gruppo,
impacchettato (MaxRects, best short side fit) in pagine quadrate (2048,
4096 per il terreno; WebGL2 garantisce solo 2048, i PC desktop arrivano
almeno a 8192: il motore lo controlla all'avvio) con 2 px
di bordo ripetuto (niente sbavature col filtro lineare). Le pagine sono WebP
con perdita (q85) e alpha senza perdita (gui: tutto senza perdita): il motore le carica con alpha
premoltiplicato, cosi' l'RGB dei pixel trasparenti non conta.

Scrive (non versionato, si rigenera):
  game/assets/atlas/<gruppo>-<n>.webp
  game/assets/atlas.json   sprite -> origine, dimensioni originali, per ogni
                           frame: pagina, rettangolo nell'atlas, scostamento
                           del ritaglio, scala
  game/assets/bg/<nome>.webp   gli sfondi ripetuti (texture a parte, REPEAT)

Uso:  python3 tools/05_atlas.py [--png]   (--png: pagine anche in PNG per controllo)
"""
import glob
import json
import os
import re
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _paths import DATA_DIR, GMX_DIR, REPO_DIR, SRC_DIR, need  # noqa: E402

PAGE = 2048          # lato di pagina predefinito
PAD = 2
QUALITY = 85
OUT = os.path.join(REPO_DIR, "game", "assets")

ALLIES = {"guerriero", "picchiere", "arciere", "cavaliere", "omino", "catapulta", "ariete", "firegroup"}
# Il gruppo gui e' WebP senza perdita: icone e segni a bordi netti mostravano
# fino a 8,8/255 di errore medio con q85 (misurato, STUDIO.md §2.1).
LOSSLESS = {"gui"}
# Scala 1 ovunque: il terreno era proposto a 0,5 (33 MB invece di ~120), ma
# perdeva la grana della carta; l'autore ha scelto la piena risoluzione
# (STUDIO.md §2.1: "gira solo su PC, per 55 MB non muore nessuno").
PAGE_OF = {"terreno": 4096}
GROUPS = {  # nome: (tier, scala)
    "gui": ("core", 1.0), "campagna": ("menu", 1.0), "terreno": ("gioco", 1.0),
    "ambiente": ("gioco", 1.0), "edifici": ("gioco", 1.0), "alleati": ("gioco", 1.0),
    "nemici": ("gioco", 1.0), "citta": ("citta", 1.0),
}


def group_of(s):
    top = s["folder"].split("/")[0]
    if top in ("icone", "segnalini", "capocce", ""):
        return "gui"
    if top == "campagna":
        return "campagna"
    if top == "natura":
        return "terreno" if max(s["width"], s["height"]) >= 512 else "ambiente"
    if top in ("alberi", "props", "altro"):
        return "ambiente"
    if top == "edifici":
        return "edifici"
    if top == "cittaromana":
        return "citta"
    if top in ALLIES:
        return "alleati"
    if top.startswith("b_"):
        return "nemici"
    raise SystemExit("sprite %s in una cartella senza gruppo: %r" % (s["name"], s["folder"]))


def used_as_texture(sprites, objects):
    """Sprite che possono essere disegnati: sprite di un oggetto o nominati nel codice."""
    names = {s["name"] for s in sprites}
    used = {o["sprite"] for o in objects if o["sprite"]}
    for f in glob.glob(os.path.join(SRC_DIR, "**", "*.gml"), recursive=True):
        txt = re.sub(r"//[^\n]*", "", open(f, encoding="utf-8").read())
        used |= names & set(re.findall(r"[A-Za-z_]\w*", txt))
    return used & names


# ------------------------------------------------------------------ MaxRects

class Page:
    def __init__(self, size):
        self.free = [(0, 0, size, size)]

    def insert(self, w, h):
        best = None
        for fx, fy, fw, fh in self.free:
            if w <= fw and h <= fh:
                short, long_ = min(fw - w, fh - h), max(fw - w, fh - h)
                if best is None or (short, long_) < best[0]:
                    best = ((short, long_), fx, fy)
        if best is None:
            return None
        _, x, y = best
        self._split(x, y, w, h)
        return x, y

    def _split(self, x, y, w, h):
        out = []
        for fx, fy, fw, fh in self.free:
            if x >= fx + fw or x + w <= fx or y >= fy + fh or y + h <= fy:
                out.append((fx, fy, fw, fh))
                continue
            if x > fx:
                out.append((fx, fy, x - fx, fh))
            if x + w < fx + fw:
                out.append((x + w, fy, fx + fw - x - w, fh))
            if y > fy:
                out.append((fx, fy, fw, y - fy))
            if y + h < fy + fh:
                out.append((fx, y + h, fw, fy + fh - y - h))
        # togli i rettangoli contenuti in altri
        out = sorted(set(out), key=lambda r: -r[2] * r[3])
        keep = []
        for r in out:
            if not any(r[0] >= k[0] and r[1] >= k[1] and r[0] + r[2] <= k[0] + k[2]
                       and r[1] + r[3] <= k[1] + k[3] for k in keep):
                keep.append(r)
        self.free = keep


def extrude(img, pad):
    """Bordo di `pad` pixel ripetendo i pixel del contorno."""
    w, h = img.size
    out = Image.new("RGBA", (w + 2 * pad, h + 2 * pad))
    out.paste(img, (pad, pad))
    for i in range(pad):
        out.paste(img.crop((0, 0, w, 1)), (pad, i))
        out.paste(img.crop((0, h - 1, w, h)), (pad, pad + h + i))
    for i in range(pad):
        out.paste(out.crop((pad, 0, pad + 1, h + 2 * pad)), (i, 0))
        out.paste(out.crop((pad + w - 1, 0, pad + w, h + 2 * pad)), (pad + w + i, 0))
    return out


# Lettere accentate delle lingue della traduzione (IT, ES, PT, DE, FR):
# i font Seagram tfb rasterizzati da GameMaker hanno solo l'ASCII 32-127
# (STUDIO.md §2.5). Si compongono qui dalla lettera di base e da un segno
# preso dallo stesso font, cosi' restano gotiche: grave = "`", acuto = "`"
# specchiato, circonflesso = "^", tilde = "~" ridotta, dieresi = due "."
# (il punto ridotto), cedille = "," sotto la lettera; "i" senza puntino per
# i, I accentate; "¿" e "¡" sono "?" e "!" capovolti. Il segno sta sopra
# l'inchiostro della lettera (sopra l'altezza della x per le minuscole);
# se esce dalla riga in alto il glifo ha uno scostamento verticale negativo
# (settimo valore, letto da game/src/draw.js). Il resto (ß, œ, virgolette,
# trattini lunghi...) lo sostituisce il motore con lettere ASCII.
ACCENTS = {}
for _kind, _pairs in {
    "grave": "aà eè iì oò uù AÀ EÈ IÌ OÒ UÙ",
    "acute": "aá eé ií oó uú AÁ EÉ IÍ OÓ UÚ",
    "circ": "aâ eê iî oô uû AÂ EÊ IÎ OÔ UÛ",
    "tilde": "aã oõ nñ AÃ OÕ NÑ",
    "diaer": "aä eë iï oö uü yÿ AÄ EË IÏ OÖ UÜ",
    "cedil": "cç CÇ",
    "flip": "?¿ !¡",
}.items():
    for _p in _pairs.split():
        ACCENTS[_p[1]] = (_p[0], _kind)


def accented_glyphs(sheet, glyphs):
    """Restituisce (foglio allargato, {codice: [x, y, w, h, shift, offset, yoff]})."""
    by = {g["character"]: g for g in glyphs}

    def cell(ch):
        g = by[ord(ch)]
        return sheet.crop((g["x"], g["y"], g["x"] + g["w"], g["y"] + g["h"])), g

    def ink(im):
        return im.getchannel("A").point(lambda v: 255 if v > 40 else 0).getbbox()

    xh = ink(cell("x")[0])[1]  # cima della x: altezza delle minuscole
    marks = {}
    grave = cell("`")[0]
    grave = grave.crop(ink(grave))
    marks["grave"] = grave
    marks["acute"] = grave.transpose(Image.FLIP_LEFT_RIGHT)
    circ = cell("^")[0]
    marks["circ"] = circ.crop(ink(circ))
    dot = cell(".")[0]
    dot = dot.crop(ink(dot))
    tilde = cell("~")[0]
    tilde = tilde.crop(ink(tilde))
    comma = cell(",")[0]
    comma = comma.crop(ink(comma))

    out_imgs = []
    for ch, (base, kind) in ACCENTS.items():
        im, g = cell(base)
        im = im.copy()
        if base in "iI" and kind != "flip":
            # senza puntino: via l'inchiostro sopra l'altezza della x (i)
            if base == "i":
                px = im.load()
                for yy in range(min(xh - 1, im.height)):
                    for xx in range(im.width):
                        px[xx, yy] = (0, 0, 0, 0)
        bb = ink(im) or (0, 0, im.width, im.height)
        cx = (bb[0] + bb[2]) / 2
        if kind == "flip":
            body = im.crop(bb).rotate(180)
            im = Image.new("RGBA", im.size, (0, 0, 0, 0))
            im.paste(body, (bb[0], bb[1]))
            out_imgs.append((ch, im, g, 0))
            continue
        if kind == "cedil":
            m = comma.resize((max(1, comma.width * 3 // 4), max(1, comma.height * 3 // 4)), Image.LANCZOS)
            up = 0
            pad_b = max(0, bb[3] - 1 + m.height - im.height)
            canvas = Image.new("RGBA", (im.width, im.height + pad_b), (0, 0, 0, 0))
            canvas.paste(im, (0, 0))
            canvas.alpha_composite(m, (int(round(cx - m.width / 2)), bb[3] - 1))
            out_imgs.append((ch, canvas, g, 0))
            continue
        if kind == "diaer":
            d = dot.resize((max(1, dot.width * 3 // 4), max(1, dot.height * 3 // 4)), Image.LANCZOS)
            gap = max(1, d.width // 2 + 1)
            m = Image.new("RGBA", (2 * d.width + gap, d.height), (0, 0, 0, 0))
            m.paste(d, (0, 0))
            m.paste(d, (d.width + gap, 0))
        elif kind == "tilde":
            tw = max(3, int((bb[2] - bb[0]) * 0.8))
            m = tilde.resize((tw, max(2, round(tilde.height * tw / tilde.width))), Image.LANCZOS)
        else:
            m = marks[kind]
        top_ink = bb[1] if base.isupper() else min(bb[1], xh)
        my = top_ink - 1 - m.height
        up = max(0, -my)
        canvas = Image.new("RGBA", (im.width, im.height + up), (0, 0, 0, 0))
        canvas.paste(im, (0, up))
        canvas.alpha_composite(m, (max(0, min(im.width - m.width, int(round(cx - m.width / 2)))), my + up))
        out_imgs.append((ch, canvas, g, -up))

    # in una striscia sotto il foglio originale
    pad = 2
    row_h = max(im.height for _, im, _, _ in out_imgs) + pad
    per_row = max(1, sheet.width // (max(im.width for _, im, _, _ in out_imgs) + pad))
    rows = (len(out_imgs) + per_row - 1) // per_row
    big = Image.new("RGBA", (sheet.width, sheet.height + rows * row_h + pad), (0, 0, 0, 0))
    big.paste(sheet, (0, 0))
    extra = {}
    x, y = 0, sheet.height + pad
    for k, (ch, im, g, yoff) in enumerate(out_imgs):
        if x + im.width > sheet.width:
            x, y = 0, y + row_h
        big.paste(im, (x, y))
        extra[str(ord(ch))] = [x, y, im.width, im.height, g["shift"], g["offset"], yoff]
        x += im.width + pad
    return big, extra


def particle_shapes():
    """(nome, immagine ritagliata, [x, y, w, h] del ritaglio nella tela 64x64)."""
    import math
    out = []
    # flare: bagliore radiale con quattro raggi sottili
    fl = Image.new("RGBA", (64, 64), (255, 255, 255, 0))
    px = fl.load()
    for y in range(64):
        for x in range(64):
            dx, dy = (x + 0.5 - 32) / 32, (y + 0.5 - 32) / 32
            r = math.hypot(dx, dy)
            glow = max(0.0, 1 - r) ** 2.5
            ray = 0.0
            for along, perp in ((abs(dx), abs(dy)), (abs(dy), abs(dx))):
                ray = max(ray, math.exp(-perp * 32 / 1.2) * max(0.0, 1 - along) ** 2 * 0.7)
            px[x, y] = (255, 255, 255, round(255 * min(1.0, glow + ray)))
    out.append(("__pt_flare", fl, [0, 0, 64, 64]))
    # line: segmento orizzontale lungo tutta la tela, 5 px di spessore
    # sfumato, estremi che svaniscono negli ultimi 8 px
    ln = Image.new("RGBA", (64, 5), (255, 255, 255, 0))
    px = ln.load()
    prof = [0.25, 0.75, 1.0, 0.75, 0.25]
    for x in range(64):
        end = min(1.0, (min(x, 63 - x) + 0.5) / 8)
        for y in range(5):
            px[x, y] = (255, 255, 255, round(255 * prof[y] * end))
    out.append(("__pt_line", ln, [0, 30, 64, 5]))
    # pixel: un solo pixel al centro
    out.append(("__pt_pixel", Image.new("RGBA", (1, 1), (255, 255, 255, 255)), [32, 32, 1, 1]))
    # ring (pt_shape_ring): anello di raggio 27 px, spessore ~7 px sfumato
    # [richiesta dell'autore, §8.13: gli anelli della pioggia sul fiume]
    rg = Image.new("RGBA", (64, 64), (255, 255, 255, 0))
    px = rg.load()
    for y in range(64):
        for x in range(64):
            d = abs(math.hypot(x + 0.5 - 32, y + 0.5 - 32) - 27)
            px[x, y] = (255, 255, 255, round(255 * max(0.0, 1 - d / 3.6)))
    out.append(("__pt_ring", rg, [0, 0, 64, 64]))
    return out


def derived_sprites():
    """Sprite ricavati da quelli dell'autore [§8.16, richiesta dell'autore]:
    (nome, gruppo, immagine a tela intera, origine).

    campo_grano  il campo coltivato: campo_maggese (terra arata) ricolorato
                 color paglia; la luminosita' di ogni pixel resta (solchi,
                 grana e bordo scuro), il colore e' quello delle spighe.
                 Prende il posto di campo1 (le righe di verdure).
    spiga        part_crop a meta' risoluzione con un contorno scuro di 1 px
                 (a meta' risoluzione, cosi' a zoom 1 resta di 1-2 px a
                 schermo); i campi la disegnano a righe (effects.js).
    """
    from PIL import ImageFilter
    img = lambda n: Image.open(os.path.join(GMX_DIR, "sprites", "images", n + "_0.png")).convert("RGBA")
    out = []
    # campo_grano: luminanza relativa a quella media della terra arata
    # (174, 119, 65) per il colore paglia
    m = img("campo_maggese")
    ref, straw = 0.299 * 174 + 0.587 * 119 + 0.114 * 65, (214, 186, 112)
    px = m.load()
    for y in range(m.height):
        for x in range(m.width):
            r, g, b, a = px[x, y]
            if a:
                k = (0.299 * r + 0.587 * g + 0.114 * b) / ref
                px[x, y] = tuple(min(255, round(t * k)) for t in straw) + (a,)
    out.append(("campo_grano", "edifici", m, (150, 96)))
    # spiga: meta' risoluzione, 2 px di margine, contorno dove l'alpha della
    # spiga e' almeno 90 (i peli piu' tenui restano senza contorno)
    c = img("part_crop")
    s = c.resize((round(c.width / 2), round(c.height / 2)), Image.LANCZOS)
    pad = 2
    sp = Image.new("RGBA", (s.width + 2 * pad, s.height + 2 * pad), (0, 0, 0, 0))
    sp.alpha_composite(s, (pad, pad))
    solid = sp.getchannel("A").point(lambda v: 255 if v >= 90 else 0).filter(ImageFilter.MaxFilter(3))
    for name, col, oa in (("spiga", (28, 22, 12), 200), ("spiga_morbida", (92, 70, 30), 90)):
        ol = Image.new("RGBA", sp.size, col + (0,))
        ol.putalpha(solid.point(lambda v: oa if v else 0))
        ol.alpha_composite(sp)
        out.append((name, "ambiente", ol, (6 + pad, 37 + pad)))  # origine di part_crop (12, 73) / 2
    out.append(("spiga_nuda", "ambiente", sp, (6 + pad, 37 + pad)))
    return out


def main():
    need(os.path.join(DATA_DIR, "sprites.json"), "data/sprites.json (lancia 02_extract.py)")
    need(os.path.join(GMX_DIR, "sprites", "images"), "gmx/sprites/images (lancia 01_unpack.py)")
    sprites = json.load(open(os.path.join(DATA_DIR, "sprites.json"), encoding="utf-8"))
    objects = json.load(open(os.path.join(DATA_DIR, "objects.json"), encoding="utf-8"))
    used = used_as_texture(sprites, objects)
    os.makedirs(os.path.join(OUT, "atlas"), exist_ok=True)
    for old in glob.glob(os.path.join(OUT, "atlas", "*")):
        os.remove(old)

    # frame -> immagine ritagliata e scalata
    items = {g: [] for g in GROUPS}
    manifest = {"version": 1, "groups": {}, "sprites": {}, "excluded": []}
    for s in sprites:
        if s["name"] not in used:
            manifest["excluded"].append(s["name"])
            continue
        g = group_of(s)
        scale = GROUPS[g][1]
        entry = {"group": g, "width": s["width"], "height": s["height"],
                 "origin": [s["origin_x"], s["origin_y"]], "scale": scale, "frames": []}
        manifest["sprites"][s["name"]] = entry
        for i, fr in enumerate(s["frames"]):
            im = Image.open(os.path.join(GMX_DIR, "sprites", "images", fr)).convert("RGBA")
            bb = im.getchannel("A").getbbox()
            if bb is None:  # frame vuoto: niente da disegnare
                entry["frames"].append(None)
                continue
            crop = im.crop(bb)
            if scale != 1.0:
                crop = crop.resize((max(1, round(crop.width * scale)), max(1, round(crop.height * scale))),
                                   Image.LANCZOS)
            entry["frames"].append({"trim": [bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]]})
            items[g].append((s["name"], i, crop))
    for name, g, im, (ox, oy) in derived_sprites():
        bb = im.getchannel("A").getbbox()
        manifest["sprites"][name] = {"group": g, "width": im.width, "height": im.height, "origin": [ox, oy],
                                     "scale": 1.0, "frames": [{"trim": [bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]]}]}
        items[g].append((name, 0, im.crop(bb)))

    # font e pixel bianco nel gruppo gui (non ritagliati: le coordinate dei
    # glifi restano quelle del foglio di GameMaker)
    manifest["fonts"] = {}
    for fnt in json.load(open(os.path.join(DATA_DIR, "fonts.json"), encoding="utf-8")):
        sheet = Image.open(os.path.join(GMX_DIR, "fonts", fnt["image"])).convert("RGBA")
        sheet, extra = accented_glyphs(sheet, fnt["glyphs"])
        name = "__font_" + fnt["name"]
        manifest["sprites"][name] = {"group": "gui", "width": sheet.width, "height": sheet.height,
                                     "origin": [0, 0], "scale": 1.0,
                                     "frames": [{"trim": [0, 0, sheet.width, sheet.height]}]}
        items["gui"].append((name, 0, sheet))
        manifest["fonts"][fnt["name"]] = {
            "sprite": name, "family": fnt["family"], "size": fnt["size"],
            "height": max(g["h"] for g in fnt["glyphs"]),
            "glyphs": {**{str(g["character"]): [g["x"], g["y"], g["w"], g["h"], g["shift"], g["offset"]]
                          for g in fnt["glyphs"]}, **extra}}
    manifest["sprites"]["__white"] = {"group": "gui", "width": 8, "height": 8, "origin": [0, 0],
                                      "scale": 1.0, "frames": [{"trim": [0, 0, 8, 8]}]}
    items["gui"].append(("__white", 0, Image.new("RGBA", (8, 8), (255, 255, 255, 255))))
    # forme interne delle particelle di GameMaker (pt_shape_flare, line,
    # pixel): texture 64x64 di GMS ricreate a mano, bianche con l'alpha
    # [I: l'aspetto esatto va confrontato con uno screenshot dell'originale]
    for name, crop, trim in particle_shapes():
        manifest["sprites"][name] = {"group": "gui", "width": 64, "height": 64, "origin": [32, 32],
                                     "scale": 1.0, "frames": [{"trim": trim}]}
        items["gui"].append((name, 0, crop))

    total_gpu = total_disk = 0
    print("%-9s %-6s %5s %6s %7s %9s %8s" % ("gruppo", "tier", "scala", "frame", "pagine", "GPU MB", "WebP MB"))
    for g, lst in items.items():
        size = PAGE_OF.get(g, PAGE)
        lst.sort(key=lambda t: -max(t[2].size))
        pages, images = [], []
        for name, i, crop in lst:
            w, h = crop.width + 2 * PAD, crop.height + 2 * PAD
            if w > size or h > size:
                raise SystemExit("%s_%d non entra in una pagina %d (%dx%d)" % (name, i, size, w, h))
            for pi, p in enumerate(pages):
                pos = p.insert(w, h)
                if pos:
                    break
            else:
                pages.append(Page(size))
                images.append(Image.new("RGBA", (size, size)))
                pi, pos = len(pages) - 1, pages[-1].insert(w, h)
            images[pi].paste(extrude(crop, PAD), pos)
            manifest["sprites"][name]["frames"][i].update(
                {"page": pi, "rect": [pos[0] + PAD, pos[1] + PAD, crop.width, crop.height]})
        files, disk = [], 0
        for pi, img in enumerate(images):
            # pagina finale: ritaglia lo spazio vuoto in basso/a destra (meno memoria)
            bb = img.getchannel("A").getbbox() or (0, 0, 1, 1)
            w = min(size, (bb[2] + PAD + 3) // 4 * 4)
            h = min(size, (bb[3] + PAD + 3) // 4 * 4)
            img = img.crop((0, 0, w, h))
            fn = "%s-%d.webp" % (g, pi)
            if g in LOSSLESS:
                img.save(os.path.join(OUT, "atlas", fn), "WEBP", lossless=True, quality=100, method=6)
            else:
                img.save(os.path.join(OUT, "atlas", fn), "WEBP", quality=QUALITY, method=6, alpha_quality=100)
            if "--png" in sys.argv:
                img.save(os.path.join(OUT, "atlas", fn[:-5] + ".png"))
            disk += os.path.getsize(os.path.join(OUT, "atlas", fn))
            files.append({"file": "atlas/" + fn, "width": w, "height": h})
        gpu = sum(f["width"] * f["height"] * 4 for f in files)
        manifest["groups"][g] = {"tier": GROUPS[g][0], "scale": GROUPS[g][1], "page_size": size, "pages": files,
                                 "gpu_bytes": gpu, "disk_bytes": disk}
        total_gpu += gpu
        total_disk += disk
        print("%-9s %-6s %5.2f %6d %7d %9.1f %8.1f" % (g, GROUPS[g][0], GROUPS[g][1], len(lst), len(files),
                                                       gpu / 1e6, disk / 1e6))
    print("%-9s %28s %9.1f %8.1f" % ("totale", "", total_gpu / 1e6, total_disk / 1e6))

    # sfondi ripetuti: texture a parte
    os.makedirs(os.path.join(OUT, "bg"), exist_ok=True)
    manifest["backgrounds"] = {}
    for b in json.load(open(os.path.join(DATA_DIR, "backgrounds.json"), encoding="utf-8")):
        im = Image.open(os.path.join(GMX_DIR, "background", "images", b["image"])).convert("RGBA")
        im.save(os.path.join(OUT, "bg", b["name"] + ".webp"), "WEBP", quality=QUALITY, method=6)
        manifest["backgrounds"][b["name"]] = {"file": "bg/%s.webp" % b["name"],
                                              "width": im.width, "height": im.height}
    with open(os.path.join(OUT, "atlas.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(manifest, f, separators=(",", ":"))
    print("esclusi (solo maschera o mai usati): %d" % len(manifest["excluded"]))


if __name__ == "__main__":
    main()
