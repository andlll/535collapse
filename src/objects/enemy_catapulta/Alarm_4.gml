// enemy_catapulta — Alarm_4 (eventtype=2 enumb=4)
// Estratto da gmx/objects/enemy_catapulta.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///ricaricare
if action=3
   {if step=0
        {step=1
        alarm[4]=13
        exit}
   if step=1
        {step=2
        alarm[4]=13
        exit}
   if step=2
        {step=3
        alarm[4]=13
        exit}
   if step=3
        {step=4
        alarm[4]=13
        exit}
   if step=4
        {step=0
        loaded=1
        action=0
        exit}}
