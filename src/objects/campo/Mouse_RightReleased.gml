// campo — Mouse_RightReleased (eventtype=6 enumb=8)
// Estratto da gmx/objects/campo.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code (applies to: centro -> with) ---
with (centro) {
    if selected=1
        {
        woodir=0
        goldir=0
        stonedir=0
        foodir=1}
}

// --- azione 2: execute code (applies to: ally_omino -> with) ---
with (ally_omino) {
    if selected=1
    foodwork=1
}
