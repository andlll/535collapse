"""Lettura del formato GMX di GameMaker: Studio 1.x.

Nomi degli eventi e dei tasti, e resa leggibile delle azioni di un evento
(GML scritto a mano + azioni drag & drop) come un unico testo GML.

Le tabelle eventtype/enumb sono quelle del formato GMS 1.x [I: conoscenza
del formato, confermata sui nomi dei file e sul contenuto degli eventi
letti: p.es. Draw 64 contiene solo disegno in coordinate GUI, Mouse 56
contiene le azioni "al rilascio del tasto sinistro ovunque"].
"""
import xml.etree.ElementTree as ET

STEP = {0: "Step", 1: "Step_Begin", 2: "Step_End"}
DRAW = {0: "Draw", 64: "Draw_GUI", 65: "Draw_Resize", 72: "Draw_Begin", 73: "Draw_End",
        74: "Draw_GUI_Begin", 75: "Draw_GUI_End", 76: "Draw_Pre", 77: "Draw_Post"}
MOUSE = {0: "LeftButton", 1: "RightButton", 2: "MiddleButton", 3: "NoButton",
         4: "LeftPressed", 5: "RightPressed", 6: "MiddlePressed",
         7: "LeftReleased", 8: "RightReleased", 9: "MiddleReleased",
         10: "MouseEnter", 11: "MouseLeave", 60: "WheelUp", 61: "WheelDown",
         50: "GlobalLeftButton", 51: "GlobalRightButton", 52: "GlobalMiddleButton",
         53: "GlobalLeftPressed", 54: "GlobalRightPressed", 55: "GlobalMiddlePressed",
         56: "GlobalLeftReleased", 57: "GlobalRightReleased", 58: "GlobalMiddleReleased"}
OTHER = {0: "OutsideRoom", 1: "IntersectBoundary", 2: "GameStart", 3: "GameEnd",
         4: "RoomStart", 5: "RoomEnd", 6: "NoMoreLives", 7: "AnimationEnd",
         8: "EndOfPath", 9: "NoMoreHealth"}
OTHER.update({10 + i: "User%d" % i for i in range(16)})
OTHER.update({40 + i: "OutsideView%d" % i for i in range(8)})
OTHER.update({50 + i: "BoundaryView%d" % i for i in range(8)})

KEYS = {0: "NoKey", 1: "AnyKey", 8: "Backspace", 9: "Tab", 13: "Enter", 16: "Shift",
        17: "Control", 18: "Alt", 19: "Pause", 27: "Escape", 32: "Space",
        33: "PageUp", 34: "PageDown", 35: "End", 36: "Home", 37: "Left", 38: "Up",
        39: "Right", 40: "Down", 45: "Insert", 46: "Delete",
        106: "NumpadMultiply", 107: "NumpadAdd", 109: "NumpadSubtract",
        110: "NumpadDecimal", 111: "NumpadDivide"}
KEYS.update({c: chr(c) for c in range(48, 58)})
KEYS.update({c: chr(c) for c in range(65, 91)})
KEYS.update({96 + i: "Numpad%d" % i for i in range(10)})
KEYS.update({112 + i: "F%d" % (i + 1) for i in range(12)})

EVENT_TYPES = {0: "Create", 1: "Destroy", 2: "Alarm", 3: "Step", 4: "Collision",
               5: "Keyboard", 6: "Mouse", 7: "Other", 8: "Draw", 9: "KeyPress",
               10: "KeyRelease", 11: "Trigger"}


def event_name(etype, enumb, ename):
    """Nome di file stabile per un evento, p.es. Alarm_3, Mouse_GlobalLeftReleased."""
    etype = int(etype)
    n = int(enumb) if enumb not in (None, "") else 0
    if etype == 0:
        return "Create"
    if etype == 1:
        return "Destroy"
    if etype == 2:
        return "Alarm_%d" % n
    if etype == 3:
        return STEP.get(n, "Step_%d" % n)
    if etype == 4:
        return "Collision_%s" % ename
    if etype in (5, 9, 10):
        return "%s_%s" % (EVENT_TYPES[etype], KEYS.get(n, str(n)))
    if etype == 6:
        return "Mouse_%s" % MOUSE.get(n, str(n))
    if etype == 7:
        return "Other_%s" % OTHER.get(n, str(n))
    if etype == 8:
        return DRAW.get(n, "Draw_%d" % n)
    return "%s_%d" % (EVENT_TYPES.get(etype, "Event%d" % etype), n)


def load(path):
    return ET.parse(path).getroot()


def text(el, tag, default=None):
    v = el.findtext(tag)
    return default if v is None else v


def num(s):
    """Numero da stringa XML: int se possibile, altrimenti float."""
    try:
        return int(s)
    except (TypeError, ValueError):
        try:
            return float(s)
        except (TypeError, ValueError):
            return s


# ------------------------------------------------------------------ azioni

CODE_ACTION = "603"       # "execute code"
START_BLOCK = "422"
END_BLOCK = "424"
ELSE_ACTION = "421"
# action_if_variable: terzo argomento = confronto. Nel progetto compare solo
# 0 (uguale) [C]; gli altri valori sono quelli dell'editor GMS 1.x [I].
IFVAR_OPS = {"0": "==", "1": "<", "2": ">", "3": "<=", "4": ">="}


def parse_action(a):
    args = []
    for g in a.findall("arguments/argument"):
        kind = g.findtext("kind")
        val = g.findtext("string")
        if val is None:
            # argomenti che puntano a una risorsa (sprite, oggetto, ...)
            for tag in ("sprite", "object", "background", "sound", "path", "font",
                        "timeline", "room", "script"):
                if g.find(tag) is not None:
                    val = g.findtext(tag)
                    break
        args.append({"kind": kind, "value": val if val is not None else ""})
    return {
        "lib": a.findtext("libid"), "id": a.findtext("id"), "kind": a.findtext("kind"),
        "function": a.findtext("functionname") or "",
        "question": a.findtext("isquestion") == "-1",
        "relative": a.findtext("relative") == "-1",
        "use_relative": a.findtext("userelative") == "-1",
        "not": a.findtext("isnot") == "-1",
        "who": a.findtext("whoName") or "self",
        "args": args,
    }


def _indent(s, pad="    "):
    return "\n".join(pad + line if line.strip() else line for line in s.split("\n"))


def _arg(a):
    v = a["value"]
    if a["kind"] == "0" and v and not v.lstrip("-").replace(".", "", 1).isdigit():
        return v  # espressione o nome di variabile
    return v if v != "" else '""'


def _question(act):
    if act["function"] == "action_if_variable" and len(act["args"]) == 3:
        var, val, op = (x["value"] for x in act["args"])
        if act["who"] == "other":
            var = "other." + var
        cond = "%s %s %s" % (var, IFVAR_OPS.get(op, "?op%s?" % op), val)
    else:
        cond = "%s(%s)" % (act["function"] or "action_%s" % act["id"],
                           ", ".join(_arg(x) for x in act["args"]))
    if act["not"]:
        cond = "!(%s)" % cond
    note = ""
    if act["who"] not in ("self", "other") or (act["who"] == "other" and act["function"] != "action_if_variable"):
        note = "  // applies to: %s" % act["who"]
    return cond, note


def _plain(act, n):
    if act["id"] == CODE_ACTION:
        code = (act["args"][0]["value"] if act["args"] else "").rstrip("\n")
        head = "// --- azione %d: execute code" % n
        if act["who"] != "self":
            # "Applies to: other/oggetto" in GMS equivale a eseguire il codice
            # dentro with(...) [I: semantica dell'editor].
            return "%s (applies to: %s -> with) ---\nwith (%s) {\n%s\n}" % (
                head, act["who"], act["who"], _indent(code))
        return "%s ---\n%s" % (head, code)
    call = "%s(%s);" % (act["function"] or "action_%s_%s" % (act["lib"], act["id"]),
                        ", ".join(_arg(x) for x in act["args"]))
    flags = []
    if act["use_relative"]:
        flags.append("relative" if act["relative"] else "assoluto")
    head = "// --- azione %d: drag&drop %s%s ---" % (n, act["function"] or act["id"],
                                                  " [%s]" % ", ".join(flags) if flags else "")
    if act["who"] != "self":
        return "%s\nwith (%s) %s" % (head, act["who"], call)
    return "%s\n%s" % (head, call)


def render_actions(actions):
    """Testo GML equivalente alla lista di azioni di un evento.

    Regole dell'editor drag & drop [I]: una domanda governa l'azione
    successiva (o il blocco start/end che la segue); "else" si aggancia
    all'ultima domanda; domande consecutive si annidano.
    """
    acts = [parse_action(a) for a in actions]
    counter = [0]

    def stmt(i):
        a = acts[i]
        if a["id"] == START_BLOCK:
            body, i = [], i + 1
            while i < len(acts) and acts[i]["id"] != END_BLOCK:
                s, i = stmt(i)
                body.append(s)
            return "{\n%s\n}" % _indent("\n".join(body)), i + 1
        if a["question"]:
            counter[0] += 1
            n = counter[0]
            cond, note = _question(a)
            if i + 1 >= len(acts):
                return "// --- azione %d: domanda senza seguito ---\nif (%s) {}%s" % (n, cond, note), i + 1
            inner, j = stmt(i + 1)
            out = "// --- azione %d: drag&drop %s ---\nif (%s)%s\n%s" % (
                n, a["function"], cond, note, _wrap(inner))
            if j < len(acts) and acts[j]["id"] == ELSE_ACTION:
                other, j = stmt(j + 1)
                out += "\nelse\n%s" % _wrap(other)
            return out, j
        counter[0] += 1
        return _plain(a, counter[0]), i + 1

    out, i = [], 0
    while i < len(acts):
        s, i = stmt(i)
        out.append(s)
    return "\n\n".join(out) + "\n", acts


def _wrap(s):
    s = s.strip("\n")
    if s.startswith("{"):
        return s
    return "{\n%s\n}" % _indent(s)
