// manager — Alarm_3 (eventtype=2 enumb=3)
// Estratto da gmx/objects/manager.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///spawn aquila
alarm[3]=3000
instance_create(irandom_range(-room_width,room_width),-10,aquila_01)
