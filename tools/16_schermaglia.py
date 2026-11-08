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
SOLID_R = {"centro": 330, "miniera_oro": 120, "pietr_piccolo": 110, "pietra_grande": 130, "albero": 40,
           # [§9.123] la citta' (i centri delle maschere: mezza larghezza piu' un po')
           "ocr_teatro": 380, "ocr_basilica": 460, "ocr_tempio": 320, "castelloruin": 340, "chiesaruin": 270,
           "torreruin": 170, "o_colonna": 50, "o_fontana": 70, "o_statua1": 60, "o_statua2": 55, "o_statua3": 60,
           "o_statua4": 55, "montagna_7": 330, "montagna_8": 470, **{"ocr_%02d" % n: 70 for n in range(1, 46)}}


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
        self.center = []   # [§9.123] oggetti col centro della maschera al centro della mappa (gemelli di se stessi)
        self.patches = []  # [§9.123] macchie d'altro sfondo (lastricato): (punti, sfondo, sfumatura), gia' intere
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

    def center_obj(self, name, sprite=None):
        """[§9.123] Un oggetto col centro della maschera esattamente al centro
        della mappa: e' il gemello di se stesso."""
        dx, dy = self.off.get(name, (0, 0))
        self.center.append((name, round(self.cx - dx, 3), round(self.cy - dy, 3), sprite))

    def patch_ring(self, r, ry=None, wobble=0.12, n=24, bg="city2", feather=60):
        """[§9.123] Una macchia d'altro sfondo attorno al centro della mappa,
        un anello irregolare di raggi r (x) e ry (y): la meta' dei punti a caso,
        l'altra meta' ruotata (la macchia e' simmetrica da se')."""
        ry = ry or r
        half = []
        for k in range(n // 2):
            a = math.pi * k / (n // 2)
            q = 1 + self.rng.uniform(-wobble, wobble)
            half.append((self.cx + math.cos(a) * r * q, self.cy + math.sin(a) * ry * q))
        self.patches.append(([(round(x), round(y)) for x, y in half + [self.rot(x, y) for x, y in half]], bg, feather))

    def patch(self, pts, bg="city2", feather=40):
        """[§9.123] Una macchia (poligono) e la sua gemella ruotata."""
        self.patches.append(([(round(x), round(y)) for x, y in pts], bg, feather))
        self.patches.append(([tuple(round(v) for v in self.rot(x, y)) for x, y in pts], bg, feather))

    def free(self, x, y, r, lines=120, ignore=()):
        """(x, y) lontano r px dagli oggetti solidi gia' messi (e dai loro
        gemelli) e lines px da fiumi e strade?"""
        # [§9.123] le distanze fra i centri delle maschere (x, y: il centro
        # della maschera del nuovo oggetto)
        for name, ox, oy, _ in self.objs + self.center:
            if name in DECOR_OBJ or name in ignore:
                continue
            dx, dy = self.off.get(name, (0, 0))
            mx, my = ox + dx, oy + dy
            for px, py in ((mx, my), self.rot(mx, my)):
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
            dx, dy = self.off.get(name, (0, 0))
            self.obj(name, round(x - dx), round(y - dy), sprite)  # (x, y): il centro della maschera
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
        objs = list(self.center)  # [§9.123] gemelli di se stessi
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

        # [§9.123] le macchie d'altro sfondo (lastricato): poligoni nel livello macchie
        for pts, bg, feather in self.patches:
            x0, y0 = pts[0]
            o = ET.SubElement(layer[tk.PATCH_LAYER], "object", {"id": str(nid), "type": tk.PATCH_TYPE, "x": tk.num(x0), "y": tk.num(y0)})
            nid += 1
            pe = ET.SubElement(o, "properties")
            ET.SubElement(pe, "property", {"name": "sfondo", "value": bg})
            ET.SubElement(pe, "property", {"name": "sfumatura", "type": "float", "value": tk.num(feather)})
            ET.SubElement(o, "polygon", {"points": " ".join("%s,%s" % (tk.num(x - x0), tk.num(y - y0)) for x, y in pts)})
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


HOUSES = ["ocr_%02d" % n for n in (1, 2, 3, 4, 5, 11, 12, 13, 14, 15, 21, 22, 23, 24, 25, 31, 32, 33, 34, 35, 41, 42, 43, 44, 45)]


def urbs():
    """[§9.123] Urbs (Roma): al centro la citta' romana in rovina, come quella
    del livello 1 (isolati di case con le strade in mezzo, il lastricato), col
    Colosseo al centro e il foro attorno; tutta la pietra e' qui, nelle
    rovine (decisione dell'autore: nel Medioevo Roma era la cava di se
    stessa). Fuori, per ciascuno: oro e boschi vicino alla base, un'altra
    miniera sul fianco, due colli (montagne piccole) che lasciano due o tre
    strade verso il centro. Niente fiume: la mappa del fiume e' Padus."""
    M = HalfMap("sk_urbs", 7000, 7000, "green1", seed=23)
    C = (M.cx, M.cy)
    R_CITY, R_FORUM = 1900, 420
    # il lastricato: la citta' (un anello irregolare) e le strade che entrano
    M.patch_ring(R_CITY + 120, (R_CITY + 120) * 0.85, wobble=0.06, n=40, feather=90)
    M.patch([(1900, 2350), (2150, 2150), (2550, 2550), (2350, 2750)], feather=40)
    # il Colosseo al centro, il foro attorno
    M.center_obj("ocr_teatro")
    # le rovine di pietra (stone_parent), nel foro e piu' in la'
    M.obj("castelloruin", 2950, 3080)
    M.obj("chiesaruin", 3650, 2850)
    M.obj("torreruin", 2700, 3650)
    M.obj("torreruin", 3200, 2600)
    M.obj("chiesaruin", 2250, 3300)
    M.obj("castelloruin", 3900, 2250)
    # i monumenti e le cose del foro
    M.obj("ocr_basilica", 2500, 2650)
    M.obj("ocr_tempio", 4200, 2850)
    for name, x, y in (("o_colonna", 3050, 3500), ("o_colonna", 3150, 3550), ("o_colonna", 3250, 3600),
                       ("o_statua1", 3400, 2950), ("o_fontana", 2700, 3250), ("o_statua3", 3500, 3150),
                       ("o_colonna", 2350, 2950), ("o_statua2", 2900, 2400), ("o_fontana", 3600, 2500)):
        M.obj(name, x, y)
    # gli isolati: case su due direzioni (come le file del livello 1), con le
    # strade fra un isolato e l'altro; solo nella citta', fuori dal foro e
    # liberi da rovine e monumenti
    u, v = (150, -40), (45, 95)
    for i in range(-14, 15):
        for j in range(-22, 23):
            if i % 5 == 4 or j % 3 == 2:   # le strade
                continue
            x = M.cx + i * u[0] + j * v[0]
            y = M.cy + i * u[1] + j * v[1]
            d = math.hypot(x - M.cx, (y - M.cy) / 0.85)
            # (le case si toccano, come nel livello 1: si tengono lontane solo
            # da rovine, monumenti e strade)
            if d > R_CITY - 80 or d < R_FORUM + 380 or not M.half(x, y) or not M.free(x, y, 10, lines=140, ignore=HOUSES):
                continue
            if M.rng.random() < 0.06:       # qualche casa crollata: piazzette
                continue
            name = M.rng.choice(HOUSES)
            dx, dy = M.off.get(name, (0, 0))
            M.obj(name, round(x - dx), round(y - dy))
    # la base A e le sue risorse (niente pietra: e' tutta in citta')
    M.obj("centro", 1150, 1200)
    M.obj("miniera_oro", 1850, 800)
    M.obj("miniera_oro", 900, 3300)        # sul fianco, verso il colle
    # i colli: lasciano una strada diretta e due di lato
    M.obj("montagna_8", 650, 4300)
    M.obj("montagna_7", 3300, 650)
    # strade: dalla base a una porta della citta' (la marcata) e di lato
    M.road([(1350, 1400), (1800, 1900), (2050, 2250)], "strada1")
    M.road([(1050, 1450), (1000, 2300), (1500, 3050), (1930, 3350)], "strada2", 80)
    M.road([(1450, 1150), (2300, 1200), (3000, 1600), (3350, 1950)], "strada2", 80)
    keep = lambda x, y: not M.near_lines(x, y, 120) and math.hypot(x - 1150, y - 1200) > 520 \
        and math.hypot(x - M.cx, (y - M.cy) / 0.85) > R_CITY + 200  # noqa: E731
    M.forest(400, 500, 380, 260, keep=keep)
    M.forest(2700, 450, 380, 230, keep=keep)
    M.forest(450, 2500, 260, 420, keep=keep)
    M.forest(1900, 4800, 300, 220, keep=keep)   # dal lato B del fianco
    M.forest(4700, 1500, 300, 220, keep=keep)
    out = lambda x, y: math.hypot(x - M.cx, (y - M.cy) / 0.85) > R_CITY + 200  # noqa: E731
    for _ in range(30):                          # alberi sparsi fuori citta'
        M.scatter("albero", 1, (150, 150, 6850, 6850), 140)
        if M.objs[-1][0] == "albero" and not out(M.objs[-1][1], M.objs[-1][2]):
            M.objs.pop()
    # decorazioni fuori citta'
    for name, n, r, lines in (("burst_erba1", 8, 200, 150), ("chiazzaparticellare", 3, 200, 150), ("burst_grano1", 3, 300, 200),
                              ("fiori_prato", 3, 120, 100), ("fiori_papaveri", 3, 120, 100), ("fiori_gialli_erba", 2, 120, 100),
                              ("erba_1", 16, 60, 80), ("fiorame1", 10, 60, 80)):
        k = 0
        for _ in range(200):
            if k >= n:
                break
            before = len(M.objs)
            M.scatter(name, 1, (150, 150, 6850, 6850), r, lines=lines)
            if len(M.objs) > before:
                if out(M.objs[-1][1], M.objs[-1][2]):
                    k += 1
                else:
                    M.objs.pop()
    return M


MAPS = {"padus": padus, "urbs": urbs}


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
    cen = lambda P: (sum(p[0] for p in P) / len(P), sum(p[1] for p in P) / len(P))  # noqa: E731
    for pt in sc.get("patches", []):
        c = cen(pt["pts"])
        if not any(abs(cen(o["pts"])[0] - (W - c[0])) <= 2 and abs(cen(o["pts"])[1] - (H - c[1])) <= 2 and len(o["pts"]) == len(pt["pts"])
                   for o in sc.get("patches", [])):
            errs.append("macchia attorno a (%g, %g) senza gemella" % c)
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
