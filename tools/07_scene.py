"""Oggetti e room -> formato del motore (game/assets/, non versionato).

  game/assets/objects.json      tutti gli oggetti (anche quelli creati in
                                partita: cadaveri, proiettili, pulsanti)
  game/assets/rooms/<room>.json le istanze di ogni room, in ordine di creazione
  game/assets/cursor.png        il cursore del gioco (mouser Create:
                                action_set_cursor(cursore) [C])

Per ogni oggetto risolve quello che serve a crearlo e disegnarlo:

  sprite   lo sprite dell'oggetto; se il Create lo cambia con una scelta a
           caso (p.es. albero: type=irandom_range(1,8), alb1..alb8 [C]) la
           lista "choices"; "sprite_index=null" nel Create = niente sprite
  depth    numero fisso (la depth dell'oggetto), oppure {"y": k} se il
           Create imposta depth=-y+k (la regola "piu' in basso = davanti"
           che il gioco ripete in Step, STUDIO.md §1.3)
  draw     false se l'oggetto (o il parent da cui eredita) ha un evento Draw
           proprio: in GMS il Draw sostituisce il disegno automatico dello
           sprite [I], e quegli oggetti si disegnano dal loro codice
  visible  il flag dell'oggetto
  mask     lo sprite usato per le collisioni (maskName, altrimenti lo sprite)
  solid    il flag "solid" (STUDIO.md §1.3: tutte le unita' lo sono)
  parents  la catena dei parent (with(ally_unit), instance_number(enemy_build)
           ecc. valgono anche per i figli, STUDIO.md §1.3)
  reveal   true se l'oggetto parte invisibile e il suo Step lo rende
           visibile (alberi, rovine, pietre: si rivelano quando un'unita'
           li vede, STUDIO.md §2.5) — l'anteprima senza nebbia li mostra

Room portate (decisione dell'autore, STUDIO.md §0.15): menu, match, lvl01,
lvl02. Escluse test_ground, resizer, mobile e lvl03 (vuota).

Uso:  python3 tools/07_scene.py
"""
import glob
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image  # noqa: E402

from _paths import DATA_DIR, GMX_DIR, REPO_DIR, SRC_DIR, need  # noqa: E402
import nuovi  # noqa: E402

ROOMS = ["menu", "match", "lvl01", "lvl02"]
OUT = os.path.join(REPO_DIR, "game", "assets", "rooms")


def read_event(obj, name):
    p = os.path.join(SRC_DIR, "objects", obj, name + ".gml")
    if not os.path.exists(p):
        return None
    return re.sub(r"//[^\n]*", "", open(p, encoding="utf-8").read())


def main():
    need(os.path.join(DATA_DIR, "objects.json"), "data/objects.json (lancia 02_extract.py)")
    objs = {o["name"]: o for o in json.load(open(os.path.join(DATA_DIR, "objects.json"), encoding="utf-8"))}
    sprites = {s["name"] for s in json.load(open(os.path.join(DATA_DIR, "sprites.json"), encoding="utf-8"))}

    def chain(name):
        out = []
        while name in objs and name not in out:
            out.append(name)
            name = objs[name]["parent"]
        return out

    def inherited(name, event):
        for c in chain(name):
            if any(e["file"] == event + ".gml" for e in objs[c]["events"]):
                return c
        return None

    info = {}
    for name, o in objs.items():
        src = inherited(name, "Create")
        create = read_event(src, "Create") if src else ""
        entry = {"sprite": o["sprite"], "visible": o["visible"], "parents": chain(name)[1:],
                 "mask": o["mask"], "solid": o["solid"],
                 "draw": inherited(name, "Draw") is None, "depth": o["depth"]}
        if not o["visible"]:
            step_src = inherited(name, "Step")
            entry["reveal"] = bool(step_src and re.search(r"\bvisible\s*=\s*true",
                                                          read_event(step_src, "Step") or ""))
        m = re.search(r"\bdepth\s*=\s*-\s*y\s*(?:([+-])\s*(\d+))?\s*(?:\n|;|\}|$)", create or "")
        if m:
            entry["depth"] = {"y": (int(m.group(2)) * (1 if m.group(1) == "+" else -1)) if m.group(2) else 0}
        assigned = re.findall(r"\bsprite_index\s*=\s*([A-Za-z_]\w*)", create or "")
        if assigned == ["null"]:
            entry["sprite"] = None
        elif len(set(assigned)) > 1 and "irandom" in create:
            entry["choices"] = [s for s in dict.fromkeys(assigned) if s in sprites]
        elif len(set(assigned)) == 1 and assigned[0] in sprites:
            entry["sprite"] = assigned[0]
        info[name] = entry

    # [§9.10] oggetti nuovi dell'autore (nuovi/nuovi.json); quelli con le fette
    # hanno "slices": [[sprite della fetta, front]] (game/src/app.js, sliced)
    # e l'oggetto "__fetta", senza maschera ne' comportamento, che le disegna
    nsp = nuovi.sprites()
    for name, o in nuovi.load()["objects"].items():
        if name in info:
            raise SystemExit("nuovi/nuovi.json: %s c'e' gia' fra gli oggetti del progetto" % name)
        sp = nsp[o["sprite"]] if o["sprite"] else None
        entry = {"sprite": o["sprite"], "visible": True, "parents": o.get("parents", []),
                 "mask": None, "solid": bool(o.get("solid")), "draw": True, "depth": o.get("depth", {"y": 0})}
        if sp and sp["fette"]:
            entry["slices"] = [[o["sprite"] + nuovi.SLICE_SEP + str(k), f] for k, (_, _, f) in enumerate(sp["fette"])]
        info[name] = entry
    info["__fetta"] = {"sprite": None, "visible": True, "parents": [], "mask": None, "solid": False,
                       "draw": True, "depth": 0}
    # [§9.11] un oggetto di un gruppo "neutrale" della mappa prima che passi
    # al giocatore: stesso sprite, ostacolo come la citta' romana
    info["__neutrale"] = {"sprite": None, "visible": True, "parents": ["natural_parent"], "mask": None,
                          "solid": True, "draw": True, "depth": 0}
    os.makedirs(OUT, exist_ok=True)
    assets = os.path.dirname(OUT)
    with open(os.path.join(assets, "objects.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(info, f, separators=(",", ":"))
    spr = {s["name"]: s for s in json.load(open(os.path.join(DATA_DIR, "sprites.json"), encoding="utf-8"))}
    cur = spr["cursore"]
    Image.open(os.path.join(GMX_DIR, "sprites", "images", cur["frames"][0])).save(os.path.join(assets, "cursor.png"))
    with open(os.path.join(assets, "cursor.json"), "w", encoding="utf-8") as f:
        json.dump({"file": "cursor.png", "origin": [cur["origin_x"], cur["origin_y"]]}, f)
    for room in ROOMS:
        r = json.load(open(os.path.join(DATA_DIR, "rooms", room + ".json"), encoding="utf-8"))
        used = sorted({i["object"] for i in r["instances"]})
        scene = {"name": room, "width": r["width"], "height": r["height"], "speed": r["speed"],
                 "colour": r["colour"], "views": r["views"],
                 "backgrounds": [b for b in r["backgrounds"] if b["visible"] and b["name"]],
                 "objects": used,
                 "instances": [[i["object"], i["x"], i["y"], i["scale_x"], i["scale_y"],
                                i["rotation"], i["colour"]] for i in r["instances"]]}
        with open(os.path.join(OUT, room + ".json"), "w", encoding="utf-8", newline="\n") as f:
            json.dump(scene, f, separators=(",", ":"))
        drawn = sum(1 for i in r["instances"] if info[i["object"]]["draw"]
                    and (info[i["object"]]["visible"] or info[i["object"]].get("reveal"))
                    and (info[i["object"]]["sprite"] or info[i["object"]].get("choices")))
        print("%-6s %4d istanze, %4d disegnate dallo sprite, %3d oggetti diversi"
              % (room, len(r["instances"]), drawn, len(used)))
    # [§9.10] gli scenari disegnati in Tiled (scenari/<nome>.json, da
    # tools/12_tiled_import.py) nello stesso formato delle room
    for p in sorted(glob.glob(os.path.join(REPO_DIR, "scenari", "*.json"))):
        sc = json.load(open(p, encoding="utf-8"))
        unknown = sorted({i["object"] for i in sc["instances"]} - set(info))
        if unknown:
            raise SystemExit("%s: oggetti sconosciuti %s" % (p, unknown))
        v = sc["view"]
        scene = {"name": sc["name"], "width": sc["width"], "height": sc["height"], "speed": 60,
                 "colour": sc["colour"],
                 "views": [{"index": 0, "follow": "mouser", "xview": v["x"], "yview": v["y"], "wview": v["w"],
                            "hview": v["h"], "xport": 0, "yport": 0, "wport": 1024, "hport": 768,
                            "hborder": 32, "vborder": 32, "hspeed": -1, "vspeed": -1}],
                 "backgrounds": [{"name": sc["background"], "visible": True, "foreground": False, "x": 0, "y": 0,
                                  "htiled": True, "vtiled": True, "hspeed": 0, "vspeed": 0, "stretch": False}]
                 if sc["background"] else [],
                 "objects": sorted({i["object"] for i in sc["instances"]}),
                 # [§9.11] ottavo campo: il gruppo della mappa (livello "gruppo <nome>" in Tiled)
                 "instances": [[i["object"], i["x"], i["y"], i["scale_x"], i["scale_y"], i["rotation"], 4294967295]
                               + ([i["group"]] if i.get("group") else []) for i in sc["instances"]]}
        with open(os.path.join(OUT, sc["name"] + ".json"), "w", encoding="utf-8", newline="\n") as f:
            json.dump(scene, f, separators=(",", ":"))
        print("%-6s %4d istanze (scenario %s)" % (sc["name"], len(sc["instances"]), os.path.relpath(p, REPO_DIR)))


if __name__ == "__main__":
    main()
