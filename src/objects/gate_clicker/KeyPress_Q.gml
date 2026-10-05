// gate_clicker — KeyPress_Q (eventtype=9 enumb=81)
// Estratto da gmx/objects/gate_clicker.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
with(mura_vert)
    {if selected=1
    if global.gold>=100
        {global.gold-=100
        instance_create(x,y,porta_vert)
        selected=0
        instance_destroy()
                with(gate_clicker)
        instance_destroy()}
    else
    instance_create(0,0,gold_blink)}
with(mura_ori)
    {if selected=1
    if global.gold>=100
        {global.gold-=100
        instance_create(x,y,porta_ori)
        selected=0
        instance_destroy()
                with(gate_clicker)
        instance_destroy()}
        else
    instance_create(0,0,gold_blink)}
