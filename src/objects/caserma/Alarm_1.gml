// caserma — Alarm_1 (eventtype=2 enumb=1)
// Estratto da gmx/objects/caserma.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Nuvoletta da fuoco
alarm[1]=30
if onfire=1
    {
    var de=depth
    var fumo=instance_create(x,y,nubeqq)
    with fumo
    depth=de-2}
