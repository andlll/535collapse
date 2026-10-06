"""Zip del gioco per i portali (itch.io, Newgrounds, Game Jolt, CrazyGames;
STUDIO.md §0.10) -> build/535-collapse-web.zip (non versionato).

Dentro, alla radice, solo quello che serve al browser: index.html,
manifest.webmanifest, sw.js, icons/, dist/ (bundle, senza le source map)
e assets/ (atlas, maschere, scene). I percorsi del gioco sono tutti
relativi: funziona in qualunque sottocartella e nell'iframe del portale
(verifica: game/test/browser/portal.mjs).

Prima: tools/05-07 (game/assets/) e `npm run build` (game/dist/).
Lo zip e' riproducibile: file in ordine e data fissa.
Uso:  python3 tools/10_zip.py
"""
import os
import sys
import zipfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _paths import REPO_DIR, need  # noqa: E402

GAME = os.path.join(REPO_DIR, "game")
OUT = os.path.join(REPO_DIR, "build", "535-collapse-web.zip")
FILES = ["index.html", "manifest.webmanifest", "sw.js"]
DIRS = ["icons", "dist", "assets"]
DATE = (2025, 1, 25, 0, 0, 0)  # la versione dell'originale, 0.250125


def entries():
    for f in FILES:
        yield f
    for d in DIRS:
        need(os.path.join(GAME, d), "game/%s (vedi l'intestazione di questo file)" % d)
        for root, dirs, files in os.walk(os.path.join(GAME, d)):
            dirs.sort()
            for f in sorted(files):
                if f.endswith(".map"):
                    continue
                yield os.path.relpath(os.path.join(root, f), GAME).replace(os.sep, "/")


def main():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    n = size = 0
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for rel in entries():
            data = open(os.path.join(GAME, rel), "rb").read()
            info = zipfile.ZipInfo(rel, DATE)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            z.writestr(info, data)
            n += 1
            size += len(data)
    print("%s: %d file, %.1f MB (%.1f MB compresso)" % (os.path.relpath(OUT, REPO_DIR), n, size / 1e6,
                                                         os.path.getsize(OUT) / 1e6))


if __name__ == "__main__":
    main()
