// manager — Alarm_6 (eventtype=2 enumb=6)
// Estratto da gmx/objects/manager.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///fine pioggia
part_system_destroy(rain)
global.raining=0
alarm[4]=irandom_range(20000,35000) //ricomincia a piovere
