// casa_fond — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/casa_fond.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
var tipologia=tipo
if life>=slife
    {var cajetta = instance_create(x,y,casa)
    with (cajetta)
        {tipo=tipologia
        if tipo=1
        {sprite_index=c1s
        mask_index=c1m}
        if tipo=2
        {sprite_index=c2s
        mask_index=c2m}
        if tipo=3
        {sprite_index=c3s
        mask_index=c3m}
        if tipo=4
        {sprite_index=c4s
        mask_index=c4m}
        if tipo=5
        {sprite_index=c5s
        mask_index=c5m}
        if tipo=6
        {sprite_index=c6s
        mask_index=c6m}}
    instance_destroy()}
