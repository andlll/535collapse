"""Mappe della schermaglia (STUDIO.md §9.118): simmetriche per rotazione.

[Decisione dell'autore] Le mappe della schermaglia 1 contro 1 le imposta il
porting, dalle indicazioni generali dell'autore, in modo che siano
matematicamente simmetriche: ogni elemento ha il suo gemello ruotato di 180
gradi attorno al centro della mappa (le basi in angoli opposti). Non conta
che le immagini siano simmetriche (gli sprite isometrici non si ruotano):
conta la posizione rispetto al nemico. Per questo si ruota il centro della
MASCHERA di collisione di ogni oggetto, non l'origine dello sprite:
l'ingombro in gioco del gemello e' esattamente quello ruotato.

Si descrive mezza mappa (la parte della base A, in alto a sinistra) e lo
script aggiunge i gemelli:
- oggetti (edifici, risorse, alberi): il gemello nella posizione ruotata;
- fiumi: la meta' dal bordo al centro della mappa, poi la stessa ruotata;
- ponti e strade: il gemello ruotato (un ponte al centro e' gia' simmetrico).
Le due basi sono due centri (`centro`): il gioco, all'avvio, fa nemico
quello della CPU (game/src/skirmish.js) secondo la partenza scelta.

Scrive mappe/sk_<nome>.tmx (col kit di tools/11, per aprirla in Tiled);
lo scenario si fa poi come per gli altri livelli:
  python3 tools/16_schermaglia.py              # tutte le mappe
  python3 tools/12_tiled_import.py mappe/sk_padus.tmx
Controllo (anche nella CI): python3 tools/16_schermaglia.py --check
  ogni istanza dello scenario (scenari/sk_*.json, tranne la regia) ha il
  gemello ruotato (centro della maschera entro 1 px, stesso oggetto), e
  fiumi, ponti e strade sono simmetrici; e il .tmx e' quello che lo script
  scriverebbe adesso.
"""
import importlib.util
import json
import math
import os
import random
import sys
import xml.etree.ElementTree as ET

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _paths import DATA_DIR, REPO_DIR  # noqa: E402
import tiledkit as tk  # noqa: E402

MAPS_DIR = os.path.join(REPO_DIR, "mappe")
SCEN_DIR = os.path.join(REPO_DIR, "scenari")
MASKS = os.path.join(REPO_DIR, "game", "assets", "masks.json")
REGIA = {"manager"}
# [§9.122] le decorazioni (non solide, non contano per lo spazio libero) e
# il raggio d'ingombro degli oggetti solidi (free)
DECOR_OBJ = {"burst_erba1", "burst_grano1", "chiazzaparticellare", "fiori_papaveri", "fiori_papaveri_erba",
             "fiori_gialli_erba", "fiori_prato", "erba_1", "prato1", "fiorame1", "traccia01", "traccia02",
             "traccia03", "traccia04", "graa11", "graa12", "graa13", "graa14", "graa15"}
SOLID_R = {"centro": 330, "miniera_oro": 120, "pietr_piccolo": 110, "pietra_grande": 130, "albero": 40}


def kit11():
    spec = importlib.util.spec_from_file_location("kit11", os.path.join(os.path.dirname(__file__), "11_tiled_kit.py"))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def mask_offsets():
    """oggetto -> (dx, dy): dal punto d'origine dell'istanza al centro della
    sua maschera (la maschera e' quella dell'oggetto, o il suo sprite)."""
    objs = {o["name"]: o for o in json.load(open(os.path.join(DATA_DIR, "objects.json"), encoding="utf-8"))}
    masks = json.load(open(MASKS, encoding="utf-8"))["sprites"]
    out = {}
    for name, o in objs.items():
        m = masks.get(o.get("mask") or o.get("sprite") or "")
        if not m:
            continue
        b, (ox, oy) = m["bbox"], m["origin"]
        out[name] = ((b[0] + b[2] + 1) / 2 - ox, (b[1] + b[3] + 1) / 2 - oy)
    return out


class HalfMap:
    """Mezza mappa e i suoi gemelli."""

    def __init__(self, name, w, h, bg="green1", seed=1):
        self.name, self.w, self.h, self.bg = name, w, h, bg
        self.cx, self.cy = w / 2, h / 2
        self.rng = random.Random(seed)
        self.objs, self.rivers, self.bridges, self.roads = [], [], [], []
        self.painted = []  # [§9.122] ponti dipinti dall'autore: (nome, x, y)
        self.off = mask_offsets()

    def rot(self, x, y):
        return self.w - x, self.h - y

    # ---------------------------------------------------- mezza mappa
    def obj(self, name, x, y, sprite=None):
        self.objs.append((name, x, y, sprite))

    def forest(self, cx, cy, rx, ry, spacing=95, keep=None):
        """Alberi su una griglia sfalsata dentro l'ellisse, con un po' di caso."""
        n = 0
        y = cy - ry
        row = 0
        while y <= cy + ry:
            x = cx - rx + (spacing / 2 if row % 2 else 0)
            while x <= cx + rx:
                px = x + self.rng.uniform(-spacing * 0.3, spacing * 0.3)
                py = y + self.rng.uniform(-spacing * 0.25, spacing * 0.25)
                if ((px - cx) / rx) ** 2 + ((py - cy) / ry) ** 2 <= 1 and (keep is None or keep(px, py)):
                    self.obj("albero", round(px), round(py))
                    n += 1
                x += spacing
            y += spacing * 0.6
            row += 1
        return n

    def river(self, half, width=150):
        """half: dal bordo della mappa fino al centro (l'ultimo punto)."""
        assert tuple(half[-1]) == (self.cx, self.cy), "la meta' del fiume finisce al centro"
        self.rivers.append((half, width))

    def bridge(self, x, y, angle, length=300, width=110):
        """Un ponte (rettangolo) centrato in (x, y), lungo `length` nella
        direzione `angle` (gradi, a schermo: y in basso)."""
        self.bridges.append((x, y, angle, length, width))

    def painted_bridge(self, name, x, y):
        """[§9.122] Un ponte dipinto dall'autore (tk.PAINTED_BRIDGES: pontedx,
        pontedx2; "specchiato" nel nome lo specchia), (x, y) al centro del
        piano. Il gemello e' lo stesso ponte nel punto ruotato: l'immagine non
        si ruota, il piano percorribile cade nello stesso punto del fiume."""
        self.painted.append((name, x, y))

    def free(self, x, y, r, lines=120):
        """(x, y) lontano r px dagli oggetti solidi gia' messi (e dai loro
        gemelli) e lines px da fiumi e strade?"""
        for name, ox, oy, _ in self.objs:
            if name in DECOR_OBJ:
                continue
            for px, py in ((ox, oy), self.rot(ox, oy)):
                if math.hypot(px - x, py - y) < r + SOLID_R.get(name, 60):
                    return False
        return not self.near_lines(x, y, lines)

    def scatter(self, name, n, box, r, lines=120, sprite=None, tries=400):
        """n oggetti `name` a caso nel rettangolo box (x0, y0, x1, y1) della
        mezza mappa, liberi (free); restituisce quanti ne ha messi."""
        x0, y0, x1, y1 = box
        k = 0
        for _ in range(tries):
            if k >= n:
                break
            x, y = round(self.rng.uniform(x0, x1)), round(self.rng.uniform(y0, y1))
            if not self.half(x, y) or not self.free(x, y, r, lines):
                continue
            self.obj(name, x, y, sprite)
            k += 1
        return k

    def half(self, x, y):
        """Il punto e' nella meta' della base A (sopra la diagonale che va
        dall'angolo in basso a sinistra a quello in alto a destra)? Cosi' un
        oggetto e il suo gemello non si sovrappongono."""
        return (x - self.cx) + (y - self.cy) < -150

    def road(self, pts, kind="strada1", width=None):
        self.roads.append((pts, kind, width))

    # ------------------------------------------------------- gemelli
    def full(self):
        objs = []
        for name, x, y, spr in self.objs:
            objs.append((name, x, y, spr))
            dx, dy = self.off.get(name, (0, 0))
            tx, ty = self.rot(x + dx, y + dy)
            objs.append((name, round(tx - dx, 3), round(ty - dy, 3), spr))
        rivers = []
        for half, wdt in self.rivers:
            twin = [self.rot(*p) for p in reversed(half[:-1])]
            rivers.append(([tuple(p) for p in half] + twin, wdt))
        bridges = []
        for b in self.bridges:
            x, y, a, L, W = b
            bridges.append(b)
            if (x, y) != (self.cx, self.cy):
                tx, ty = self.rot(x, y)
                bridges.append((tx, ty, a + 180, L, W))
        roads = []
        for pts, kind, wdt in self.roads:
            roads.append((pts, kind, wdt))
            roads.append(([self.rot(*p) for p in pts], kind, wdt))
        return objs, rivers, bridges, roads

    def full_painted(self):
        out = []
        for name, x, y in self.painted:
            out.append((name, x, y))
            if (x, y) != (self.cx, self.cy):
                out.append((name, *self.rot(x, y)))
        return out

    def near_lines(self, x, y, margin):
        """(x, y) vicino a un fiume o a una strada della mappa intera?"""
        _, rivers, _, roads = self.full()
        lines = [(pts, wdt or 150) for pts, wdt in rivers] + [(pts, wdt or tk.ROAD_WIDTH) for pts, _, wdt in roads]
        for pts, wdt in lines:
            for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
                vx, vy = x1 - x0, y1 - y0
                L2 = vx * vx + vy * vy or 1
                t = max(0, min(1, ((x - x0) * vx + (y - y0) * vy) / L2))
                if math.hypot(x - (x0 + t * vx), y - (y0 + t * vy)) < wdt / 2 + margin:
                    return True
        return False

    # ------------------------------------------------------ scrittura
    def write(self, path):
        K = kit11()
        manifest = tk.load_manifest()
        mw = K.MapWriter(manifest, self.w, self.h, self.bg)
        objs, rivers, bridges, roads = self.full()
        mw.add("regia", "manager", 100, 100)
        for name, x, y, spr in objs:
            mw.add("oggetti", name, x, y, sprite=spr)
        mw.add_view(0, 0, 3000, 2000)
        mw.write(path)
        # fiumi, ponti e strade (MapWriter scrive solo tile e vista)
        root = ET.parse(path).getroot()
        layer = {g.get("name"): g for g in root.findall("objectgroup")}
        nid = int(root.get("nextobjectid"))

        def line(g, cls, pts, props):
            nonlocal nid
            x0, y0 = pts[0]
            o = ET.SubElement(g, "object", {"id": str(nid), "type": cls, "x": tk.num(x0), "y": tk.num(y0)})
            nid += 1
            if props:
                pe = ET.SubElement(o, "properties")
                for k, v in props.items():
                    ET.SubElement(pe, "property", {"name": k, "type": "float", "value": tk.num(v)})
            ET.SubElement(o, "polyline", {"points": " ".join("%s,%s" % (tk.num(x - x0), tk.num(y - y0)) for x, y in pts)})

        for pts, wdt in rivers:
            line(layer[tk.RIVER_LAYER], "fiume", pts, {"larghezza": wdt})
        for pts, kind, wdt in roads:
            line(layer[tk.ROAD_LAYER], kind, pts, {"larghezza": wdt} if wdt else {})
        for name, x, y in self.full_painted():
            o = ET.SubElement(layer[tk.RIVER_LAYER], "object", {"id": str(nid), "name": name, "x": tk.num(x), "y": tk.num(y)})
            ET.SubElement(o, "point")
            nid += 1
        for x, y, a, L, W in bridges:
            t = math.radians(a)
            ux, uy, vx, vy = math.cos(t), math.sin(t), -math.sin(t), math.cos(t)
            tlx, tly = x - ux * L / 2 - vx * W / 2, y - uy * L / 2 - vy * W / 2
            ET.SubElement(layer[tk.RIVER_LAYER], "object", {
                "id": str(nid), "type": tk.BRIDGE_TYPE, "x": tk.num(tlx), "y": tk.num(tly),
                "width": tk.num(L), "height": tk.num(W), "rotation": tk.num(a % 360)})
            nid += 1
        root.set("nextobjectid", str(nid))
        K.xml_write(root, path)
        return len(objs)


# ------------------------------------------------------------ le mappe

def padus():
    """[§9.118] Padus (il Po): pianura aperta, il fiume taglia la mappa fra le
    due basi da sud-ovest a nord-est, tre ponti (uno al centro). Per
    ciascuno: oro e pietra piccola vicino alla base, boschi dietro e di
    lato, un'altra miniera vicino al ponte di lato, la pietra grande vicino
    al ponte centrale. La mappa per cominciare: economia e cavalleria.
    [§9.122, richiesta dell'autore] I ponti dipinti dall'autore (pontedx
    specchiato: il piano attraversa un fiume inclinato di ~22 gradi, come il
    Po vicino ai ponti), piu' strade, alberi sparsi, prati, fiori, macchie
    d'erba e di grano, sentieri."""
    M = HalfMap("sk_padus", 7000, 7000, "green1", seed=11)
    C = (M.cx, M.cy)
    # il fiume: vicino ai ponti inclinato come il ponte dipinto (~-22 gradi)
    M.river([(-100, 5300), (500, 5050), (950, 4760), (1250, 4720), (1800, 4490), (2100, 4050),
             (2550, 3950), (2950, 3760), (3250, 3600), C], width=170)
    M.painted_bridge("pontedx specchiato", *C)
    M.painted_bridge("pontedx specchiato", 1525, 4605)
    # strade: dalla base al ponte centrale (la marcata), al ponte di lato, alle
    # risorse di casa e lungo la riva fra i due ponti
    M.road([(1350, 1560), (1650, 2250), (2350, 2900), (3050, 3330), (3420, 3440)], "strada1")
    M.road([(1150, 1650), (1150, 2600), (1300, 3600), (1450, 4380)], "strada2", 90)
    M.road([(1500, 1450), (1800, 1250), (1900, 1130)], "strada2", 70)
    M.road([(1100, 1600), (850, 1800), (780, 1880)], "strada2", 70)
    M.road([(1580, 4370), (2000, 3900), (2600, 3700), (3000, 3520), (3300, 3420)], "strada2", 80)
    M.road([(1650, 2250), (2300, 2050), (3000, 1700)], "strada2", 70)
    # la base A e le sue risorse
    M.obj("centro", 1300, 1350)
    M.obj("miniera_oro", 1950, 1000)
    M.obj("pietr_piccolo", 700, 1950)
    M.obj("miniera_oro", 2300, 3300)       # vicino al ponte di lato
    M.obj("pietra_grande", 3900, 2900)     # vicino al ponte centrale
    keep = lambda x, y: not M.near_lines(x, y, 120) and math.hypot(x - 1300, y - 1350) > 520  # noqa: E731
    M.forest(550, 650, 450, 300, keep=keep)     # dietro la base
    M.forest(2550, 650, 380, 260, keep=keep)    # di lato
    M.forest(600, 2850, 250, 380, keep=keep)    # verso il fiume
    M.forest(3300, 1700, 320, 230, keep=keep)   # in mezzo
    M.forest(2700, 4700, 280, 200, keep=lambda x, y: not M.near_lines(x, y, 120))  # oltre il fiume, dal lato B
    # alberi sparsi, a uno o due
    M.scatter("albero", 40, (150, 150, 6850, 6850), 140)
    # prati, fiori, erba, grano, sentieri (decorazioni: non solide)
    # (niente prato1: in gioco e' un anello bianco, sembra un recinto)
    M.scatter("burst_erba1", 9, (300, 300, 6700, 6700), 200, lines=150)
    M.scatter("chiazzaparticellare", 4, (300, 300, 6700, 6700), 200, lines=150)
    M.scatter("burst_grano1", 3, (300, 300, 6700, 6700), 300, lines=200)
    for f in ("fiori_prato", "fiori_papaveri", "fiori_gialli_erba", "fiori_papaveri_erba"):
        M.scatter(f, 3, (200, 200, 6800, 6800), 120, lines=100)
    M.scatter("erba_1", 18, (150, 150, 6850, 6850), 60, lines=80)
    M.scatter("fiorame1", 14, (150, 150, 6850, 6850), 60, lines=80)
    M.scatter("traccia02", 2, (800, 800, 6200, 6200), 500, lines=350)
    return M


MAPS = {"padus": padus}


# ------------------------------------------------------------ controllo

def check(name):
    """Lo scenario e' simmetrico? Errori come elenco di stringhe."""
    sc = json.load(open(os.path.join(SCEN_DIR, "sk_%s.json" % name), encoding="utf-8"))
    W, H = sc["width"], sc["height"]
    off = mask_offsets()
    errs = []
    pts = []
    for i in sc["instances"]:
        if i["object"] in REGIA:
            continue
        dx, dy = off.get(i["object"], (0, 0))
        pts.append((i["object"], i["x"] + dx, i["y"] + dy))
    used = [False] * len(pts)
    for k, (o, x, y) in enumerate(pts):
        if used[k]:
            continue
        tx, ty = W - x, H - y
        j = next((j for j, (o2, x2, y2) in enumerate(pts) if not used[j] and j != k and o2 == o
                  and abs(x2 - tx) <= 1 and abs(y2 - ty) <= 1), None)
        if j is None and abs(x - tx) <= 1 and abs(y - ty) <= 1:
            used[k] = True  # al centro della mappa: gemello di se stesso (il ponte centrale)
        elif j is None:
            errs.append("%s (%g, %g) senza gemello" % (o, x, y))
        else:
            used[k] = used[j] = True
    for kind in ("rivers", "roads"):
        lines = [[tuple(p) for p in r["pts"]] for r in sc.get(kind, [])]
        for L in lines:
            twin = [(W - x, H - y) for x, y in reversed(L)]
            same = lambda A, B: len(A) == len(B) and all(abs(a[0] - b[0]) <= 1 and abs(a[1] - b[1]) <= 1 for a, b in zip(A, B))  # noqa: E731
            if not any(same(twin, M) or same(list(reversed(twin)), M) for M in lines):
                errs.append("%s: una linea senza gemella (da %s)" % (kind, L[0]))
    for b in sc.get("bridges", []):
        c = (sum(p[0] for p in b["pts"]) / 4, sum(p[1] for p in b["pts"]) / 4)
        if not any(abs(sum(p[0] for p in o["pts"]) / 4 - (W - c[0])) <= 1 and abs(sum(p[1] for p in o["pts"]) / 4 - (H - c[1])) <= 1
                   for o in sc.get("bridges", [])):
            errs.append("ponte in (%g, %g) senza gemello" % c)
    return errs


def main():
    args = sys.argv[1:]
    names = [a for a in args if not a.startswith("--")] or list(MAPS)
    if "--check" in args:
        bad = False
        for n in names:
            path = os.path.join(MAPS_DIR, "sk_%s.tmx" % n)
            tmp = path + ".nuova"
            MAPS[n]().write(tmp)
            same = open(tmp, "rb").read() == open(path, "rb").read()
            os.remove(tmp)
            errs = check(n)
            if not same:
                errs.insert(0, "mappe/sk_%s.tmx non e' quella che scrive tools/16 (rilancialo)" % n)
            print("sk_%s: %s" % (n, "simmetrica" if not errs else "%d errori" % len(errs)))
            for e in errs[:20]:
                print("  " + e)
            bad = bad or bool(errs)
        sys.exit(1 if bad else 0)
    for n in names:
        M = MAPS[n]()
        path = os.path.join(MAPS_DIR, "sk_%s.tmx" % n)
        k = M.write(path)
        print("mappe/sk_%s.tmx: %d oggetti, %d fiumi, %d ponti, %d strade" % (n, k, len(M.rivers), len(M.full()[2]), len(M.full()[3])))


if __name__ == "__main__":
    main()
