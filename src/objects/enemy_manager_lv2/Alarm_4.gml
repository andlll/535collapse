// enemy_manager_lv2 — Alarm_4 (eventtype=2 enumb=4)
// Estratto da gmx/objects/enemy_manager_lv2.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Dialogo spie
var vic=instance_nearest(mouse_x,mouse_y,ally_militare)
instance_create(vic.x,vic.y,dialogo_2_13)
