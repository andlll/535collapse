// magazzino — Alarm_0 (eventtype=2 enumb=0)
// Estratto da gmx/objects/magazzino.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
alarm[0]=30
if onfire=1
    {
    var de=depth
    var fumo=instance_create(x,y,nubeqq)
    with fumo
    depth=de-2}
