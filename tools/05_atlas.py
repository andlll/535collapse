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
