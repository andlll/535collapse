// casa_placer — Mouse_GlobalLeftPressed (eventtype=6 enumb=53)
// Estratto da gmx/objects/casa_placer.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if place=1
if global.wood>=50
    {instance_destroy()
    global.sele=1
    global.wood-=50
    var tipologia=tipo
    var nuovacasa=instance_create(x,y,casa_fond)
    with nuovacasa
        {if tipologia=1
            {sprite_index=c1f
            tipo=1
            mask_index=c1m}
        if tipologia=2
            {sprite_index=c2f
            tipo=2
            mask_index=c2m}
        if tipologia=3
            {sprite_index=c3f
            tipo=3
            mask_index=c3m}
        if tipologia=4
            {sprite_index=c4f
            tipo=4
            mask_index=c4m}
        if tipologia=5
            {sprite_index=c5f
            tipo=5
            mask_index=c5m}
        if tipologia=6
            {sprite_index=c6f
            tipo=6
            mask_index=c6m}}
    with (casa_clicker)
    active=0 
    }
else
instance_create(0,0,wood_blink)
