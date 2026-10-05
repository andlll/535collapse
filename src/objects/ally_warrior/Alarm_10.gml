// ally_warrior — Alarm_10 (eventtype=2 enumb=10)
// Estratto da gmx/objects/ally_warrior.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Movimento base
if flaggox!=nada
    {dirox=flaggox
    diroy=flaggoy
    alarm[8]=3000
    if action!=1
    alarm[0]=irandom_range(5,13)
    action=1
    warwork=4
    if position_meeting(flaggox+100,flaggoy,enemy_unit)
    warwork=1}

// --- azione 2: execute code ---
///Movimento con la flow field
if flaggox!=nada
scr_move(flaggox,flaggoy)
