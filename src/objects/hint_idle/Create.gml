// hint_idle — Create (eventtype=0 enumb=0)
// Estratto da gmx/objects/hint_idle.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
titolo="Idling workers"
testo="On top right of the screen you can monitor how many workers are idling. Click the button or press the spacebar to select them."
draw_set_font(overdue)
testo_h=string_height_ext(testo,30,340)
draw_set_font(GUI_1)
posx=view_wport[0]-410
posy=170
hover=0
