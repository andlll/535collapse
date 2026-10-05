"""Percorsi condivisi dai tool. Niente cartelle locali cablate nel codice.

  REPO_DIR  la radice del repo (dedotta da questo file).
  GMX_DIR   il progetto GameMaker ricomposto dagli zip (tools/01_unpack.py).
            Non e' versionato: si rigenera dagli zip, che invece lo sono e
            restano la fonte immutabile. Si sposta con la variabile GMX_DIR.
  DATA_DIR  i metadati estratti in JSON (versionati).
  SRC_DIR   il codice GML leggibile, un file per evento (versionato).
"""
import os

REPO_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOOLS = os.path.join(REPO_DIR, "tools")
GMX_DIR = os.environ.get("GMX_DIR", os.path.join(REPO_DIR, "gmx"))
DATA_DIR = os.path.join(REPO_DIR, "data")
SRC_DIR = os.path.join(REPO_DIR, "src")


def need(path, what):
    """Errore chiaro invece di uno stack trace incomprensibile."""
    if not os.path.exists(path):
        raise SystemExit(
            "manca %s:\n  %s\n\n"
            "Ricomponi prima il progetto dagli zip:\n"
            "  python3 tools/01_unpack.py\n" % (what, path))
    return path
