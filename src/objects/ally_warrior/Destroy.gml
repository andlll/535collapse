// ally_warrior — Destroy (eventtype=1 enumb=0)
// Estratto da gmx/objects/ally_warrior.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///se non ci sta ctrl o alt premuto quando clicchi fuori

with(attacco_clicker)
    {if hover=1
    var hoa=1
    else
    var hoa=0}

with(difesa_clicker)
    {if hover=1
    var hod=1
    else
    var hod=0}

if hoa!=1 && hod!=1
{if selected=1
if global.sele=0
    {global.sel-=1
    global.milsel-=1
    selected=0
    with(attacco_clicker)
    instance_destroy()
    with(difesa_clicker)
    instance_destroy()
    }}
    scr_free()
