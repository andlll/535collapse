// miniera_oro — Mouse_RightReleased (eventtype=6 enumb=8)
// Estratto da gmx/objects/miniera_oro.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code (applies to: centro -> with) ---
with (centro) {
    if selected=1
        {
        woodir=0
        goldir=1
        stonedir=0
        foodir=0}
}

// --- azione 2: execute code (applies to: ally_omino -> with) ---
with (ally_omino) {
    if selected=1
        {goldwork=1
        woodwork=0}
}

// --- azione 3: execute code ---
goldwork=1
