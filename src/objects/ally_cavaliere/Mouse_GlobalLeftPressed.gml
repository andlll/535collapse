// ally_cavaliere — Mouse_GlobalLeftPressed (eventtype=6 enumb=53)
// Estratto da gmx/objects/ally_cavaliere.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
//se non ci sta ctrl o alt premuto quando clicchi fuori//
if global.sele=0
    {
    if selected=1
        {global.sel-=1
        global.milsel-=1
        selected=0}
    }
