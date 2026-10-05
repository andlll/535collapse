// ally_warrior — Alarm_0 (eventtype=2 enumb=0)
// Estratto da gmx/objects/ally_warrior.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Step animazioni
if step=0
if action=1
    {step=1
    alarm[0]=10
    exit}
if step=1
    {step=2
    alarm[0]=10
    exit}
if step=2
if action=1
    {step=3
    alarm[0]=10
    exit}
if step=3
    {step=0
    alarm[0]=10
    exit}
