// centro — Alarm_2 (eventtype=2 enumb=2)
// Estratto da gmx/objects/centro.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///a fuoco
alarm[2]=30
if onfire=1
    {
    var de=depth
    var fumo=instance_create(x,y,nubeqq)
    with fumo
    depth=de-2}
