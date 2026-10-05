// o_box2 — Alarm_0 (eventtype=2 enumb=0)
// Estratto da gmx/objects/o_box2.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
alarm[0]=30
if onfire=1 && visible=true
    {
    var de=depth
    var fumo=instance_create(x,y,nubeqq)
    with fumo
    depth=de-2}
