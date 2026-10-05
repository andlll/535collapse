"""Room -> formato del motore (game/assets/rooms/<room>.json, non versionato).

Per ogni istanza della room risolve quello che serve a disegnarla subito,
prima che giri qualunque logica:

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
  reveal   true se l'oggetto parte invisibile e il suo Step lo rende
           visibile (alberi, rovine, pietre: si rivelano quando un'unita'
           li vede, STUDIO.md §2.5) — l'anteprima senza nebbia li mostra

Room portate (decisione dell'autore, STUDIO.md §0.15): menu, match, lvl01,
lvl02. Escluse test_ground, resizer, mobile e lvl03 (vuota).

Uso:  python3 tools/07_scene.py
"""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _paths import DATA_DIR, REPO_DIR, SRC_DIR, need  # noqa: E402

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
        entry = {"sprite": o["sprite"], "visible": o["visible"],
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

    os.makedirs(OUT, exist_ok=True)
    for room in ROOMS:
        r = json.load(open(os.path.join(DATA_DIR, "rooms", room + ".json"), encoding="utf-8"))
        used = sorted({i["object"] for i in r["instances"]})
        scene = {"name": room, "width": r["width"], "height": r["height"], "speed": r["speed"],
                 "colour": r["colour"], "views": r["views"],
                 "backgrounds": [b for b in r["backgrounds"] if b["visible"] and b["name"]],
                 "objects": {n: info[n] for n in used},
                 "instances": [[i["object"], i["x"], i["y"], i["scale_x"], i["scale_y"],
                                i["rotation"], i["colour"]] for i in r["instances"]]}
        with open(os.path.join(OUT, room + ".json"), "w", encoding="utf-8", newline="\n") as f:
            json.dump(scene, f, separators=(",", ":"))
        drawn = sum(1 for i in r["instances"] if info[i["object"]]["draw"]
                    and (info[i["object"]]["visible"] or info[i["object"]].get("reveal"))
                    and (info[i["object"]]["sprite"] or info[i["object"]].get("choices")))
        print("%-6s %4d istanze, %4d disegnate dallo sprite, %3d oggetti diversi"
              % (room, len(r["instances"]), drawn, len(used)))


if __name__ == "__main__":
    main()
