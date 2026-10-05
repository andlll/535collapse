// hint_vista — Create (eventtype=0 enumb=0)
// Estratto da gmx/objects/hint_vista.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
titolo="Visualization"
testo="Move your mouse close to the borders to navigate the map. You can also use arrow keys. Zoom in and out using the Z and X keys. Press F10 (Cmd+F on Mac) to switch to fullscreen mode."
draw_set_font(overdue)
testo_h=string_height_ext(testo,30,340)
draw_set_font(GUI_1)
posx=20
posy=170
hover=0
arm=0
alarm[0]=10
