// pietr_piccolo — Mouse_RightReleased (eventtype=6 enumb=8)
// Estratto da gmx/objects/pietr_piccolo.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code (applies to: centro -> with) ---
with (centro) {
    if selected=1
    {
    woodir=0
    goldir=0
    stonedir=1
    foodir=0}
}

// --- azione 2: execute code (applies to: ally_omino -> with) ---
with (ally_omino) {
    if selected=1
    {stonework=1
    woodwork=0}
}

// --- azione 3: execute code ---
stonework=1
