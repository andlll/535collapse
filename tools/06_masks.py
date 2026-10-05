"""Maschere di collisione degli sprite, dai PNG originali (non dall'atlas).

Per ogni sprite: tipo di maschera (colkind: 0 precisa, 1 rettangolo,
2 ellisse, 3 rombo) e bbox in coordinate dello sprite. Per le maschere
precise anche la bitmap, alla risoluzione ORIGINALE anche se la texture e'
scalata (il terreno e' a 0,5 nell'atlas, la collisione resta esatta).

Regola GMS 1.x [I]: un pixel e' pieno se alpha > coltolerance; con
"maschere separate" (sepmasks) ogni frame ha la sua, altrimenti si usa
l'unione di tutti i frame. bboxmode 0 (automatico) = rettangolo dei pixel
pieni; 1 = immagine intera; 2 = manuale (i valori del GMX).

Controllo: per bboxmode 0 il bbox salvato nel GMX deve coincidere con quello
ricalcolato qui; le differenze vengono stampate.

Formato bitmap: righe del bbox codificate come intervalli pieni
[[inizio, fine), ...] per riga (RLE), in coordinate dello sprite.

Scrive game/assets/masks.json (non versionato).
Uso:  python3 tools/06_masks.py
"""
import json
import os
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _paths import DATA_DIR, GMX_DIR, REPO_DIR, need  # noqa: E402

OUT = os.path.join(REPO_DIR, "game", "assets", "masks.json")


def solid(img, tol):
    a = img.convert("RGBA").getchannel("A")
    return a.point(lambda v: 255 if v > tol else 0)


def rle(mask, bbox):
    l, t, r, b = bbox
    w = r - l + 1
    px = mask.crop((l, t, r + 1, b + 1)).tobytes()
    rows = []
    for y in range(b - t + 1):
        row, runs, x = px[y * w:(y + 1) * w], [], 0
        while x < w:
            if row[x]:
                s = x
                while x < w and row[x]:
                    x += 1
                runs += [s + l, x + l]
            else:
                x += 1
        rows.append(runs)
    return rows


def main():
    need(os.path.join(DATA_DIR, "sprites.json"), "data/sprites.json (lancia 02_extract.py)")
    sprites = json.load(open(os.path.join(DATA_DIR, "sprites.json"), encoding="utf-8"))
    out, mismatches = {}, []
    for s in sprites:
        frames = [Image.open(os.path.join(GMX_DIR, "sprites", "images", f)) for f in s["frames"]]
        masks = [solid(f, s["coltolerance"]) for f in frames]
        if not s["sepmasks"] and len(masks) > 1:
            u = masks[0]
            for m in masks[1:]:
                u = Image.composite(m, u, m)
            masks = [u]
        auto = None
        for m in masks:
            bb = m.getbbox()
            if bb:
                auto = bb if auto is None else (min(auto[0], bb[0]), min(auto[1], bb[1]),
                                                max(auto[2], bb[2]), max(auto[3], bb[3]))
        auto = [auto[0], auto[1], auto[2] - 1, auto[3] - 1] if auto else [0, 0, 0, 0]
        if s["bboxmode"] == 0:
            if auto != s["bbox"]:
                mismatches.append((s["name"], s["bbox"], auto))
            bbox = s["bbox"]  # quello del GMX fa fede: e' cio' che usava il gioco
        elif s["bboxmode"] == 1:
            bbox = [0, 0, s["width"] - 1, s["height"] - 1]
        else:
            bbox = s["bbox"]
        e = {"kind": s["colkind"], "bbox": bbox, "origin": [s["origin_x"], s["origin_y"]],
             "size": [s["width"], s["height"]]}
        if s["colkind"] == 0:
            e["sepmasks"] = s["sepmasks"]
            e["frames"] = [rle(m, bbox) for m in masks]
        out[s["name"]] = e
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        json.dump({"version": 1, "sprites": out}, f, separators=(",", ":"))
    prec = sum(1 for e in out.values() if e["kind"] == 0)
    print("maschere: %d sprite, %d precise; masks.json %.1f MB"
          % (len(out), prec, os.path.getsize(OUT) / 1e6))
    print("bbox automatici diversi dal GMX: %d" % len(mismatches))
    for m in mismatches[:15]:
        print("  %s  gmx=%s  ricalcolato=%s" % m)


if __name__ == "__main__":
    main()
