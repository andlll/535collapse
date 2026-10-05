// cavaliere_corpse — Alarm_0 (eventtype=2 enumb=0)
// Estratto da gmx/objects/cavaliere_corpse.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if step=0
{step=1
alarm[0]=13
exit}
if step=1
{step=2
alarm[0]=13
exit}
if step=2
{step=3
alarm[0]=40
exit}
if step=3
instance_destroy()
