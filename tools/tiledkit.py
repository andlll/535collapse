"""Kit per Tiled: cio' che servono sia a tools/11_tiled_kit.py (genera il
kit e converte le room in mappe di Tiled) sia a tools/12_tiled_import.py
(mappa di Tiled -> scenario). STUDIO.md §9.

Categorie
  Ogni oggetto piazzabile sta in un tileset ("collezione di immagini" di
  Tiled) per categoria. La tile ha come classe ("type" nel file) il nome
  dell'oggetto GameMaker e la proprieta' "sprite"; per gli oggetti che nel
  Create scelgono lo sprite a caso (albero: alb1..alb8, casa, case nemiche)
  c'e' una tile per variante, tutte con la stessa classe: in partita lo
  sprite lo sceglie ancora il gioco.

Origini
  In GameMaker l'istanza sta nell'origine dello sprite, e la depth -y
  ordina per la y dell'origine; Tiled ancora gli oggetti a un punto del
  riquadro dell'immagine (objectalignment del tileset) e, con l'ordine
  "dall'alto in basso", ordina per la y di quel punto. Le immagini del kit
  sono quindi ritagliate sull'alpha e allargate con bordo trasparente
  finche' l'origine dello sprite cade nel centro esatto dell'immagine, e i
  tileset sono allineati al centro: la posizione dell'oggetto in Tiled e'
  la x, y dell'istanza, l'ordine di disegno e' quello del gioco, e
  rotazione, scala e ribaltamento di Tiled girano attorno all'origine come
  in GameMaker. Eccezione: gli sprite con l'origine nell'angolo in alto a
  sinistra (montagne, fiumi, chiazze, 0,0 [C]) stanno in tileset allineati
  in alto a sinistra, senza bordo (al centro raddoppierebbero larghezza e
  altezza: montagna10 occuperebbe 55 MB nella memoria di Tiled).

  La conversione e' comunque generale (from_tiled / to_tiled): vale per
  qualunque allineamento, ribaltamento e rotazione.
"""
import json
import math
import os
import re
import xml.etree.ElementTree as ET

from _paths import DATA_DIR, REPO_DIR

KIT_DIR = os.path.join(REPO_DIR, "build", "535-tiled-kit")
KIT_VERSION = 1
TILE = 50                     # griglia della mappa (solo per l'editor)
FLIP_H, FLIP_V, FLIP_D = 0x80000000, 0x40000000, 0x20000000
GID_MASK = 0x0FFFFFFF

# Livelli delle mappe, dal basso. "boschi" contiene forme (rettangoli,
# ellissi, poligoni) che tools/12_tiled_import.py riempie di alberi.
LAYERS = ["suolo", "erba e spighe", "terreno", "oggetti", "boschi", "regia"]
FOREST_LAYER = "boschi"
VIEW_TYPE = "vista"
FOREST_SPACING = 90          # distanza fra gli alberi del pennello bosco (px)           # rettangolo della vista iniziale, nel livello regia

# (nome del tileset, titolo, allineamento)
TILESETS = [
    ("terreno", "Terreno: strade, sentieri, prati, erba", "center"),
    ("montagne_fiumi", "Montagne, fiumi, chiazze (ancorati in alto a sinistra)", "topleft"),
    ("natura", "Alberi, erba alta, macchie d'erba e di spighe", "center"),
    ("risorse", "Oro, pietra, rovine", "center"),
    ("edifici", "Edifici del giocatore, mura, cantieri", "center"),
    ("unita", "Unita' del giocatore", "center"),
    ("nemici", "Edifici e unita' nemiche", "center"),
    ("citta", "Citta' romana, statue, fontane", "center"),
    ("regia", "Regia: manager, suggerimenti, dialoghi, segnali", "center"),
    # [§9.10] gli sprite nuovi dell'autore (nuovi/nuovi.json). I tileset nuovi
    # si aggiungono in fondo e le tile nuove in fondo al loro tileset: le
    # mappe gia' disegnate restano valide
    ("nuovi", "Nuovi: il monastero e gli altri sprite dell'autore", "center"),
]
ALIGN = {"center": (0.5, 0.5), "topleft": (0.0, 0.0)}

ALLY_UNITS = ["ally_warrior", "ally_picchiere", "ally_arciere", "ally_cavaliere", "ally_omino",
              "ally_catapulta", "ally_ariete"]
ALLY_BUILDINGS = ["centro", "casa", "magazzino", "barn", "caserma", "stalla", "castello", "chiesa",
                  "torre", "campo", "mura_ori", "mura_vert", "porta_ori", "porta_vert",
                  "o_statua1_real", "palo_1", "flag_r", "flag_r2", "flag_b"]
ENEMY = ["enemy_house", "enemy_caserma", "enemy_stalla", "enemy_torre", "o_box1", "o_box2",
         "enemy_warrior", "enemy_picchiere", "enemy_arciere", "enemy_cavaliere", "enemy_ariete",
         "enemy_catapulta"]
NATURE = ["albero", "albero_fake", "graa11", "graa12", "graa13", "graa14", "graa15",
          "burst_erba1", "burst_grano1", "chiazzaparticellare", "aquila_01"]
RESOURCES = ["miniera_oro", "pietra_grande", "pietr_piccolo"]
GROUND = ["strada_2", "strada_5", "strada_6", "strada_7", "strada_8",
          "traccia01", "traccia02", "traccia03", "traccia04", "erba_1", "prato1", "fiorame1"]
CITY_PROPS = ["o_colonna", "o_fontana", "o_statua1", "o_statua2", "o_statua3", "o_statua4"]
# le macchie d'erba, di spighe e di fili d'erba: oggetti senza sprite che
# spargono particelle (game/src/effects.js DECOR); nel kit un'immagine
DECOR = ["burst_erba1", "burst_grano1", "chiazzaparticellare"]


def category(name, info, nuovi_objects=()):
    """Tileset dell'oggetto, o None se non si piazza nelle room."""
    if name in nuovi_objects:
        return "nuovi"
    if name in ALLY_UNITS:
        return "unita"
    if name in ALLY_BUILDINGS or re.fullmatch(r"\w+_fond", name):
        return "edifici"
    if name in ENEMY:
        return "nemici"
    if name in NATURE:
        return "natura"
    if name in RESOURCES or re.fullmatch(r"\w*ruin", name):
        return "risorse"
    if re.fullmatch(r"montagna_\d+|fiume_\d+|fiume_animazione|chiazza01", name):
        return "montagne_fiumi"
    if name in GROUND:
        return "terreno"
    if re.fullmatch(r"ocr_\w+", name) or name in CITY_PROPS:
        return "citta"
    return None


# Oggetti di regia piazzati nelle room dell'autore o utili da piazzare: i
# segnalini (sprite dell'editor nella cartella "segnalini") e i suggerimenti
# e dialoghi del tutorial. Il manager serve in ogni room.
# albero_debug (una istanza in match, senza comportamento nel porting) sta
# qui, con l'etichetta, e non fra gli alberi: la si sceglieva per sbaglio
# (§9.10)
REGIA = ["manager", "fog_controller", "aggr_assign", "def_assign", "directioner",
         "lvl1_surface_generato", "dialogo_statua", "hint_iniziale", "albero_debug"]


def regia_objects(objs):
    out = list(REGIA)
    out += sorted(n for n in objs if re.fullmatch(r"(hint_\w+|dialogo_\d+_\d+)", n))
    return [n for n in dict.fromkeys(out) if n in objs]


def layer_of(name, info, cat):
    """Livello in cui va l'oggetto quando si converte una room."""
    if cat == "regia":
        return "regia"
    if name in DECOR:
        return "erba e spighe"
    if cat == "montagne_fiumi" and name != "chiazza01":
        return "terreno"
    if name == "aquila_01":
        return "regia"
    d = info["depth"]
    unit = any(p in ("ally_unit", "enemy_unit") for p in info["parents"])
    if not unit and not isinstance(d, dict) and d > -100:  # (la piazza del monastero: -2)
        return "suolo"
    return "oggetti"


# ------------------------------------------------------------- geometria

def _rot(theta_deg, dx, dy):
    """La rotazione di GameMaker (image_angle, antioraria a schermo, y in
    basso): e' anche quella di Tiled con l'angolo cambiato di segno."""
    t = math.radians(theta_deg)
    c, s = math.cos(t), math.sin(t)
    return dx * c + dy * s, -dx * s + dy * c


def _offset(tile, w, h, fh, fv):
    """Vettore (locale, prima della rotazione) dall'origine dello sprite al
    punto di ancoraggio di Tiled, per un oggetto largo w e alto h."""
    W, H = tile["size"]
    ox, oy = tile["origin"]
    ax, ay = ALIGN[tile["align"]]
    dx = w * (ox / W + ax - 1) if fh else w * (ax - ox / W)
    dy = h * (oy / H + ay - 1) if fv else h * (ay - oy / H)
    return dx, dy


def to_tiled(tile, x, y, sx, sy, angle):
    """Istanza GameMaker -> (x, y, w, h, rotazione, flip_h, flip_v) di Tiled."""
    W, H = tile["size"]
    fh, fv = sx < 0, sy < 0
    w, h = abs(sx) * W, abs(sy) * H
    dx, dy = _offset(tile, w, h, fh, fv)
    rx, ry = _rot(angle, dx, dy)
    return x + rx, y + ry, w, h, -angle, fh, fv


def from_tiled(tile, x, y, w, h, rotation, fh, fv):
    """Oggetto di Tiled -> (x, y, xscale, yscale, image_angle) dell'istanza."""
    W, H = tile["size"]
    angle = -rotation
    dx, dy = _offset(tile, w, h, fh, fv)
    rx, ry = _rot(angle, dx, dy)
    return x - rx, y - ry, (-1 if fh else 1) * w / W, (-1 if fv else 1) * h / H, angle


# --------------------------------------------------------------- manifest

def load_manifest(kit_dir=KIT_DIR):
    p = os.path.join(kit_dir, "kit.json")
    if not os.path.exists(p):
        raise SystemExit("manca il kit:\n  %s\n\nGeneralo con:\n  python3 tools/11_tiled_kit.py\n" % p)
    return json.load(open(p, encoding="utf-8"))


def num(v):
    """Numero compatto per il file (niente 1.0000000001 di troppo)."""
    r = round(v, 4)
    return str(int(r)) if r == int(r) else repr(r)


def room_json(name):
    return json.load(open(os.path.join(DATA_DIR, "rooms", name + ".json"), encoding="utf-8"))


def indent(elem):
    ET.indent(elem, space=" ")
    return elem
