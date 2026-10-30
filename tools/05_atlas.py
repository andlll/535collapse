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

Nel gruppo gui anche i tre font del gioco (§9.47: Cinzel e Cinzel
Decorative, rasterizzati qui dai TTF di nuovi/font/; foglio intero come
pseudo-sprite "__font_<nome>", piu' la tabella dei glifi in atlas.json
"fonts"), "__white", un quadratino
bianco per rettangoli, cerchi e linee, e le forme delle particelle
("__pt_flare", "__pt_line", "__pt_pixel", "__pt_ring", "__pt_star"): niente
texture in piu' da legare.

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
import colorsys
import glob
import json
import os
import re
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _paths import DATA_DIR, GMX_DIR, REPO_DIR, SRC_DIR, need  # noqa: E402
import nuovi  # noqa: E402

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


# [§9.47, decisione dell'autore] I font dell'interfaccia non sono piu' i
# Seagram tfb di GameMaker (gotici: anacronistici per il 535) ma Cinzel
# (capitale romana) e, per i titoli, Cinzel Decorative Bold: TTF liberi
# (OFL) in nuovi/font/, rasterizzati qui nello stesso formato dei glifi di
# GameMaker, con le lettere accentate e i segni delle traduzioni veri (prima
# composti dalla lettera e da un segno del font: solo ASCII in GameMaker).
# Restano i nomi dei tre font del gioco e la loro altezza di riga; px e' la
# dimensione (a parita' di frase, ~12% piu' larga del Seagram: le schede si
# allargano da sole, draw.js panelExtra), peso quello dell'asse wght.
FONT_DIR = os.path.join(REPO_DIR, "nuovi", "font")
FONT_TTF = {
    "GUI_1": ("Cinzel[wght].ttf", 700, 19),
    "overdue": ("Cinzel[wght].ttf", 500, 18),
    "gui_sblocco": ("CinzelDecorative-Bold.ttf", None, 36),
}
FONT_CHARS = ([chr(c) for c in range(32, 127)]
              + list("àèìòùÀÈÌÒÙáéíóúÁÉÍÓÚâêîôûÂÊÎÔÛãõñÃÕÑäëïöüÿÄËÏÖÜçÇ¿¡ßœŒæÆ’‘“”«»–—…"))


def ttf_font(path, weight, px):
    from PIL import ImageFont
    f = ImageFont.truetype(os.path.join(FONT_DIR, path), px)
    if weight:
        f.set_variation_by_axes([weight])
    return f


def ttf_glyphs(fnt, gm_sheet):
    """(foglio, {codice: [x, y, w, h, shift, offset, yoff]}) del font del
    gioco fnt col suo TTF (FONT_TTF). Le maiuscole hanno il centro dove lo
    avevano nel Seagram (la "H" del foglio di GameMaker): i testi restano
    centrati nei pulsanti e nelle schede come prima. Gli accenti delle
    maiuscole che escono dalla riga in alto: scostamento verticale negativo
    (yoff, letto da game/src/draw.js)."""
    from PIL import ImageDraw
    path, weight, px = FONT_TTF[fnt["name"]]
    f = ttf_font(path, weight, px)
    gH = next(g for g in fnt["glyphs"] if g["character"] == ord("H"))
    hb = gm_sheet.crop((gH["x"], gH["y"], gH["x"] + gH["w"], gH["y"] + gH["h"])).getchannel("A").getbbox()
    cap = -f.getbbox("H", anchor="ls")[1]
    base = round((hb[1] + hb[3]) / 2 + cap / 2)
    top = max(0, max(-(base + f.getbbox(ch, anchor="ls")[1]) for ch in FONT_CHARS if ch != " "))
    base += top
    cellh = base + f.getmetrics()[1] + 2
    cells, width, x, y = [], 1024, 0, 0
    for ch in FONT_CHARS:
        bb = f.getbbox(ch, anchor="ls")
        adv = round(f.getlength(ch))
        if ch == " " or bb[2] <= bb[0]:
            cells.append((ch, None, 0, 0, adv, 0))
            continue
        w = bb[2] - bb[0] + 2
        im = Image.new("RGBA", (w, cellh), (255, 255, 255, 0))
        ImageDraw.Draw(im).text((1 - bb[0], base), ch, font=f, fill=(255, 255, 255, 255), anchor="ls")
        if x + w + 2 > width:
            x, y = 0, y + cellh + 2
        cells.append((ch, im, x, y, adv, bb[0] - 1))
        x += w + 2
    sheet = Image.new("RGBA", (width, y + cellh + 2), (255, 255, 255, 0))
    glyphs = {}
    for ch, im, gx, gy, adv, off in cells:
        if im is None:
            glyphs[str(ord(ch))] = [0, 0, 0, 0, adv, 0, 0]
            continue
        sheet.paste(im, (gx, gy))
        glyphs[str(ord(ch))] = [gx, gy, im.width, im.height, adv, off, -top]
    return sheet, glyphs


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
    # star [§9.94, richiesta dell'autore: le scintille delle miniere]: stella
    # a quattro punte affilate (raggi che si assottigliano fino alla cima),
    # quattro raggi diagonali piu' corti e deboli, un nucleo luminoso
    st = Image.new("RGBA", (64, 64), (255, 255, 255, 0))
    px = st.load()
    for y in range(64):
        for x in range(64):
            dx, dy = (x + 0.5 - 32) / 32, (y + 0.5 - 32) / 32
            r = math.hypot(dx, dy)
            v = max(0.0, 1 - r / 0.22) ** 1.5
            for along, perp, long, k in ((abs(dx), abs(dy), 1.0, 1.0), (abs(dy), abs(dx), 1.0, 1.0),
                                         (abs(dx + dy) / 1.4142, abs(dx - dy) / 1.4142, 0.45, 0.5),
                                         (abs(dx - dy) / 1.4142, abs(dx + dy) / 1.4142, 0.45, 0.5)):
                width = 0.07 * max(0.0, 1 - along / long)  # meta' larghezza, a zero sulla punta
                if width > 0:
                    v = max(v, k * max(0.0, 1 - perp / width) * (1 - along / long) ** 0.6)
            px[x, y] = (255, 255, 255, round(255 * min(1.0, v)))
    out.append(("__pt_star", st, [0, 0, 64, 64]))
    return out


def derived_sprites():
    """Sprite ricavati da quelli dell'autore [§8.16, richiesta dell'autore]:
    (nome, gruppo, immagine a tela intera, origine).

    campo_grano  il campo coltivato: campo_maggese (terra arata) ricolorato
                 color paglia scuro; la luminosita' di ogni pixel resta
                 (solchi, grana e bordo scuro). Piu' scuro delle spighe, che
                 si staccano per tono.
                 Prende il posto di campo1 (le righe di verdure).
    spiga        part_crop a meta' risoluzione (senza contorno: provati un
                 contorno nero e uno morbido, §8.16); i campi la
                 disegnano a righe (effects.js).
    erba_chiara  part_erba in grigio chiaro, da colorare con la
                 particella (le macchie d'erba, §8.18).
    <mura>_b     [§9.75] mura e porte nemiche: le bandierine rosse delle
                 mura del giocatore (m_ori, m_vert, porte aperte e chiuse)
                 azzurre come le bandiere nemiche (tint_flags). [§9.85] Lo
                 stesso per i loro stadi di danno (<mura>_b_r1, _r2), nel
                 ciclo degli sprite nuovi.
    """
    img = lambda n: Image.open(os.path.join(GMX_DIR, "sprites", "images", n + "_0.png")).convert("RGBA")
    out = []
    # campo_grano: luminanza relativa a quella media della terra arata
    # (174, 119, 65) per il colore paglia
    m = img("campo_maggese")
    ref, straw = 0.299 * 174 + 0.587 * 119 + 0.114 * 65, (165, 126, 66)
    px = m.load()
    for y in range(m.height):
        for x in range(m.width):
            r, g, b, a = px[x, y]
            if a:
                k = (0.299 * r + 0.587 * g + 0.114 * b) / ref
                px[x, y] = tuple(min(255, round(t * k)) for t in straw) + (a,)
    out.append(("campo_grano", "edifici", m, (150, 96)))
    # spiga: meta' risoluzione, 2 px di margine, senza contorno
    c = img("part_crop")
    s = c.resize((round(c.width / 2), round(c.height / 2)), Image.LANCZOS)
    pad = 2
    sp = Image.new("RGBA", (s.width + 2 * pad, s.height + 2 * pad), (0, 0, 0, 0))
    sp.alpha_composite(s, (pad, pad))
    out.append(("spiga", "ambiente", sp, (6 + pad, 37 + pad)))  # origine di part_crop (12, 73) / 2
    # erba_chiara: part_erba (verde scuro, media (76, 94, 56)) in grigio
    # chiaro, stessa grana e stesso alpha; il colore lo da' la particella
    # (una tinta moltiplicativa puo' solo scurire: sul verde scuro i verdi
    # chiari e gialli non si ottenevano)
    e = img("part_erba")
    px = e.load()
    for y in range(e.height):
        for x in range(e.width):
            r, g, b, a = px[x, y]
            if a:
                v = min(255, round((0.299 * r + 0.587 * g + 0.114 * b) / 86 * 225))
                px[x, y] = (v, v, v, a)
    meta = next(d for d in json.load(open(os.path.join(DATA_DIR, "sprites.json"), encoding="utf-8"))
                if d["name"] == "part_erba")
    out.append(("erba_chiara", "ambiente", e, (meta["origin_x"], meta["origin_y"])))
    meta = {d["name"]: d for d in json.load(open(os.path.join(DATA_DIR, "sprites.json"), encoding="utf-8"))}
    for n in WALLS_B:
        out.append((n + "_b", "edifici", tint_flags(img(n)), (meta[n]["origin_x"], meta[n]["origin_y"])))
    # [§9.37] i fiori delle macchie fiorite (nuovi/particelle/, disegnati al
    # doppio): meta' risoluzione, origine al piede dello stelo (in basso al
    # centro), 2 px di margine
    for name, f in FIORI.items():
        im = Image.open(os.path.join(REPO_DIR, "nuovi", "particelle", f + ".png")).convert("RGBA")
        s = im.resize((round(im.width / 2), round(im.height / 2)), Image.LANCZOS)
        fi = Image.new("RGBA", (s.width + 2 * pad, s.height + 2 * pad), (0, 0, 0, 0))
        fi.alpha_composite(s, (pad, pad))
        out.append((name, "ambiente", fi, (fi.width // 2, pad + s.height - 1)))
    return out


# [§9.75] gli sprite delle mura e delle porte del giocatore che hanno una
# versione nemica (<nome>_b)
WALLS_B = ["m_ori", "m_vert", "m_ori_p", "m_ori_pa", "m_vert_p", "m_vert_pa"]


def tint_flags(im, shift=191, hue_max=40, sat_min=0.3):
    """[§9.75] Le bandierine rosso-arancio (tinta fino a hue_max gradi, o da
    345, saturazione almeno sat_min: la pietra e' poco satura) ruotate di
    `shift` gradi, saturazione e luminosita' uguali: la bandiera nemica
    bflag e' la rflag del giocatore cosi' (tinta media 15 -> 206)."""
    im = im.copy()
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if not a:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if s >= sat_min and (h * 360 <= hue_max or h * 360 >= 345):
                r, g, b = colorsys.hsv_to_rgb((h + shift / 360) % 1, s, v)
                px[x, y] = (round(r * 255), round(g * 255), round(b * 255), a)
    return im


FIORI = {"fiore_giallo1": "fiore1_part2x", "fiore_giallo2": "fiore2_part2x",
         "papavero1": "papavero_part_2x", "papavero2": "papavero_part2_2x"}


def main():
    need(os.path.join(DATA_DIR, "sprites.json"), "data/sprites.json (lancia 02_extract.py)")
    need(os.path.join(GMX_DIR, "sprites", "images"), "gmx/sprites/images (lancia 01_unpack.py)")
    sprites = json.load(open(os.path.join(DATA_DIR, "sprites.json"), encoding="utf-8"))
    objects = json.load(open(os.path.join(DATA_DIR, "objects.json"), encoding="utf-8"))
    used = used_as_texture(sprites, objects)
    # [§9.43] anche gli sprite del progetto che usano gli oggetti nuovi
    # (nuovi.json: gli edifici nemici con gli sprite *_b mai usati)
    used |= {o["sprite"] for o in nuovi.load()["objects"].values() if o.get("sprite")} & {s["name"] for s in sprites}
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
    # [§9.10] sprite nuovi dell'autore (nuovi/) e le loro fette, nel gruppo
    # edifici (caricato in ogni livello)
    # [§9.40] nel gruppo "gruppo" se c'e'; gli sprite a pezzi (il fiume del
    # livello 4, piu' grande di una pagina) solo coi pezzi: lo sprite intero
    # resta nel manifest senza immagine (origine, misura: le maschere e il
    # fiume lo usano), come gli sprite vuoti (Ponte_1, tutto uguale al fiume)
    extra = []
    nsprites, nraw = nuovi.sprites(), nuovi.load()["sprites"]
    for name, d in nsprites.items():
        im, g = d["image"], d["gruppo"]
        if im is None:  # solo maschera (Ponte_varco)
            continue
        if d["pezzi"] or not im.getchannel("A").getbbox():
            manifest["sprites"][name] = {"group": g, "width": im.width, "height": im.height,
                                         "origin": list(d["origin"]), "scale": 1.0, "frames": [None]}
        elif len(d["frames"]) > 1:  # [§9.48] a piu' fotogrammi (il mulino nemico)
            fr = []
            for k, f in enumerate(d["frames"]):
                bb = f.getchannel("A").getbbox()
                fr.append({"trim": [bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]]})
                items[g].append((name, k, f.crop(bb)))
            manifest["sprites"][name] = {"group": g, "width": im.width, "height": im.height,
                                         "origin": list(d["origin"]), "scale": 1.0, "frames": fr}
        else:
            extra.append((name, g, im, tuple(d["origin"])))
        for k, (x0, x1, _) in enumerate(d["fette"]):
            extra.append((name + nuovi.SLICE_SEP + str(k), g, nuovi.slice_image(im, x0, x1), tuple(d["origin"])))
        for k, box in enumerate(d["pezzi"]):
            extra.append((name + nuovi.SLICE_SEP + str(k), g, nuovi.tile_image(im, box), tuple(d["origin"])))
    # [§9.85] i danni delle mura e delle porte nemiche: quelli del giocatore
    # (sprite nuovi "su" m_ori, m_vert, ...) con le bandierine azzurre, come
    # le mura nemiche intere (<mura>_b): m_ori_r1 -> m_ori_b_r1
    for name, d in nsprites.items():
        su = nraw.get(name, {}).get("su")
        if su in WALLS_B:
            extra.append((su + "_b" + name[len(su):], d["gruppo"], tint_flags(d["image"]), tuple(d["origin"])))
    extra += nuovi.derived()  # [§9.13] segnalini e simili ricavati dagli sprite nuovi
    for name, g, im, (ox, oy) in derived_sprites() + extra:
        bb = im.getchannel("A").getbbox()
        if bb is None:  # [§9.40] una fetta vuota (la balaustra del ponte e' piu' corta dello sprite)
            manifest["sprites"][name] = {"group": g, "width": im.width, "height": im.height, "origin": [ox, oy],
                                         "scale": 1.0, "frames": [None]}
            continue
        manifest["sprites"][name] = {"group": g, "width": im.width, "height": im.height, "origin": [ox, oy],
                                     "scale": 1.0, "frames": [{"trim": [bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]]}]}
        items[g].append((name, 0, im.crop(bb)))
        if nraw.get(name, {}).get("griglia"):  # [§9.86] l'alpha delle ombre delle nuvole, per shadeAt
            manifest["sprites"][name]["alpha"] = nuovi.alpha_grid(im, nraw[name]["griglia"])

    # font e pixel bianco nel gruppo gui (non ritagliati: le coordinate dei
    # glifi restano quelle del foglio di GameMaker)
    manifest["fonts"] = {}
    for fnt in json.load(open(os.path.join(DATA_DIR, "fonts.json"), encoding="utf-8")):
        gm = Image.open(os.path.join(GMX_DIR, "fonts", fnt["image"])).convert("RGBA")
        sheet, glyphs = ttf_glyphs(fnt, gm)  # §9.47
        name = "__font_" + fnt["name"]
        manifest["sprites"][name] = {"group": "gui", "width": sheet.width, "height": sheet.height,
                                     "origin": [0, 0], "scale": 1.0,
                                     "frames": [{"trim": [0, 0, sheet.width, sheet.height]}]}
        items["gui"].append((name, 0, sheet))
        manifest["fonts"][fnt["name"]] = {
            "sprite": name, "family": FONT_TTF[fnt["name"]][0], "size": FONT_TTF[fnt["name"]][2],
            "height": max(g["h"] for g in fnt["glyphs"]),
            "glyphs": glyphs}
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
