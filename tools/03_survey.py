"""Censimento del progetto: i numeri di STUDIO.md, rifatti dai dati estratti.

Legge data/ e src/ (prodotti da 02_extract.py) e gmx/ per i PNG, e stampa:
risorse, eventi, uso delle funzioni GML, variabili globali, memoria texture
(decodificata, larghezza x altezza x 4) e peso dei PNG. Scrive anche
data/functions.json (funzioni chiamate e quante volte).

Controllo di coerenza: rilegge gli XML degli oggetti e verifica che ogni
blocco di codice sia finito, identico, in src/objects/.

Uso:  python3 tools/03_survey.py [--png]   (--png misura anche l'alpha dei frame, lento)
"""
import collections
import glob
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _paths import DATA_DIR, GMX_DIR, SRC_DIR, need  # noqa: E402
from gmx import event_name, load  # noqa: E402

KEYWORDS = {"if", "while", "for", "with", "repeat", "switch", "return", "until",
            "and", "or", "not", "do", "case", "exit", "var", "else"}


def j(name):
    with open(os.path.join(DATA_DIR, name), encoding="utf-8") as f:
        return json.load(f)


def strip_gml(s):
    s = re.sub(r"/\*.*?\*/", "", s, flags=re.S)
    s = re.sub(r"//[^\n]*", "", s)
    return re.sub(r'"[^"\n]*"|\'[^\'\n]*\'', '""', s)


def main():
    need(os.path.join(DATA_DIR, "objects.json"), "data/objects.json (lancia 02_extract.py)")
    spr, objs, proj = j("sprites.json"), j("objects.json"), j("project.json")
    rooms = [json.load(open(f, encoding="utf-8"))
             for f in sorted(glob.glob(os.path.join(DATA_DIR, "rooms", "*.json")))]

    # ---- coerenza src/ <-> gmx/
    missing = 0
    for f in glob.glob(os.path.join(GMX_DIR, "objects", "*.object.gmx")):
        name = os.path.basename(f)[:-len(".object.gmx")]
        for ev in load(f).find("events"):
            path = os.path.join(SRC_DIR, "objects", name,
                                event_name(ev.get("eventtype"), ev.get("enumb"), ev.get("ename")) + ".gml")
            body = open(path, encoding="utf-8").read()
            for a in ev.findall("action"):
                if a.findtext("id") == "603":
                    code = (a.find("arguments/argument/string").text or "").rstrip("\n")
                    lines = [ln.strip() for ln in code.split("\n") if ln.strip()]
                    if any(ln not in body for ln in lines):
                        missing += 1
    print("coerenza: blocchi di codice non ritrovati in src/: %d" % missing)

    # ---- risorse
    frames = sum(len(s["frames"]) for s in spr)
    print("\nrisorse: oggetti %d, sprite %d (frame %d), room %d, script %d, font %d, "
          "path %d, background %d, suoni %d, shader %d, timeline %d"
          % (len(objs), len(spr), frames, len(rooms),
             len(glob.glob(os.path.join(SRC_DIR, "scripts", "*.gml"))),
             len(j("fonts.json")), len(j("paths.json")), len(j("backgrounds.json")),
             len(proj["sounds"]), len(proj["shaders"]), len(proj["timelines"])))
    print("ordine delle room (la prima e' quella di avvio):", ", ".join(proj["room_order"]))
    ck = collections.Counter(s["colkind"] for s in spr)
    print("maschere sprite: rettangolo %d, precise %d, ellisse %d, rombo %d"
          % (ck[1], ck[0], ck[2], ck[3]))
    for r in rooms:
        v = r["views"][0] if r["views"] else None
        print("  room %-12s %5dx%-5d speed %d  istanze %4d  view %s"
              % (r["name"], r["width"], r["height"], r["speed"], len(r["instances"]),
                 "%dx%d segue %s" % (v["wview"], v["hview"], v["follow"]) if v else "-"))

    # ---- eventi e codice
    evc = collections.Counter(e["file"][:-4] if not e["file"].startswith("Collision")
                              else "Collision_*" for o in objs for e in o["events"])
    code_actions = sum(e["code_actions"] for o in objs for e in o["events"])
    dnd = collections.Counter(d for o in objs for e in o["events"] for d in e["dnd"])
    srcs = [open(f, encoding="utf-8").read()
            for f in glob.glob(os.path.join(SRC_DIR, "**", "*.gml"), recursive=True)]
    print("\ncodice: %d azioni execute code, %d drag&drop %s"
          % (code_actions, sum(dnd.values()), dict(dnd)))
    print("eventi piu' frequenti:", ", ".join("%s %d" % kv for kv in evc.most_common(25)))

    allcode = strip_gml("\n".join(srcs))
    scripts = {os.path.basename(f)[:-4] for f in glob.glob(os.path.join(SRC_DIR, "scripts", "*.gml"))}
    calls = collections.Counter(c for c in re.findall(r"\b([A-Za-z_]\w*)\s*\(", allcode)
                                if c not in KEYWORDS and not c.startswith("action_"))
    gm = {k: v for k, v in calls.items() if k not in scripts}
    with open(os.path.join(DATA_DIR, "functions.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump({"gamemaker": dict(sorted(gm.items(), key=lambda kv: -kv[1])),
                   "scripts": {k: calls[k] for k in sorted(scripts)}}, f, indent=1)
        f.write("\n")
    print("funzioni GameMaker distinte: %d (elenco in data/functions.json)" % len(gm))
    glob_vars = collections.Counter(re.findall(r"global\.(\w+)", allcode))
    print("variabili globali: %d" % len(glob_vars))

    # ---- asset
    disk = full = 0
    for s in spr:
        for fr in s["frames"]:
            disk += os.path.getsize(os.path.join(GMX_DIR, "sprites", "images", fr))
        full += s["width"] * s["height"] * 4 * len(s["frames"])
    print("\nPNG su disco %.1f MB, memoria texture a tela intera %.0f MB" % (disk / 1e6, full / 1e6))
    if "--png" in sys.argv:
        from PIL import Image
        trim = 0
        for s in spr:
            for fr in s["frames"]:
                im = Image.open(os.path.join(GMX_DIR, "sprites", "images", fr)).convert("RGBA")
                bb = im.getchannel("A").getbbox()
                if bb:
                    trim += (bb[2] - bb[0]) * (bb[3] - bb[1]) * 4
        print("memoria texture ritagliata sull'alpha %.0f MB" % (trim / 1e6))


if __name__ == "__main__":
    main()
