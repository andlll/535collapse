#!/usr/bin/env python3
"""[STUDIO.md §9.137] Gli effetti sonori del gioco, dai file d'origine.

Legge nuovi/audio/audio.json: per ogni suono il file d'origine (in
nuovi/audio/) e i tagli delle varianti (inizio e fine in ms; un terzo
elemento, se c'e', e' un altro file d'origine). Per ogni variante: taglio,
mono, il filtro di pulizia (`filtro`, se c'e'), dissolvenza in entrata e in
uscita, picco portato a
`picco_db` (le varianti dello stesso suono hanno cosi' lo stesso volume; il
volume nel gioco lo da' `gain`), MP3 mono a 96 kbit/s (lo leggono tutti i
browser). Scrive game/assets/audio/<nome>_<n>.mp3 e game/assets/audio/audio.json
(il manifest che legge game/src/audio.js).

Unica dipendenza: ffmpeg (con libmp3lame).

  python3 tools/18_audio.py
"""
import json
import os
import re
import shutil
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _paths import REPO_DIR  # noqa: E402

SRC = os.path.join(REPO_DIR, "nuovi", "audio")
OUT = os.path.join(REPO_DIR, "game", "assets", "audio")


def ffmpeg(*args, capture=False):
    cmd = ["ffmpeg", "-hide_banner", "-nostdin", "-y", *args]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise SystemExit("ffmpeg non riuscito:\n  %s\n%s" % (" ".join(cmd), r.stderr[-2000:]))
    return r.stderr


def peak_db(path):
    """Il picco del file in dBFS (volumedetect)."""
    err = ffmpeg("-i", path, "-af", "volumedetect", "-f", "null", "-")
    m = re.search(r"max_volume:\s*(-?[\d.]+) dB", err)
    return float(m.group(1)) if m else 0.0


def main():
    if not shutil.which("ffmpeg"):
        raise SystemExit("manca ffmpeg (serve per gli effetti sonori)")
    cfg = json.load(open(os.path.join(SRC, "audio.json"), encoding="utf-8"))
    target = cfg.get("picco_db", -3)
    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT):
        if f.endswith(".mp3") or f.endswith(".wav"):
            os.remove(os.path.join(OUT, f))
    manifest = {"sounds": {}}
    total = 0
    for name, s in cfg["suoni"].items():
        fin, fout = s.get("dissolvenza_ms", [2, 60])
        # [§9.139] il filtro di pulizia (ffmpeg -af, p.es. il passa-alto),
        # prima delle dissolvenze
        filt = (s["filtro"] + ",") if s.get("filtro") else ""
        files = []
        for k, cut in enumerate(s["tagli"], 1):
            # [§9.139] un taglio puo' venire da un altro file: [inizio, fine, "file"]
            a, b = cut[0], cut[1]
            src = os.path.join(SRC, cut[2] if len(cut) > 2 else s["da"])
            dur = (b - a) / 1000
            tmp = os.path.join(OUT, "%s_%d.wav" % (name, k))
            mono = "pan=mono|c0=0.5*c0+0.5*c1," if _channels(src) == 2 else ""
            # taglio, mono, filtro, dissolvenze
            ffmpeg("-i", src, "-af",
                   "atrim=start=%.4f:end=%.4f,asetpts=PTS-STARTPTS,%s%s"
                   "afade=t=in:st=0:d=%.4f,afade=t=out:st=%.4f:d=%.4f"
                   % (a / 1000, b / 1000, mono, filt, fin / 1000, dur - fout / 1000, fout / 1000),
                   "-c:a", "pcm_f32le", tmp)
            gain = target - peak_db(tmp)
            out = "%s_%d.mp3" % (name, k)
            # (MP3 arriva a 48 kHz: le registrazioni a 96 si ricampionano)
            ffmpeg("-i", tmp, "-af", "volume=%.2fdB" % gain, "-ac", "1", "-ar", "48000", "-c:a", "libmp3lame", "-b:a", "96k",
                   os.path.join(OUT, out))
            os.remove(tmp)
            size = os.path.getsize(os.path.join(OUT, out))
            total += size
            print("%-14s %4d-%4d ms  %+5.1f dB  %5d byte" % (out, a, b, gain, size))
            files.append(out)
        manifest["sounds"][name] = {"files": files, "gain": s.get("gain", 1)}
        if "altezza" in s:  # [§9.140] +- variazione d'altezza (velocita'); se no quella di audio.js (0,07)
            manifest["sounds"][name]["pitch"] = s["altezza"]
    with open(os.path.join(OUT, "audio.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)
    print("game/assets/audio: %d suoni, %d file, %.1f KB" % (len(manifest["sounds"]),
          sum(len(v["files"]) for v in manifest["sounds"].values()), total / 1024))


def _channels(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a:0", "-show_entries", "stream=channels",
                        "-of", "csv=p=0", path], capture_output=True, text=True)
    try:
        return int(r.stdout.strip())
    except ValueError:
        return 1


if __name__ == "__main__":
    main()
