"""Estrae dal progetto GMX ricomposto (gmx/) i dati e il codice leggibile.

Scrive (tutto versionato, si rigenera con questo tool):

  data/project.json      albero delle risorse, ordine delle room, opzioni
  data/sprites.json      sprite: dimensioni, origine, maschera, bbox, frame
  data/objects.json      oggetti: sprite, maschera, parent, depth, eventi
  data/backgrounds.json  sfondi
  data/fonts.json        font con la tabella dei glifi
  data/paths.json        path
  data/rooms/<room>.json room: view, sfondi, istanze in ordine di creazione
  src/objects/<oggetto>/<Evento>.gml   un file per evento (GML + drag&drop)
  src/scripts/<script>.gml             gli script, copiati cosi' come sono

Uso:  python3 tools/02_extract.py
"""
import glob
import json
import os
import shutil
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _paths import DATA_DIR, GMX_DIR, SRC_DIR, need  # noqa: E402
from gmx import event_name, load, num, render_actions, text  # noqa: E402

UNDEF = (None, "", "<undefined>")


def opt(v):
    return None if v in UNDEF else v


def dump(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)
        f.write("\n")


def write_text(path, s):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(s)


def leaf(path_text):
    return path_text.replace("\\", "/").split("/")[-1]


# ------------------------------------------------------------------ progetto

def tree(el):
    """Albero delle cartelle dell'editor: {nome cartella: [...], ...}."""
    out = []
    for c in el:
        if len(c) or c.get("name") is not None:
            out.append({"folder": c.get("name"), "items": tree(c)})
        elif c.text:
            out.append(leaf(c.text))
    return out


def folders_of(el, kind, path=()):
    """nome risorsa -> percorso di cartelle sotto la radice (p.es. "ariete/walk")."""
    res = {}
    for c in el:
        if c.tag == kind + "s" and c.get("name") is not None:
            res.update(folders_of(c, kind, path + (c.get("name"),)))
        elif c.tag == kind and c.text:
            res[leaf(c.text)] = "/".join(path)
    return res


def project():
    proj_path = need((glob.glob(os.path.join(GMX_DIR, "*.project.gmx")) or [None])[0] or
                     os.path.join(GMX_DIR, "*.project.gmx"), "il file .project.gmx")
    p = load(proj_path)
    res = {"file": os.path.basename(proj_path)}
    for kind in ("sprite", "background", "object", "room", "script", "font", "path",
                 "sound", "timeline", "shader"):
        root = p.find(kind + "s")
        res[kind + "s"] = tree(root) if root is not None else []
    res["room_order"] = [leaf(e.text) for e in p.iter("room") if e.text]
    res["extensions"] = [leaf(e.text) for e in p.iter("extension") if e.text]
    res["constants"] = {c.get("name"): c.text for c in p.iter("constant")}
    res["datafiles"] = [e.text for e in p.iter("datafile") if e.text]
    cfg = os.path.join(GMX_DIR, "Configs", "Default.config.gmx")
    if os.path.exists(cfg):
        c = load(cfg)
        keep = ("option_html5_browser_title", "option_html5_texture_page",
                "option_html5_usebuiltinparticles", "option_html5_allow_fullscreen",
                "option_interpolate", "option_scale", "option_windows_texture_page")
        res["config"] = {k: text(c, ".//" + k) for k in keep if c.find(".//" + k) is not None}
    return p, res


# ------------------------------------------------------------------ risorse

def sprites(folders):
    out = []
    for f in sorted(glob.glob(os.path.join(GMX_DIR, "sprites", "*.sprite.gmx"))):
        r = load(f)
        name = os.path.basename(f)[:-len(".sprite.gmx")]
        tg = r.find("TextureGroups")
        out.append({
            "name": name,
            "folder": folders.get(name, ""),
            "width": num(text(r, "width")), "height": num(text(r, "height")),
            "origin_x": num(text(r, "xorig")), "origin_y": num(text(r, "yorigin")),
            # colkind: 0 precisa, 1 rettangolo, 2 ellisse, 3 rombo
            "colkind": num(text(r, "colkind")),
            "coltolerance": num(text(r, "coltolerance")),
            "sepmasks": text(r, "sepmasks") == "-1",
            # bboxmode: 0 automatico, 1 immagine intera, 2 manuale
            "bboxmode": num(text(r, "bboxmode")),
            "bbox": [num(text(r, "bbox_left")), num(text(r, "bbox_top")),
                     num(text(r, "bbox_right")), num(text(r, "bbox_bottom"))],
            "texture_group": num(tg[0].text) if tg is not None and len(tg) else 0,
            "frames": [leaf(e.text) for e in r.iter("frame")],
        })
    return out


def backgrounds(folders):
    out = []
    for f in sorted(glob.glob(os.path.join(GMX_DIR, "background", "*.background.gmx"))):
        r = load(f)
        name = os.path.basename(f)[:-len(".background.gmx")]
        out.append({"name": name, "folder": folders.get(name, ""),
                    "width": num(text(r, "width")), "height": num(text(r, "height")),
                    "tileset": text(r, "istileset") == "-1",
                    "htile": text(r, "HTile") == "-1", "vtile": text(r, "VTile") == "-1",
                    "image": leaf(text(r, "data", ""))})
    return out


def fonts():
    out = []
    for f in sorted(glob.glob(os.path.join(GMX_DIR, "fonts", "*.font.gmx"))):
        r = load(f)
        name = os.path.basename(f)[:-len(".font.gmx")]
        out.append({
            "name": name, "family": text(r, "name"), "size": num(text(r, "size")),
            "bold": text(r, "bold") == "-1", "italic": text(r, "italic") == "-1",
            "antialias": num(text(r, "aa")),
            "ranges": [e.text for e in r.find("ranges")] if r.find("ranges") is not None else [],
            "image": name + ".png",
            "glyphs": [{k: num(v) for k, v in g.attrib.items()} for g in r.iter("glyph")],
        })
    return out


def paths():
    out = []
    for f in sorted(glob.glob(os.path.join(GMX_DIR, "paths", "*.path.gmx"))):
        r = load(f)
        out.append({"name": os.path.basename(f)[:-len(".path.gmx")],
                    "kind": num(text(r, "kind")), "closed": text(r, "closed") == "-1",
                    "precision": num(text(r, "precision")),
                    "points": [[num(x) for x in p.text.split(",")] for p in r.iter("point")]})
    return out


def objects(folders):
    data = []
    shutil.rmtree(os.path.join(SRC_DIR, "objects"), ignore_errors=True)
    for f in sorted(glob.glob(os.path.join(GMX_DIR, "objects", "*.object.gmx"))):
        r = load(f)
        name = os.path.basename(f)[:-len(".object.gmx")]
        o = {"name": name, "folder": folders.get(name, ""),
             "sprite": opt(text(r, "spriteName")), "mask": opt(text(r, "maskName")),
             "parent": opt(text(r, "parentName")),
             "depth": num(text(r, "depth")), "solid": text(r, "solid") == "-1",
             "visible": text(r, "visible") == "-1", "persistent": text(r, "persistent") == "-1",
             "physics": text(r, "PhysicsObject") == "-1", "events": []}
        for ev in r.find("events"):
            et, en, ename = ev.get("eventtype"), ev.get("enumb"), ev.get("ename")
            fname = event_name(et, en, ename)
            body, acts = render_actions(ev.findall("action"))
            head = ("// %s — %s (eventtype=%s%s)\n// Estratto da gmx/objects/%s.object.gmx "
                    "con tools/02_extract.py: non modificare a mano.\n\n"
                    % (name, fname, et, (" enumb=" + en) if en is not None else
                       (" ename=" + ename if ename else ""), name))
            write_text(os.path.join(SRC_DIR, "objects", name, fname + ".gml"), head + body)
            o["events"].append({
                "file": fname + ".gml", "type": int(et),
                "number": int(en) if en not in (None, "") else None, "with": ename,
                "actions": len(acts),
                "code_actions": sum(1 for a in acts if a["id"] == "603"),
                "dnd": [a["function"] or a["id"] for a in acts if a["id"] != "603"],
            })
        data.append(o)
    return data


def scripts():
    shutil.rmtree(os.path.join(SRC_DIR, "scripts"), ignore_errors=True)
    names = []
    for f in sorted(glob.glob(os.path.join(GMX_DIR, "scripts", "**", "*.gml"), recursive=True)):
        name = os.path.basename(f)
        names.append(name[:-4])
        os.makedirs(os.path.join(SRC_DIR, "scripts"), exist_ok=True)
        with open(f, encoding="utf-8", errors="replace") as fi:
            write_text(os.path.join(SRC_DIR, "scripts", name), fi.read())
    return names


def rooms():
    shutil.rmtree(os.path.join(DATA_DIR, "rooms"), ignore_errors=True)
    names = []
    for f in sorted(glob.glob(os.path.join(GMX_DIR, "rooms", "*.room.gmx"))):
        r = load(f)
        name = os.path.basename(f)[:-len(".room.gmx")]
        names.append(name)
        room = {
            "name": name, "caption": text(r, "caption", ""),
            "width": num(text(r, "width")), "height": num(text(r, "height")),
            "speed": num(text(r, "speed")), "persistent": text(r, "persistent") == "-1",
            # colori GameMaker: interi BGR (0xBBGGRR)
            "colour": num(text(r, "colour")), "show_colour": text(r, "showcolour") == "-1",
            "creation_code": text(r, "code", ""),
            "views_enabled": text(r, "enableViews") == "-1",
            "clear_view_background": text(r, "clearViewBackground") == "-1",
            "backgrounds": [], "views": [], "instances": [], "tiles": [],
            "physics_world": text(r, "PhysicsWorld") == "-1",
        }
        for b in r.findall("backgrounds/background"):
            if b.get("visible") == "-1" or b.get("name"):
                room["backgrounds"].append({
                    "name": opt(b.get("name")), "visible": b.get("visible") == "-1",
                    "foreground": b.get("foreground") == "-1",
                    "x": num(b.get("x")), "y": num(b.get("y")),
                    "htiled": b.get("htiled") == "-1", "vtiled": b.get("vtiled") == "-1",
                    "hspeed": num(b.get("hspeed")), "vspeed": num(b.get("vspeed")),
                    "stretch": b.get("stretch") == "-1"})
        for i, v in enumerate(r.findall("views/view")):
            if v.get("visible") == "-1":
                room["views"].append({
                    "index": i, "follow": opt(v.get("objName")),
                    **{k: num(v.get(k)) for k in ("xview", "yview", "wview", "hview", "xport",
                                                   "yport", "wport", "hport", "hborder",
                                                   "vborder", "hspeed", "vspeed")}})
        # Ordine del file = ordine di creazione delle istanze [I].
        for inst in r.findall("instances/instance"):
            room["instances"].append({
                "object": inst.get("objName"), "x": num(inst.get("x")), "y": num(inst.get("y")),
                "name": inst.get("name"), "scale_x": num(inst.get("scaleX")),
                "scale_y": num(inst.get("scaleY")), "rotation": num(inst.get("rotation")),
                # colour: ARGB a 32 bit, 4294967295 = bianco opaco (nessuna tinta)
                "colour": num(inst.get("colour")), "code": inst.get("code") or ""})
        for t in r.findall("tiles/tile"):
            room["tiles"].append({k: num(v) for k, v in t.attrib.items()})
        dump(os.path.join(DATA_DIR, "rooms", name + ".json"), room)
    return names


def main():
    need(GMX_DIR, "la cartella gmx/")
    p, proj = project()
    folders = {}
    for kind in ("sprite", "background", "object"):
        root = p.find(kind + "s")
        if root is not None:
            folders.update(folders_of(root, kind))
    spr = sprites(folders)
    objs = objects(folders)
    scr = scripts()
    rms = rooms()
    dump(os.path.join(DATA_DIR, "project.json"), proj)
    dump(os.path.join(DATA_DIR, "sprites.json"), spr)
    dump(os.path.join(DATA_DIR, "objects.json"), objs)
    dump(os.path.join(DATA_DIR, "backgrounds.json"), backgrounds(folders))
    dump(os.path.join(DATA_DIR, "fonts.json"), fonts())
    dump(os.path.join(DATA_DIR, "paths.json"), paths())
    print("sprite %d, oggetti %d (eventi %d), script %d, room %d"
          % (len(spr), len(objs), sum(len(o["events"]) for o in objs), len(scr), len(rms)))


if __name__ == "__main__":
    main()
