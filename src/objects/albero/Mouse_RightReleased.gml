// albero — Mouse_RightReleased (eventtype=6 enumb=8)
// Estratto da gmx/objects/albero.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code (applies to: ally_omino -> with) ---
with (ally_omino) {
    if selected=1
    woodwork=1
}

// --- azione 2: execute code ---
woodwork=1

// --- azione 3: execute code (applies to: centro -> with) ---
with (centro) {
    if selected=1
    {
    woodir=1
    goldir=0
    stonedir=0
    foodir=0}
}
