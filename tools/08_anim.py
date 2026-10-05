"""Animazioni delle unita': blocco "Assegnazione sprite" -> funzioni JS.

Ogni unita' sceglie a ogni Step lo sprite da mostrare con una cascata di if
su `action`, `phase` (direzione in 8 settori) e `step` (fotogramma), un
fotogramma = uno sprite [C, p.es. src/objects/ally_warrior/Step.gml azione 3].
Sono ~3600 righe ripetute (STUDIO.md §0.3): qui si traducono in modo
meccanico, cosi' restano identiche all'originale per tutte le unita'.

Il traduttore accetta SOLO il sottoinsieme che compare in quei blocchi:
`if COND STMT [else STMT]`, blocchi `{ }`, `sprite_index = NOME`; COND e'
`variabile_d_istanza OP numero` legati da && / || (and / or). Qualunque altra cosa
ferma il tool con un errore: meglio fermarsi che tradurre male.

Unica eccezione riconosciuta per intero: in guerriero, picchiere e
cavaliere (alleati e nemici) il blocco contiene anche "girati verso il
bersaglio quando attacchi" [C]:
  if action=2 && instance_exists(X) {var v=instance_nearest(PUNTO, X)
      direction=point_direction(x,y,v.x,v.y)}
con PUNTO = 30 px davanti (alleati, il "versore") o la posizione stessa
(nemici). Diventa w.faceAhead(i, X) / w.faceNearest(i, X).

Scrive game/src/animTables.js (versionato, generato: non modificare a mano).
Uso:  python3 tools/08_anim.py
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _paths import REPO_DIR, SRC_DIR  # noqa: E402

UNITS = ["ally_warrior", "ally_picchiere", "ally_arciere", "ally_cavaliere", "ally_omino",
         "ally_catapulta", "ally_ariete", "enemy_warrior", "enemy_picchiere", "enemy_arciere",
         "enemy_cavaliere", "enemy_catapulta", "enemy_ariete",
         # cadaveri: animazione di morte (Step azione 1, "//assegnazione sprite//")
         "warrior_corpse", "picchiere_corpse", "arciere_corpse", "cavaliere_corpse", "omino_corpse",
         "catapulta_corpse", "ariete_corpse", "enemy_warrior_corpse", "enemy_picchiere_corpse",
         "enemy_arciere_corpse", "enemy_cavaliere_corpse", "enemy_catapulta_corpse", "enemy_ariete_corpse"]
OUT = os.path.join(REPO_DIR, "game", "src", "animTables.js")
TOKEN = re.compile(r"\s*(?:(\d+(?:\.\d+)?)|([A-Za-z_]\w*)|(==|!=|<=|>=|&&|\|\||[=<>{}()]))")
HOOK = re.compile(r"__(faceAhead|faceNearest)__(\w+)$")


FACE = [
    (re.compile(r"if action=2 && instance_exists\((\w+)\)\s*\{var (\w+)=instance_nearest\("
                r"x\+30\*cos\(degtorad\(direction\)\),y-30\*sin\(degtorad\(direction\)\),(\w+)\)\s*"
                r"direction=point_direction\(x,y,\2\.x,\2\.y\)\}"), "faceAhead"),
    (re.compile(r"if action=2 && instance_exists\((\w+)\)\s*\{var (\w+)=instance_nearest\(x,y,(\w+)\)\s*"
                r"direction=point_direction\(x,y,\2\.x,\2\.y\)\}"), "faceNearest"),
]


def tokenize(src):
    src = re.sub(r"//[^\n]*", "", src)
    for rx, fn in FACE:
        src = rx.sub(lambda m: " __%s__%s " % (fn, m.group(3)) if m.group(1) == m.group(3)
                     else m.group(0), src)
    toks, pos = [], 0
    while pos < len(src):
        if src[pos:].strip() == "":
            break
        m = TOKEN.match(src, pos)
        if not m:
            raise SystemExit("carattere inatteso: %r" % src[pos:pos + 30])
        toks.append(m.group(1) or m.group(2) or m.group(3))
        pos = m.end()
    return toks


class Parser:
    def __init__(self, toks, unit):
        self.t, self.i, self.unit = toks, 0, unit
        self.vars = set()

    def peek(self):
        return self.t[self.i] if self.i < len(self.t) else None

    def take(self, expect=None):
        tok = self.peek()
        if expect is not None and tok != expect:
            raise SystemExit("%s: atteso %r, trovato %r (token %d)" % (self.unit, expect, tok, self.i))
        self.i += 1
        return tok

    def cond(self):
        parts = [self.atom()]
        while self.peek() in ("&&", "||", "and", "or"):
            op = self.take()
            parts.append("&&" if op in ("&&", "and") else "||")
            parts.append(self.atom())
        return " ".join(parts)

    def atom(self):
        if self.peek() == "(":
            self.take("(")
            c = self.cond()
            self.take(")")
            return "(" + c + ")"
        var = self.take()
        if not re.fullmatch(r"[a-z_]\w*", var or "") or var in ("if", "else", "global", "var"):
            raise SystemExit("%s: variabile inattesa nella condizione: %r" % (self.unit, var))
        self.vars.add(var)
        op = self.take()
        if op not in ("=", "==", "!=", "<", ">", "<=", ">="):
            raise SystemExit("%s: operatore inatteso %r" % (self.unit, op))
        num = self.take()
        jsop = "===" if op in ("=", "==") else ("!==" if op == "!=" else op)
        if var == "sprite_index" and op in ("=", "==", "!=") and re.fullmatch(r"[A-Za-z_]\w*", num):
            return 'i.sprite_index %s "%s"' % (jsop, num)  # civile: "if sprite_index!=ow41"
        if not re.fullmatch(r"\d+(\.\d+)?", num):
            raise SystemExit("%s: numero atteso, trovato %r" % (self.unit, num))
        return "i.%s %s %s" % (var, jsop, num)

    def stmt(self, ind):
        tok = self.peek()
        pad = "  " * ind
        if tok == "{":
            self.take("{")
            body = []
            while self.peek() != "}":
                body.append(self.stmt(ind))
            self.take("}")
            return "\n".join(body)
        if tok == "if":
            self.take("if")
            c = self.cond()
            out = "%sif (%s) {\n%s\n%s}" % (pad, c, self.stmt(ind + 1), pad)
            if self.peek() == "else":
                self.take("else")
                out += " else {\n%s\n%s}" % (self.stmt(ind + 1), pad)
            return out
        m = HOOK.match(tok or "")
        if m:
            self.take()
            return '%sif (i.action === 2 && w.exists("%s")) w.%s(i, "%s");' % (pad, m.group(2), m.group(1), m.group(2))
        if tok == "sprite_index":
            self.take()
            self.take("=")
            name = self.take()
            return '%si.sprite_index = "%s";' % (pad, name)
        raise SystemExit("%s: istruzione non prevista %r (token %d)" % (self.unit, tok, self.i))


def block(unit):
    src = open(os.path.join(SRC_DIR, "objects", unit, "Step.gml"), encoding="utf-8").read()
    m = re.search(r"(//+\s*[Aa]ssegnazione sprite.*?)(?=// --- azione|\Z)", src, re.S)
    if not m:
        return None
    return m.group(1)


def main():
    out = ["// Generato da tools/08_anim.py dal blocco \"Assegnazione sprite\" dello",
           "// Step di ogni unita' (src/objects/<unita'>/Step.gml): non modificare a mano.",
           "// Ogni funzione imposta i.sprite_index da action, phase e step, con la",
           "// stessa cascata di if dell'originale (l'ultima assegnazione vera vince).",
           "// w: il mondo (per \"girati verso il bersaglio\", vedi tools/08_anim.py).",
           "", "export const ANIM = {"]
    for u in UNITS:
        b = block(u)
        if b is None:
            out.append("  // %s: nessun blocco \"Assegnazione sprite\" nello Step [C]" % u)
            continue
        toks = tokenize(b)
        p = Parser(toks, u)
        body = []
        while p.peek() is not None:
            body.append(p.stmt(2))
        out.append("  %s(i, w) {" % u)
        out.append("\n".join(body))
        out.append("  },")
        print("%-16s %4d token, variabili: %s" % (u, len(toks), ", ".join(sorted(p.vars))))
    out.append("};")
    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(out) + "\n")


if __name__ == "__main__":
    main()
