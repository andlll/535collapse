"""Ricompone il progetto GMS 1.x dagli zip alla radice del repo.

L'autore ha caricato il progetto come zip divisi per cartella (il caricamento
web di GitHub non accetta cartelle cosi' grandi). Qui si rimette tutto nella
struttura standard di GameMaker: Studio 1.x dentro gmx/ (non versionata):

  gmx/<nome>.project.gmx
  gmx/sprites/<nome>.sprite.gmx        <- "sprites no img.zip"
  gmx/sprites/images/<nome>_<n>.png    <- "sprites 1.zip" .. "sprites N.zip"
  gmx/objects/, rooms/, scripts/, background/, fonts/, paths/,
  gmx/extensions/, gmx/Configs/        <- gli zip omonimi, cosi' come sono

Alla fine controlla che ogni frame citato da un .sprite.gmx esista.
Uso:  python3 tools/01_unpack.py
"""
import glob
import os
import re
import shutil
import sys
import xml.etree.ElementTree as ET
import zipfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _paths import GMX_DIR, REPO_DIR  # noqa: E402


def dest_for(zip_name, member):
    """Percorso dentro gmx/ per un membro di uno zip, o None per saltarlo."""
    if member.endswith("/"):
        return None
    base = os.path.basename(member)
    if zip_name == "sprites no img":
        return os.path.join("sprites", base) if base.endswith(".sprite.gmx") else None
    if re.fullmatch(r"sprites \d+", zip_name):
        return os.path.join("sprites", "images", base) if base.endswith(".png") else None
    # Gli altri zip contengono gia' la loro cartella (objects/, rooms/, ...).
    return member


def main():
    zips = sorted(glob.glob(os.path.join(REPO_DIR, "*.zip")))
    projects = glob.glob(os.path.join(REPO_DIR, "*.project.gmx"))
    if not zips or len(projects) != 1:
        raise SystemExit("servono gli zip e un solo .project.gmx alla radice del repo")
    if os.path.isdir(GMX_DIR):
        shutil.rmtree(GMX_DIR)
    os.makedirs(GMX_DIR)
    shutil.copy(projects[0], GMX_DIR)
    for src in (os.path.join(REPO_DIR, "help.rtf"),):
        if os.path.exists(src):
            shutil.copy(src, GMX_DIR)

    written = 0
    for zp in zips:
        name = os.path.splitext(os.path.basename(zp))[0]
        with zipfile.ZipFile(zp) as z:
            for m in z.namelist():
                d = dest_for(name, m)
                if d is None:
                    continue
                out = os.path.join(GMX_DIR, d)
                if os.path.exists(out):
                    raise SystemExit("file duplicato fra gli zip: %s (%s)" % (d, name))
                os.makedirs(os.path.dirname(out), exist_ok=True)
                with z.open(m) as fi, open(out, "wb") as fo:
                    shutil.copyfileobj(fi, fo)
                written += 1

    # Verifica: ogni frame citato esiste.
    missing = []
    sprites = glob.glob(os.path.join(GMX_DIR, "sprites", "*.sprite.gmx"))
    for sp in sprites:
        for fr in ET.parse(sp).getroot().iter("frame"):
            p = os.path.join(GMX_DIR, "sprites", fr.text.replace("\\", "/"))
            if not os.path.exists(p):
                missing.append(p)
    print("ricomposto in %s: %d file, %d sprite, %d frame mancanti"
          % (GMX_DIR, written, len(sprites), len(missing)))
    for p in missing[:20]:
        print("  manca", p)
    if missing:
        sys.exit(1)


if __name__ == "__main__":
    main()
