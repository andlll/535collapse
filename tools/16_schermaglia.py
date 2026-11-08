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
- ponti e strade: il gemello ruotato (un ponte al centro e' gia' simmetrico);
- [§9.127, §9.128] le montagne piccole e gli alberi non tagliabili che
  coprono i lati tagliati dritti degli sprite delle montagne
  (cover_mountains, cover_cuts) non hanno gemello: lo sprite non si ruota,
  il lato tagliato del gemello sta dalla stessa parte dello sprite. Il
  controllo vuole solo che stiano su un lato tagliato.
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
BRIDGE_R = 300  # [§9.125] distanza dai ponti dipinti (free)
SOLID_R = {"centro": 330, "miniera_oro": 120, "pietr_piccolo": 110, "pietra_grande": 130, "albero": 40,
           # [§9.123] la citta' (i centri delle maschere: mezza larghezza piu' un po')
           "ocr_teatro": 380, "ocr_basilica": 460, "ocr_tempio": 320, "castelloruin": 340, "chiesaruin": 270,
           "torreruin": 170, "o_colonna": 50, "o_fontana": 70, "o_statua1": 60, "o_statua2": 55, "o_statua3": 60,
           "o_statua4": 55, "montagna_7": 330, "montagna_8": 470, **{"ocr_%02d" % n: 70 for n in range(1, 46)}}

# [§9.127] Mons Bardonis: i lati tagliati dritti degli sprite delle montagne
# (coordinate dello sprite, origine in alto a sinistra), da coprire con gli
# alberi non tagliabili (albero_fake) dove restano in vista, come ha fatto
# l'autore nel tutorial e nel livello 3. Misurati sull'alfa dei PNG: le
# altre montagne hanno il contorno intero (o solo i fili del tratto).
MOUNTAIN_CUTS = {
    "montagna_1": [(1071, 0, 1492, 0, "top"), (1492, 0, 1492, 204, "right")],
    "montagna_2": [(535, 824, 1345, 824, "bottom")],
    "montagna_4": [(401, 824, 862, 824, "bottom"), (0, 166, 0, 435, "left")],
    "montagna_5": [(0, 824, 937, 824, "bottom"), (0, 359, 0, 824, "left")],
}
COVER = "albero_fake"  # [§9.127] fuori dal controllo dei gemelli: vedi check
# dal punto del lato tagliato al tronco dell'albero (la chioma di alb1..8 sta
# fra -144 e -24 px in alto dal tronco, larga +-55 px)
# I tronchi stanno sulla roccia (verso l'interno) dove la chioma copre lo
# stesso il lato: solo sotto un lato tagliato in basso devono stare fuori, e
# solo li' il boschetto si allarga fuori dalla montagna (un tronco nel valico
# fermava un cavaliere).
COVER_STEP, COVER_OFF = 58, {"bottom": (0, 60), "top": (0, 85), "left": (30, 85), "right": (-30, 85)}


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
        self.edge_rivers = []  # [§9.124] fiumi sul bordo (interi, col gemello)
        self.center = []   # [§9.123] oggetti col centro della maschera al centro della mappa (gemelli di se stessi)
        self.patches = []  # [§9.123] macchie d'altro sfondo (lastricato): (punti, sfondo, sfumatura), gia' intere
        self.off = mask_offsets()

    def rot(self, x, y):
        return self.w - x, self.h - y

    # ------------------------------------------------ [§9.127] montagne
    _alpha = {}

    @classmethod
    def alpha(cls, obj):
        """(w, h, byte dell'alfa) dello sprite della montagna `obj`."""
        if obj not in cls._alpha:
            from PIL import Image
            from _paths import GMX_DIR
            spr = "montagna" + obj.split("_")[1]
            a = Image.open(os.path.join(GMX_DIR, "sprites", "images", spr + "_0.png")).convert("RGBA").getchannel("A")
            cls._alpha[obj] = (a.width, a.height, a.tobytes())
        return cls._alpha[obj]

    def mountain(self, n, cx, cy):
        """montagna_n con il centro dello SPRITE in (cx, cy) (l'origine e' in
        alto a sinistra)."""
        w, h, _ = self.alpha("montagna_%d" % n)
        self.obj("montagna_%d" % n, round(cx - w / 2), round(cy - h / 2))

    def mountains(self):
        """Le montagne della mappa intera: (nome, x, y) in alto a sinistra
        (con quelle piccole che coprono i tagli, §9.128)."""
        return [(n, x, y) for n, x, y, _ in self.full(covers=False)[0] + getattr(self, "cover_mts", [])
                if n.startswith("montagna_")]

    def rock_at(self, x, y, mts=None, front_of=None):
        """(x, y) cade su un pixel pieno di una montagna? front_of=y0: solo
        quelle disegnate davanti a una montagna con l'origine a y0 (depth -y)."""
        for n, mx, my in (mts if mts is not None else self.mountains()):
            if front_of is not None and my <= front_of:
                continue
            w, h, A = self.alpha(n)
            px, py = int(x - mx), int(y - my)
            if 0 <= px < w and 0 <= py < h and A[py * w + px] > 40:
                return True
        return False

    def on_rock(self, x, y, pad=0, mts=None):
        """Roccia in (x, y) o entro pad px (otto punti a pad e a pad/2)?"""
        mts = mts if mts is not None else self.mountains()
        pts = [(x, y)] + [(x + r * math.cos(k * math.pi / 4), y + r * math.sin(k * math.pi / 4))
                          for r in ((pad, pad / 2) if pad else ()) for k in range(8)]
        return any(self.rock_at(px, py, mts) for px, py in pts)

    def cut_hidden(self, px, py, side, host, mts):
        """[§9.128] Il punto (px, py) del lato tagliato `side` della montagna
        host = (nome, x, y) e' nascosto da una montagna disegnata davanti
        che ci ha la roccia (anche 8 px dentro)? (Una montagna dietro che
        riempie oltre il lato non basta: la cucitura dritta si vede.)"""
        ix, iy = {"bottom": (0, -8), "top": (0, 8), "left": (8, 0), "right": (-8, 0)}[side]
        hy = host[2]
        return self.rock_at(px, py, mts, front_of=hy) and self.rock_at(px + ix, py + iy, mts, front_of=hy)

    def cover_cuts(self):
        """[§9.127] Gli alberi non tagliabili sui lati tagliati delle montagne
        della mappa INTERA (non gemelli: lo sprite non si ruota, il lato
        tagliato del gemello sta dalla stessa parte dello sprite). Un tratto
        e' gia' nascosto se e' fuori dalla mappa o sotto una montagna
        disegnata davanti."""
        mts = self.mountains()
        self.covers = []
        for n, mx, my in mts:
            for x0, y0, x1, y1, side in MOUNTAIN_CUTS.get(n, ()):
                L = math.hypot(x1 - x0, y1 - y0)
                k = max(1, round((L + 40) / COVER_STEP))
                ox, oy = COVER_OFF[side]
                for i in range(k + 1):
                    t = -20 / L + (L + 40) / L * i / k
                    px, py = mx + x0 + (x1 - x0) * t, my + y0 + (y1 - y0) * t
                    if not (0 <= px <= self.w and 0 <= py <= self.h):
                        continue
                    # nascosto da una montagna davanti (anche appena dentro),
                    # o riempito oltre il lato da una dietro (§9.128)
                    if self.cut_hidden(px, py, side, (n, mx, my), mts):
                        continue
                    # un boschetto, non una siepe: posti a caso attorno al
                    # punto, e altre file sempre piu' rade (fuori dal lato in
                    # basso, sulla roccia per gli altri)
                    out = {"bottom": (0, 1), "top": (0, 1), "left": (1, 0), "right": (-1, 0)}[side]
                    jx, jy = (self.rng.uniform(-18, 18), self.rng.uniform(-10, 16)) if side in ("bottom", "top") \
                        else (self.rng.uniform(-8, 8), self.rng.uniform(-14, 14))
                    self.covers.append((COVER, round(px + ox + jx), round(py + oy + jy), None))
                    for row, prob in ((1, 0.6), (2, 0.3)):
                        if self.rng.random() < prob:
                            e = 55 * row + self.rng.uniform(-12, 12)
                            self.covers.append((COVER, round(px + ox + out[0] * e + self.rng.uniform(-28, 28)),
                                                round(py + oy + out[1] * e + self.rng.uniform(-22, 22)), None))

    def rock_grid(self, G, mts=None):
        """[§9.128] La roccia su una griglia di G px: (colonne, righe, byte)."""
        nx, ny = math.ceil(self.w / G), math.ceil(self.h / G)
        occ = bytearray(nx * ny)
        for n, mx, my in (mts if mts is not None else self.mountains()):
            w, h, A = self.alpha(n)
            for gy in range(max(0, int(my // G)), min(ny, int((my + h) // G) + 1)):
                py = int(gy * G + G / 2 - my)
                if not 0 <= py < h:
                    continue
                for gx in range(max(0, int(mx // G)), min(nx, int((mx + w) // G) + 1)):
                    px = int(gx * G + G / 2 - mx)
                    if 0 <= px < w and A[py * w + px] > 40:
                        occ[gy * nx + gx] = 1
        return nx, ny, occ

    def cover_mountains(self, pieces=(3, 6, 7, 8), max_n=3, avoid=()):
        """[§9.128, richiesta dell'autore] Sui lati tagliati dritti degli
        sprite delle montagne (MOUNTAIN_CUTS) rimasti in vista, una seconda
        montagna piccola sopra (disegnata davanti: l'origine piu' in basso),
        al posto delle file di alberi (troppo regolari). Per ogni montagna
        della mappa intera, gemelli compresi (lo sprite non si ruota: il lato
        tagliato del gemello e' dalla stessa parte), fino a max_n montagne
        piccole scelte fra `pieces` e le posizioni attorno al lato: quella che
        copre piu' punti del lato e sporge meno dalla roccia che c'e' gia'.
        avoid: cerchi (x, y, r) dove non deve arrivare la roccia (valichi,
        risorse, basi). Restano gli alberi (cover_cuts) solo per quel che
        avanza."""
        self.cover_mts = []
        G = 40
        samples = {}
        for pn in pieces:
            w, h, A = self.alpha("montagna_%d" % pn)
            samples[pn] = [(x, y) for y in range(G // 2, h, G) for x in range(G // 2, w, G) if A[y * w + x] > 40]
        for hn, hx, hy in [m for m in self.mountains() if m[0] in MOUNTAIN_CUTS]:
            pts = []
            for x0, y0, x1, y1, side in MOUNTAIN_CUTS[hn]:
                k = max(1, round(math.hypot(x1 - x0, y1 - y0) / 30))
                ix, iy = {"bottom": (0, -8), "top": (0, 8), "left": (8, 0), "right": (-8, 0)}[side]
                for i in range(k + 1):
                    px, py = hx + x0 + (x1 - x0) * i / k, hy + y0 + (y1 - y0) * i / k
                    if 0 <= px <= self.w and 0 <= py <= self.h:
                        pts.append((px, py, px + ix, py + iy, side))
            for _ in range(max_n):
                mts = self.mountains()
                pts = [p for p in pts if not self.cut_hidden(p[0], p[1], p[4], (hn, hx, hy), mts)]
                if not pts:
                    break
                nx, ny, occ = self.rock_grid(G, mts)
                cx, cy = sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts)
                best = None
                for pn in pieces:
                    w, h, A = self.alpha("montagna_%d" % pn)

                    def solid(x, y, tx, ty):
                        px, py = int(x - tx), int(y - ty)
                        return 0 <= px < w and 0 <= py < h and A[py * w + px] > 40
                    for ox in range(-480, 481, 40):
                        for oy in range(-360, 361, 40):
                            tx, ty = round(cx + ox - w / 2), round(cy + oy - h / 2)
                            if ty <= hy:
                                continue          # dietro: non copre
                            cov = sum(1 for p in pts if solid(p[0], p[1], tx, ty) and solid(p[2], p[3], tx, ty))
                            if not cov or (best and cov < best[0] * 0.5):
                                continue
                            prot, bad = 0, False
                            for sx, sy in samples[pn]:
                                X, Y = tx + sx, ty + sy
                                if any(math.hypot(X - ax, Y - ay) < ar for ax, ay, ar in avoid):
                                    bad = True
                                    break
                                gx, gy = int(X // G), int(Y // G)
                                if 0 <= gx < nx and 0 <= gy < ny and not occ[gy * nx + gx]:
                                    prot += 1
                            if bad:
                                continue
                            score = cov - prot * 0.02
                            if not best or score > best[1]:
                                best = (cov, score, pn, tx, ty)
                if not best or best[1] <= 0:
                    break
                self.cover_mts.append(("montagna_%d" % best[2], best[3], best[4], None))

    def road_auto(self, a, b, kind="strada2", width=80, margin=150, wiggle=0.8, share=0.75, amp=170, wl=1300):
        """[§9.128, richiesta dell'autore] Una strada da a a b che gira attorno
        alle montagne: A* su una griglia di 40 px (la mappa intera: montagne,
        oggetti solidi e fiumi, gemelli compresi), lontano almeno `margin` px
        dalla roccia e un po' di piu' dove puo'; un campo di costo ondulato
        (seno su seno, dal seme della mappa) la fa curvare anche in piano.
        Sulle strade che ci sono gia' costa meno (share): dove ci corre
        sopra non si ridisegna, la strada nuova parte o arriva li'
        (l'incrocio). Poi lisciata (Chaikin). Aggiunge i tratti nuovi
        (col gemello) e li restituisce."""
        import heapq
        G = 40
        nx, ny, occ = self.rock_grid(G, getattr(self, "rock", None) or self.mountains())
        N = nx * ny
        # distanza dalla roccia (in celle, 8 vicini)
        INF = 10 ** 6
        dist = [INF] * N
        q = [k for k in range(N) if occ[k]]
        for k in q:
            dist[k] = 0
        head = 0
        while head < len(q):
            k = q[head]
            head += 1
            x, y = k % nx, k // nx
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    X, Y = x + dx, y + dy
                    if 0 <= X < nx and 0 <= Y < ny and dist[Y * nx + X] > dist[k] + 1:
                        dist[Y * nx + X] = dist[k] + 1
                        q.append(Y * nx + X)
        blocked = bytearray(N)
        mc = math.ceil(margin / G)
        for k in range(N):
            if dist[k] < mc:
                blocked[k] = 1
        objs, rivers, _, roads = self.full()
        for name, ox, oy, _ in objs:
            if name.startswith("montagna_") or name in DECOR_OBJ or name == COVER or name == "albero":
                continue
            dx, dy = self.off.get(name, (0, 0))
            r = SOLID_R.get(name, 60) + 40
            for gy in range(max(0, int((oy + dy - r) // G)), min(ny, int((oy + dy + r) // G) + 1)):
                for gx in range(max(0, int((ox + dx - r) // G)), min(nx, int((ox + dx + r) // G) + 1)):
                    if math.hypot(gx * G + G / 2 - ox - dx, gy * G + G / 2 - oy - dy) < r:
                        blocked[gy * nx + gx] = 1

        def mark(pts, rad, arr):
            rr = math.ceil(rad / G)
            for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
                L = math.hypot(x1 - x0, y1 - y0)
                for i in range(int(L // (G / 2)) + 1):
                    t = i * (G / 2) / L if L else 0
                    x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
                    for gy in range(int(y // G) - rr, int(y // G) + rr + 1):
                        for gx in range(int(x // G) - rr, int(x // G) + rr + 1):
                            if 0 <= gx < nx and 0 <= gy < ny and math.hypot(gx * G + G / 2 - x, gy * G + G / 2 - y) <= rad:
                                arr[gy * nx + gx] = 1
        for pts, wdt in rivers:
            mark(pts, (max(wdt) if isinstance(wdt, tuple) else wdt) / 2 + 50, blocked)
        onroad = bytearray(N)
        for pts, _, wdt in roads:
            mark(pts, (wdt or tk.ROAD_WIDTH) / 2, onroad)
        ph = [self.rng.uniform(0, 2 * math.pi) for _ in range(4)]

        def cost(k):
            if onroad[k]:
                return share
            x, y = (k % nx) * G, (k // nx) * G
            n = 0.5 + 0.25 * (math.sin(x / 650 + ph[0]) * math.sin(y / 800 + ph[1]) + math.sin((x + y) / 1100 + ph[2]))
            return 1 + wiggle * n + max(0, 6 - dist[k]) * 0.25

        def cell(p):
            return min(ny - 1, max(0, int(p[1] // G))) * nx + min(nx - 1, max(0, int(p[0] // G)))
        s, t = cell(a), cell(b)
        blocked[s] = blocked[t] = 0
        tx, ty = t % nx, t // nx
        g = {s: 0.0}
        prev = {}
        open_ = [(0.0, s)]
        while open_:
            f, k = heapq.heappop(open_)
            if k == t:
                break
            if f > g[k] + share * math.hypot(k % nx - tx, k // nx - ty) + 1e-9:
                continue
            x, y = k % nx, k // nx
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    if not dx and not dy:
                        continue
                    X, Y = x + dx, y + dy
                    if not (0 <= X < nx and 0 <= Y < ny):
                        continue
                    n = Y * nx + X
                    if blocked[n]:
                        continue
                    ng = g[k] + cost(n) * (1.4142 if dx and dy else 1)
                    if ng < g.get(n, 1e18):
                        g[n] = ng
                        prev[n] = k
                        heapq.heappush(open_, (ng + share * math.hypot(X - tx, Y - ty), n))
        assert t in prev or s == t, "nessuna strada da %s a %s" % (a, b)
        path = [t]
        while path[-1] != s:
            path.append(prev[path[-1]])
        path.reverse()
        # i tratti fuori dalle strade che ci sono gia' (con l'incrocio)
        out, cur = [], []
        for i, k in enumerate(path):
            if onroad[k] and 0 < i < len(path) - 1:
                if cur:
                    cur.append(k)
                    out.append(cur)
                    cur = []
                continue
            if not cur and i > 0:
                cur.append(path[i - 1])
            cur.append(k)
        if cur:
            out.append(cur)
        made = []
        for seg in out:
            if len(seg) < 6:
                continue
            pts = [((k % nx) * G + G / 2, (k // nx) * G + G / 2) for k in seg]
            if seg[0] == s:
                pts[0] = tuple(a)
            if seg[-1] == t:
                pts[-1] = tuple(b)
            # un punto ogni ~160 px (la griglia fa solo 0/45/90 gradi), poi
            # le anse: spostati di lato quanto lascia la roccia, mai agli
            # estremi (gli incroci)
            pts = pts[:1] + pts[4:-2:4] + pts[-1:]
            acc = [0.0]
            for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
                acc.append(acc[-1] + math.hypot(x1 - x0, y1 - y0))
            tot = acc[-1] or 1
            p0, p1 = self.rng.uniform(0, 6.3), self.rng.uniform(0, 6.3)
            bent = [pts[0]]
            for i in range(1, len(pts) - 1):
                (xa, ya), (xb, yb) = pts[i - 1], pts[i + 1]
                L = math.hypot(xb - xa, yb - ya) or 1
                nxv, nyv = -(yb - ya) / L, (xb - xa) / L
                x, y = pts[i]
                room = dist[cell((x, y))] * G - margin * 0.6
                f = min(1, acc[i] / 500, (tot - acc[i]) / 500)
                o = min(amp, max(0, room)) * f * (0.7 * math.sin(2 * math.pi * acc[i] / wl + p0) + 0.3 * math.sin(2 * math.pi * acc[i] / (wl * 0.45) + p1))
                bent.append((x + nxv * o, y + nyv * o))
            pts = bent + [pts[-1]]
            for _ in range(3):                              # Chaikin, estremi fermi
                q2 = [pts[0]]
                for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
                    q2 += [(0.75 * x0 + 0.25 * x1, 0.75 * y0 + 0.25 * y1), (0.25 * x0 + 0.75 * x1, 0.25 * y0 + 0.75 * y1)]
                q2.append(pts[-1])
                pts = q2
            pts = pts[:1] + pts[3:-1:3] + pts[-1:]
            pts = [pts[0]] + [(round(x), round(y)) for x, y in pts[1:-1]] + [pts[-1]]
            self.road(pts, kind, width)
            made.append(pts)
        return made

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

    def meander(self, pts, amp=150, wl=1500, jag=16, step=60, calm_r=300, fix_end=False):
        """[§9.126, richiesta dell'autore] Un percorso naturale, non da canale:
        la polilinea si infittisce (un punto ogni `step` px) e ogni punto si
        sposta di lato di una somma di onde a caso (anse di ampiezza amp e
        lunghezza wl, piu' una frastagliatura jag a onde corte). Vicino ai
        ponti dipinti (gia' messi) lo spostamento va a zero entro calm_r px:
        li' il fiume resta dritto, con l'inclinazione del ponte. fix_end:
        l'ultimo punto non si muove (la meta' di un fiume che finisce al
        centro)."""
        dense = []
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            n = max(1, int(math.hypot(x1 - x0, y1 - y0) / step))
            dense += [(x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n) for k in range(n)]
        dense.append(tuple(pts[-1]))
        ph = [self.rng.uniform(0, 2 * math.pi) for _ in range(4)]
        calm = [(x, y) for _, x, y in self.full_painted()]
        out, sacc = [], 0.0
        for k, (x, y) in enumerate(dense):
            if k:
                sacc += math.hypot(x - dense[k - 1][0], y - dense[k - 1][1])
            a, b = dense[max(0, k - 1)], dense[min(len(dense) - 1, k + 1)]
            tx, ty = b[0] - a[0], b[1] - a[1]
            L = math.hypot(tx, ty) or 1
            nx, ny = -ty / L, tx / L
            o = amp * (0.65 * math.sin(2 * math.pi * sacc / wl + ph[0]) + 0.35 * math.sin(2 * math.pi * sacc / (wl * 0.43) + ph[1]))
            # (onde corte di 420 e 300 px: piu' corte curvavano piu' stretto di
            # mezza larghezza del fiume e la riva interna si ripiegava a "V")
            o += jag * (0.6 * math.sin(2 * math.pi * sacc / 420 + ph[2]) + 0.4 * math.sin(2 * math.pi * sacc / 300 + ph[3]))
            f = 1.0
            for cx, cy in calm:
                d = math.hypot(x - cx, y - cy)
                f = min(f, max(0.0, min(1.0, (d - calm_r * 0.6) / (calm_r * 0.8))))
            if fix_end and k == len(dense) - 1:
                f = 0.0
            if fix_end and k >= len(dense) - 4:   # all'arrivo al centro si smorza
                f *= (len(dense) - 1 - k) / 4
            out.append((x + nx * o * f, y + ny * o * f, f))
        # [§9.126] levigatura: curve morbide, niente spigoli dove un'ansa
        # incontra una curva stretta del percorso di base (tre passate
        # 1-2-1; fermi gli estremi e i tratti dritti dei ponti)
        pts2 = [(x, y) for x, y, _ in out]
        for _ in range(3):
            nxt = list(pts2)
            for k in range(1, len(pts2) - 1):
                if out[k][2] < 0.05:
                    continue
                nxt[k] = ((pts2[k - 1][0] + 2 * pts2[k][0] + pts2[k + 1][0]) / 4, (pts2[k - 1][1] + 2 * pts2[k][1] + pts2[k + 1][1]) / 4)
            pts2 = nxt
        return [(round(x), round(y)) for x, y in pts2]

    def cut(self, pts, gaps):
        """[§9.126] Le strisce di terra: la polilinea (gia' infittita) spezzata
        dove passa entro r px da un punto (x, y, r) di gaps; i pezzi sotto i
        tre punti si scartano."""
        pieces, cur = [], []
        for x, y in pts:
            if any(math.hypot(x - gx, y - gy) < r for gx, gy, r in gaps):
                if len(cur) >= 3:
                    pieces.append(cur)
                cur = []
            else:
                cur.append((x, y))
        if len(cur) >= 3:
            pieces.append(cur)
        return pieces

    def edge_river(self, pts, width=70, end=None):
        """[§9.124] Un fiume che non passa dal centro (sul bordo, decorativo):
        la polilinea intera e la gemella ruotata. [§9.125] end: la larghezza
        all'ultimo punto (si stringe)."""
        self.edge_rivers.append((pts, width if end is None else (width, end)))

    def forest_fill(self, sx=120, sy=72, jitter=0.3, keep=None):
        """[§9.124] Alberi dappertutto su una griglia sfalsata (passo sx, sy),
        nella meta' della base A (i gemelli dall'altra parte), dove keep(x, y)
        lo permette; (x, y) e' il centro della maschera dell'albero."""
        n = 0
        dx0, dy0 = self.off.get("albero", (0, 0))
        y, row = sy / 2, 0
        while y < self.h:
            x = sx / 2 + (sx / 2 if row % 2 else 0)
            while x < self.w:
                px = x + self.rng.uniform(-sx * jitter, sx * jitter)
                py = y + self.rng.uniform(-sy * jitter, sy * jitter)
                if 40 < px < self.w - 40 and 40 < py < self.h - 40 and self.half(px, py) and (keep is None or keep(px, py)):
                    self.obj("albero", round(px - dx0), round(py - dy0))
                    n += 1
                x += sx
            y += sy
            row += 1
        return n

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

    def free(self, x, y, r, lines=120, ignore=(), rock_pad=None):
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
        # [§9.125] niente sopra o attorno ai ponti dipinti (l'erba a
        # particelle si disegnava sul piano del ponte)
        for _, bx, by in self.full_painted():
            if math.hypot(bx - x, by - y) < r + BRIDGE_R:
                return False
        # [§9.127] niente sulla roccia delle montagne (self.rock: le montagne
        # della mappa intera, se la mappa le vuole controllate)
        if getattr(self, "rock", None) and self.on_rock(x, y, rock_pad or max(40, r * 0.6), self.rock):
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
            # [§9.127] le macchie d'erba e di fiori si allargano oltre r
            if not self.half(x, y) or not self.free(x, y, r, lines, rock_pad=r + 100 if name in DECOR_OBJ else None):
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
    def full(self, covers=True):
        objs = list(self.center)  # [§9.123] gemelli di se stessi
        for name, x, y, spr in self.objs:
            objs.append((name, x, y, spr))
            dx, dy = self.off.get(name, (0, 0))
            tx, ty = self.rot(x + dx, y + dy)
            objs.append((name, round(tx - dx, 3), round(ty - dy, 3), spr))
        if covers:
            objs += getattr(self, "cover_mts", [])  # [§9.128] gia' per la mappa intera
            objs += getattr(self, "covers", [])  # [§9.127] gia' per la mappa intera
        rivers = []
        for half, wdt in self.rivers:
            twin = [self.rot(*p) for p in reversed(half[:-1])]
            rivers.append(([tuple(p) for p in half] + twin, wdt))
        for pts, wdt in self.edge_rivers:
            rivers.append(([tuple(p) for p in pts], wdt))
            rivers.append(([self.rot(*p) for p in pts], wdt))
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
        lines = [(pts, (max(wdt) if isinstance(wdt, tuple) else wdt) or 150) for pts, wdt in rivers] + [(pts, wdt or tk.ROAD_WIDTH) for pts, _, wdt in roads]
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
            w0, w1 = wdt if isinstance(wdt, tuple) else (wdt, None)
            line(layer[tk.RIVER_LAYER], "fiume", pts, {"larghezza": w0, **({"larghezza_fine": w1} if w1 else {})})
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
    M.painted_bridge("pontedx specchiato", *C)
    M.painted_bridge("pontedx specchiato", 1525, 4605)
    # [§9.126] il Po con le anse (dritto solo ai ponti)
    M.river(M.meander([(-100, 5300), (500, 5050), (950, 4760), (1250, 4720), (1800, 4490), (2100, 4050),
                       (2550, 3950), (2950, 3760), (3250, 3600), C], amp=190, wl=1700, fix_end=True), width=170)
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


def silva():
    """[§9.124] Silva Umbra (la Foresta Umbra del Gargano): il bosco quasi
    dappertutto (decisione dell'autore), solo radure e strade senza alberi:
    le basi, una radura al centro, cinque radure di risorse per parte (oro e
    pietra sparsi fra i boschi), collegate da strade secondarie con un
    corridoio libero di ~300 px. Niente montagne ne' ponti; due ruscelli
    stretti sul bordo, solo per decorazione, lontani dalle strade."""
    M = HalfMap("sk_silva", 7000, 7000, "green1", seed=37)
    C = (M.cx, M.cy)
    # le radure: (x, y, rx, ry) nella meta' A (il centro e' simmetrico da se')
    glades = [(1250, 1300, 1000, 800),     # la base
              (3500, 3500, 760, 560),      # il centro
              (2700, 900, 420, 320), (800, 2800, 380, 330), (2350, 2600, 420, 330),
              (4300, 1300, 420, 330), (1300, 4400, 420, 330)]
    def in_glade(x, y, pad=0):
        for gx, gy, rx, ry in glades:
            for cx, cy in ((gx, gy), M.rot(gx, gy)):
                if ((x - cx) / (rx + pad)) ** 2 + ((y - cy) / (ry + pad)) ** 2 <= 1:
                    return True
        return False
    # le strade (strada2, larghe 90): base-centro, base-radure, radure fra loro
    W = 90
    for pts in ([(1550, 1650), (2350, 2600), (3000, 3150), (3200, 3300)],
                [(1750, 1050), (2300, 850), (2700, 900)],
                [(2700, 900), (3500, 1050), (4300, 1300)],
                [(4300, 1300), (4150, 2200), (3800, 2950)],
                [(1000, 1750), (850, 2300), (800, 2800)],
                [(800, 2800), (950, 3600), (1300, 4400)],
                [(1300, 4400), (2200, 4100), (2950, 3800)],
                [(800, 2800), (1600, 2700), (2350, 2600)],
                [(4300, 1300), (5000, 1900), (5700, 2600)]):
        M.road(pts, "strada2", W)
    # i ruscelli sul bordo (stretti, senza ponti)
    M.edge_river(M.meander([(-60, 3900), (180, 4400), (110, 5000), (260, 5600), (140, 6200), (300, 7060)], amp=60, wl=800, jag=12), 70)
    # la base A e le risorse
    M.obj("centro", 1200, 1250)
    M.obj("miniera_oro", 1900, 900)
    M.obj("pietr_piccolo", 600, 1800)
    M.obj("miniera_oro", 2800, 820)        # radure di risorse
    M.obj("pietr_piccolo", 700, 2950)
    M.obj("miniera_oro", 2250, 2450)
    M.obj("pietra_grande", 4400, 1200)
    M.obj("miniera_oro", 1400, 4500)
    M.obj("miniera_oro", 3150, 3300)       # il centro, conteso
    M.obj("pietra_grande", 3700, 3050)
    # il bosco: dappertutto tranne radure, strade, ruscelli e attorno alle risorse
    def keep(x, y):
        if in_glade(x, y) or M.near_lines(x, y, 110):
            return False
        return M.free(x, y, 30, lines=110, ignore=("albero",))
    M.forest_fill(130, 78, keep=keep)
    # qualche albero dentro le radure grandi (non nella base), e decorazioni
    for name, n, r, lines in (("fiori_prato", 4, 120, 100), ("fiori_papaveri", 3, 120, 100), ("fiori_gialli_erba", 3, 120, 100),
                              ("burst_erba1", 6, 150, 100), ("erba_1", 14, 60, 80), ("fiorame1", 10, 60, 80)):
        k = 0
        for _ in range(300):
            if k >= n:
                break
            before = len(M.objs)
            M.scatter(name, 1, (150, 150, 6850, 6850), r, lines=lines)
            if len(M.objs) > before:
                if in_glade(M.objs[-1][1], M.objs[-1][2], -60):
                    k += 1
                else:
                    M.objs.pop()
    return M


def rivoaltus():
    """[§9.125] Rivoaltus (Rialto, la laguna): una trama di canali e circa nove
    isole di terra. Il Canal Grande passa dal centro a -22 gradi, con due
    canali paralleli a 2100 px; due canali verticali a x 2250 e 4750. I ponti
    sono quelli dipinti dall'autore (decisione dell'autore): pontedx
    specchiato sui canali a -22 gradi (come a Padus), pontedx2 (la fascia
    percorribile va da sinistra a destra) sui canali verticali; sette
    ponti, uno al centro (il Rialto), e sei strisce di terra (istmi, §9.126)
    dove il canale si interrompe. Canali dal percorso irregolare (§9.126).
    Laguna aperta negli angoli fra le basi. Isole con boschi, oro e pietra; le due isole al centro, contese,
    con qualche casa e una chiesa in rovina."""
    M = HalfMap("sk_rivo", 7000, 7000, "green1", seed=41)
    C = (M.cx, M.cy)
    T = math.tan(math.radians(22))
    nx, ny = math.sin(math.radians(22)), math.cos(math.radians(22))   # la normale ai canali a -22 gradi

    def gy(x, off):
        """y del canale a -22 gradi spostato di off lungo la normale, in x"""
        px, py = M.cx + off * nx, M.cy + off * ny
        return py + (px - x) * T
    OFF = 2100
    # i ponti (prima dei canali: vicino ai ponti i canali restano dritti)
    M.painted_bridge("pontedx specchiato", *C)
    M.painted_bridge("pontedx specchiato", 1200, round(gy(1200, 0)))     # Canal Grande, a ovest
    M.painted_bridge("pontedx specchiato", 1300, round(gy(1300, -OFF)))  # il parallelo a nord
    M.painted_bridge("pontedx2", 2250, 2900)                             # il canale verticale
    # [§9.126, richiesta dell'autore] le strisce di terra al posto di altri
    # ponti: il canale si interrompe (istmo) sul canale verticale in alto e in
    # basso e sul parallelo a nord, al centro
    ISTMI = [(2250, 900, 230), (2250, 5200, 230), (3500, round(gy(3500, -OFF)), 240)]
    # il Canal Grande (dal bordo al centro; il resto e' il gemello) e i due
    # paralleli, coi percorsi irregolari (§9.126: non canali artificiali)
    M.river(M.meander([(-150, round(gy(-150, 0))), (900, round(gy(900, 0))), (1800, round(gy(1800, 0))),
                       (2700, round(gy(2700, 0))), C], amp=110, wl=1300, fix_end=True), width=170)
    par = M.meander([(x, round(gy(x, -OFF))) for x in (-150, 1900, 4200, 7150)], amp=120, wl=1400)
    for piece in M.cut(par, ISTMI):
        M.edge_river(piece, 170)
    # i canali verticali
    ver = M.meander([(2250, y) for y in (-150, 2300, 4600, 7150)], amp=110, wl=1300)
    for piece in M.cut(ver, ISTMI):
        M.edge_river(piece, 150)
    # la laguna aperta nell'angolo in alto a destra (e, ruotata, in basso a sinistra)
    M.edge_river(M.meander([(4950, -200), (5700, 450), (6500, 750), (7200, 900)], amp=110, wl=1600, jag=0, step=220), 900)  # larga: punti radi, niente frastagliatura fine (artefatti)
    # i rii: canali laterali che si stringono
    for pts, w0, w1 in (([(2250, 3700), (2000, 3850), (1750, 3820), (1550, 3950)], 150, 50),
                        ([(2250, 300), (2550, 350), (2800, 250), (3000, 330)], 140, 50),
                        ([(-150, 2300), (200, 2420), (420, 2600), (560, 2700)], 160, 50),
                        ([(4750, 3300), (4450, 3150), (4300, 3250)], 130, 40)):
        M.edge_river(M.meander(pts, amp=35, wl=500, jag=10), w0, w1)
    # le strade fra i ponti e sugli istmi (non sull'acqua)
    for pts in ([(1150, 1250), (1250, 1900)], [(1300, 2380), (1250, 4180)],
                [(1450, 1050), (2250, 900), (3300, 1050), (3480, 1150), (3500, 1480), (3450, 2500), (3420, 3280)],
                [(2420, 2900), (3000, 3100), (3380, 3300)], [(1450, 2200), (2080, 2850)],
                [(1350, 4700), (2250, 5200), (3100, 5450)]):
        M.road(pts, "strada2", 80)
    # la base A, sull'isola in alto a sinistra
    M.obj("centro", 1050, 1000)
    M.obj("miniera_oro", 1750, 580)
    M.obj("pietr_piccolo", 420, 1500)
    keep = lambda x, y: not M.near_lines(x, y, 120) and math.hypot(x - 1050, y - 1000) > 520  # noqa: E731
    M.forest(400, 450, 330, 220, keep=keep)
    # l'isola a ovest, fra il canale parallelo e il Canal Grande
    M.obj("miniera_oro", 700, 3100)
    M.forest(1700, 3300, 300, 260, keep=keep)
    # l'isola in alto, a nord del canale parallelo
    M.obj("pietra_grande", 3100, 520)
    M.forest(4000, 450, 260, 180, keep=keep)
    # l'isola centrale (contesa): case, una chiesa in rovina, oro
    M.obj("chiesaruin", 2900, 2450)
    M.obj("miniera_oro", 4000, 2350)
    houses = ["ocr_%02d" % n for n in (11, 12, 13, 14, 15, 21, 22, 23, 24, 25)]
    for x, y in ((3650, 2700), (3800, 2650), (3600, 2850), (2700, 2750), (2850, 2830), (4200, 2700)):
        name = M.rng.choice(houses)
        if M.free(x, y, 40, lines=140):
            dx, dy = M.off.get(name, (0, 0))
            M.obj(name, round(x - dx), round(y - dy))
    # l'isola a sud-ovest, oltre il Canal Grande
    M.obj("miniera_oro", 1000, 5300)
    M.forest(600, 4700, 280, 220, keep=keep)
    # alberi sparsi, erba, fiori (la densita' delle altre mappe)
    M.scatter("albero", 25, (150, 150, 6850, 6850), 140)
    for name, n, r, lines in (("burst_erba1", 7, 200, 300), ("chiazzaparticellare", 3, 200, 300), ("fiori_prato", 3, 120, 160),
                              ("fiori_papaveri", 2, 120, 160), ("fiori_gialli_erba", 3, 120, 160), ("erba_1", 14, 60, 80),
                              ("fiorame1", 10, 60, 80)):
        M.scatter(name, n, (150, 150, 6850, 6850), r, lines=lines)
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


def bardonis():
    """[§9.127] Mons Bardonis (il Monte Bardone, il passo della Cisa sulla via
    Francigena): una cresta di montagne attraversa la mappa da un bordo
    all'altro fra le due basi, con tre valichi: al centro la via Francigena
    (la strada marcata) e due di lato; ogni base ha la sua valle (la base A
    quella in alto). Montagne anche negli angoli e ai bordi; per ciascuno:
    oro, pietra e boschi nella valle, una torre in rovina (pietra) davanti al
    valico lontano. La cresta e' orizzontale: gli sprite delle montagne sono
    larghi, in diagonale lasciavano buchi a scalini. Gli sprite hanno qualche
    lato tagliato dritto: dove resta in vista ci va sopra una montagna
    piccola (cover_mountains, §9.128), e per quel che avanza un albero non
    tagliabile (cover_cuts). Le strade le traccia road_auto attorno alle
    montagne (§9.128). Ruscelli stretti ai margini, solo per decorazione."""
    M = HalfMap("sk_bardonis", 7000, 7000, "green1", seed=53)
    C = (M.cx, M.cy)
    # la cresta, meta' sinistra (il gemello fa la destra): la 9 (maschera
    # precisa) fa il muro, la 3 e la 6 (piccole, maschera a ellisse) sono i
    # contrafforti
    # [§9.128] la cresta tutta con la 9, che non ha lati tagliati: quelli
    # della 5 davano sul valico centrale (dove non ci sta una montagna
    # piccola sopra), quello della 1 e' in alto (nessuna montagna davanti lo
    # copre: sta piu' in basso)
    for n, x, y in ((9, 100, 3450), (9, 2400, 3500), (6, 650, 2900), (3, 300, 4100)):
        M.mountain(n, x, y)
    # negli angoli e ai bordi della valle A (i gemelli in quella B)
    M.mountain(4, 2650, 230)        # in alto (i lati tagliati: una montagna piccola davanti)
    M.mountain(9, 6450, 380)        # l'angolo in alto a destra
    M.mountain(7, 4400, 300)
    M.mountain(6, 200, 600)
    # la base A e le risorse
    M.obj("centro", 1200, 1200)
    M.obj("miniera_oro", 1900, 850)
    M.obj("pietr_piccolo", 650, 1800)
    M.obj("miniera_oro", 4300, 1150)       # in fondo alla valle
    M.obj("pietra_grande", 2400, 2450)     # ai piedi della cresta, verso il valico
    M.obj("miniera_oro", 600, 2500)        # davanti al valico di sinistra
    M.obj("torreruin", 5450, 2700)         # davanti al valico di destra
    # [§9.128, richiesta dell'autore] sui lati tagliati in vista una seconda
    # montagna piccola (non piu' le file di alberi); niente roccia nei valichi
    # ne' sulle risorse
    PASSES = [C, (1220, 3450), (5780, 3550)]
    avoid = [(x, y, 240) for x, y in PASSES]
    for name, x, y, _ in M.full()[0]:
        if not name.startswith("montagna_"):
            dx, dy = M.off.get(name, (0, 0))
            avoid.append((x + dx, y + dy, SOLID_R.get(name, 60) + 80))
    M.cover_mountains(avoid=avoid)
    M.rock = M.mountains()
    # i ruscelli ai margini, dalla montagna al bordo (si stringono alla sorgente)
    M.edge_river(M.meander([(7060, 2500), (6850, 2000), (6700, 1500), (6520, 950)], amp=45, wl=650, jag=8), 70, 30)
    M.edge_river(M.meander([(-60, 2300), (120, 2650), (330, 2900)], amp=35, wl=550, jag=8), 60, 28)
    # [§9.128, richiesta dell'autore] le strade girano attorno alle montagne
    # (road_auto) e sono di piu'; dove una corre su un'altra parte l'incrocio
    M.road_auto((1500, 1550), C, "strada1", None)               # la via Francigena (il gemello va all'altra base)
    M.road_auto((1600, 1350), (4150, 1350))                     # lungo la valle, alla miniera in fondo
    M.road_auto((1300, 1650), PASSES[1])                        # al valico di sinistra
    M.road_auto(PASSES[1], (2550, 5650))                        # e oltre, nella valle dell'altro
    M.road_auto((1050, 1600), (800, 2300), width=70)            # alla pietra e alla miniera di sinistra
    M.road_auto((2600, 2350), (1500, 1550), width=70)           # alla pietra grande
    M.road_auto((1350, 2850), (5700, 2900), width=70)           # ai piedi della cresta, da un valico all'altro
    M.road_auto((4150, 1350), (6200, 1700), width=70)           # verso il ruscello
    M.road_auto((3500, 10), (3300, 1300), width=70)             # dal bordo in alto
    keep = lambda x, y: not M.near_lines(x, y, 120) and math.hypot(x - 1200, y - 1200) > 560 \
        and not M.on_rock(x, y, 60, M.rock)  # noqa: E731
    M.forest(400, 450, 300, 260, keep=keep)
    M.forest(2700, 1150, 420, 220, keep=keep)
    M.forest(3900, 2600, 380, 260, keep=keep)
    M.forest(5300, 1300, 330, 230, keep=keep)
    for _ in range(40):                          # alberi sparsi
        M.scatter("albero", 1, (150, 150, 6850, 6850), 140)
    for name, n, r, lines in (("burst_erba1", 8, 200, 150), ("chiazzaparticellare", 3, 200, 150),
                              ("fiori_prato", 3, 120, 100), ("fiori_papaveri", 2, 120, 100), ("fiori_gialli_erba", 3, 120, 100),
                              ("erba_1", 16, 60, 80), ("fiorame1", 10, 60, 80)):
        M.scatter(name, n, (150, 150, 6850, 6850), r, lines=lines)
    M.cover_cuts()
    return M


MAPS = {"padus": padus, "urbs": urbs, "silva": silva, "rivo": rivoaltus, "bardonis": bardonis}


# ------------------------------------------------------------ controllo

def check(name):
    """Lo scenario e' simmetrico? Errori come elenco di stringhe."""
    sc = json.load(open(os.path.join(SCEN_DIR, "sk_%s.json" % name), encoding="utf-8"))
    W, H = sc["width"], sc["height"]
    off = mask_offsets()
    errs = []
    pts = []
    # [§9.127] gli alberi che coprono i lati tagliati delle montagne non hanno
    # gemello (lo sprite non si ruota): basta che stiano su un lato tagliato
    cuts = []
    for i in sc["instances"]:
        for x0, y0, x1, y1, side in MOUNTAIN_CUTS.get(i["object"], ()):
            cuts.append((i["x"] + x0, i["y"] + y0, i["x"] + x1, i["y"] + y1))

    def near_cut(x, y, R=260):
        for x0, y0, x1, y1 in cuts:
            vx, vy = x1 - x0, y1 - y0
            t = max(0, min(1, ((x - x0) * vx + (y - y0) * vy) / (vx * vx + vy * vy or 1)))
            if math.hypot(x - x0 - t * vx, y - y0 - t * vy) < R:
                return True
        return False
    for i in sc["instances"]:
        if i["object"] in REGIA:
            continue
        if i["object"] == COVER:
            if not near_cut(i["x"], i["y"]):
                errs.append("%s (%g, %g) lontano dai lati tagliati delle montagne" % (COVER, i["x"], i["y"]))
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
        elif j is None and o in ("montagna_3", "montagna_6", "montagna_7", "montagna_8") and near_cut(x, y, 600):
            used[k] = True  # [§9.128] una montagna piccola sopra un lato tagliato (cover_mountains)
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
