// hint_objective2 — Create (eventtype=0 enumb=0)
// Estratto da gmx/objects/hint_objective2.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
titolo="Objectives"
testo="For this demo, the goal is to survive as long as possible and to destroy the enemies' bases. Press O to hide the objectives' window." 
draw_set_font(overdue)
testo_h=string_height_ext(testo,30,340)
draw_set_font(GUI_1)
posx=view_wport[0]-900
posy=20
arm=0
alarm[0]=10
hover=0
