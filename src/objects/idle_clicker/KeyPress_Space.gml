// idle_clicker — KeyPress_Space (eventtype=9 enumb=32)
// Estratto da gmx/objects/idle_clicker.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
with (ally_omino)
    {if selected=1
        {global.sel-=1
        selected=0}}
var ordero=orderu
with (ally_omino)
    {if idling=1
    if idleorder=ordero
        {selected=1
        view_xview[0]=x-view_wview[0]/2
        view_yview[0]=y-view_hview[0]/2
        global.sel+=1
        with (idle_clicker)
            {orderu+=1
            if orderu>global.idle
            orderu=1}}}
