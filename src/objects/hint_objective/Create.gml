// hint_objective — Create (eventtype=0 enumb=0)
// Estratto da gmx/objects/hint_objective.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
titolo="Objectives"
testo="Next to it, you can find the objectives of the current map. Complete them to win the level." 
draw_set_font(overdue)
testo_h=string_height_ext(testo,30,340)
draw_set_font(GUI_1)
posx=view_wport[0]-900
posy=20
hover=0
