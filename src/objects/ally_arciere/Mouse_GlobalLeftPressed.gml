// ally_arciere — Mouse_GlobalLeftPressed (eventtype=6 enumb=53)
// Estratto da gmx/objects/ally_arciere.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Se non ci sta ctrl o alt premuto quando clicchi fuori
if global.sele=0
    {
    if selected=1
        {global.sel-=1
        global.milsel-=1
        global.arcsel-=1
        selected=0}
    }
