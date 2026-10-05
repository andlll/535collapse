"""Tabelle numeriche estratte dal GML (vita, danni, costi, popolazione).

Lettura *meccanica* di src/: cerca forme precise di istruzioni e le
raccoglie per oggetto. Non interpreta il flusso di controllo: ogni voce
porta il file da cui viene, e va confermata leggendo quel file prima di
usarla nel porting (STUDIO.md, Fase 1).

Scrive data/tables.json:

  create_constants  oggetto -> {variabile: valore} assegnati con un numero
                    letterale nel Create (anche dai parent, marcati)
  damage            proiettile -> [{bersaglio, danno, file}]: "life-=N"
                    dentro gli eventi di collisione
  spawns            oggetto -> [{crea, file}]: instance_create(...) con un
                    oggetto letterale
  resources         oggetto -> [{risorsa, op, valore, file}]: global.R -=/+= N
                    e confronti global.R >= N (requisiti)
  population        oggetto -> [{variabile, op, valore, file}]: global.pop/popcap

Uso:  python3 tools/04_tables.py
"""
import glob
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _paths import DATA_DIR, SRC_DIR, need  # noqa: E402

NUM = r"-?\d+(?:\.\d+)?"
RES = r"(food|wood|gold|stone)"


def strip_comments(s):
    s = re.sub(r"/\*.*?\*/", "", s, flags=re.S)
    return re.sub(r"//[^\n]*", "", s)


def num(v):
    return float(v) if "." in v else int(v)


def rel(path):
    return os.path.relpath(path, SRC_DIR).replace(os.sep, "/")


def main():
    need(os.path.join(DATA_DIR, "objects.json"), "data/objects.json (lancia 02_extract.py)")
    objs = {o["name"]: o for o in json.load(open(os.path.join(DATA_DIR, "objects.json"), encoding="utf-8"))}
    names = set(objs)
    files = {}
    for f in glob.glob(os.path.join(SRC_DIR, "objects", "*", "*.gml")):
        files[f] = strip_comments(open(f, encoding="utf-8").read())

    def ev(obj, name):
        return files.get(os.path.join(SRC_DIR, "objects", obj, name + ".gml"))

    # ---- costanti del Create (anche ereditate: in GMS il Create del parent
    # vale per il figlio solo se il figlio non ne ha uno suo [I]).
    create = {}
    for o in sorted(objs):
        chain, cur = [], o
        while cur in objs and cur not in chain:
            chain.append(cur)
            cur = objs[cur]["parent"]
        src = next((c for c in chain if ev(c, "Create") is not None), None)
        if src is None:
            continue
        vals = {}
        for m in re.finditer(r"^\s*([A-Za-z_]\w*)\s*=\s*(" + NUM + r")\s*;?\s*$", ev(src, "Create"), re.M):
            vals.setdefault(m.group(1), num(m.group(2)))
        if vals:
            create[o] = {"from": src if src != o else None, "values": vals}

    damage, spawns, resources, population = {}, {}, {}, {}
    for path, s in sorted(files.items()):
        obj = os.path.basename(os.path.dirname(path))
        event = os.path.basename(path)[:-4]
        if event.startswith("Collision_"):
            target = event[len("Collision_"):]
            for m in re.finditer(r"\blife\s*-=\s*(" + NUM + r")", s):
                damage.setdefault(obj, []).append({"target": target, "damage": num(m.group(1)),
                                                   "file": rel(path)})
        for m in re.finditer(r"instance_create\s*\([^;\n]*?,\s*([A-Za-z_]\w*)\s*\)", s):
            if m.group(1) in names:
                spawns.setdefault(obj, []).append({"creates": m.group(1), "file": rel(path)})
        for m in re.finditer(r"global\." + RES + r"\s*(-=|\+=)\s*(" + NUM + r")", s):
            resources.setdefault(obj, []).append({"resource": m.group(1), "op": m.group(2),
                                                  "value": num(m.group(3)), "file": rel(path)})
        for m in re.finditer(r"global\." + RES + r"\s*(>=|>|<|<=)\s*(" + NUM + r")", s):
            resources.setdefault(obj, []).append({"resource": m.group(1), "op": m.group(2),
                                                  "value": num(m.group(3)), "file": rel(path)})
        for m in re.finditer(r"global\.(pop|popcap)\s*(-=|\+=|=)\s*(" + NUM + r")", s):
            population.setdefault(obj, []).append({"var": m.group(1), "op": m.group(2),
                                                   "value": num(m.group(3)), "file": rel(path)})

    def dedup(d):
        out = {}
        for k, v in d.items():
            seen, lst = set(), []
            for e in v:
                key = json.dumps(e, sort_keys=True)
                if key not in seen:
                    seen.add(key)
                    lst.append(e)
            out[k] = lst
        return out

    res = {"create_constants": create, "damage": dedup(damage), "spawns": dedup(spawns),
           "resources": dedup(resources), "population": dedup(population)}
    with open(os.path.join(DATA_DIR, "tables.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(res, f, ensure_ascii=False, indent=1, sort_keys=True)
        f.write("\n")
    print("costanti di Create: %d oggetti; danni: %d proiettili; spawn: %d oggetti; "
          "risorse: %d oggetti; popolazione: %d oggetti"
          % (len(create), len(res["damage"]), len(res["spawns"]), len(res["resources"]),
             len(res["population"])))


if __name__ == "__main__":
    main()
