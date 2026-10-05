// manager — KeyPress_Q (eventtype=9 enumb=81)
// Estratto da gmx/objects/manager.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Trucco oro e distruggi pioggia
if global.sele=-1 && global.visia=1
global.gold+=1000
part_system_destroy(rain)
global.raining=0
