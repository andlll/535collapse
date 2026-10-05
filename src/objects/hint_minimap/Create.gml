// hint_minimap — Create (eventtype=0 enumb=0)
// Estratto da gmx/objects/hint_minimap.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
titolo="Minimap"
testo="On the bottom left of the screen you can see the minimap, showing your building, units, the visible resources and the enemies. Press M to hide/view the minimap. Press Ctrl+Z and Ctrl+X to regulate the minimap size." 
draw_set_font(overdue)
testo_h=string_height_ext(testo,30,340)
draw_set_font(GUI_1)
posx=20
posy=view_hport[0]-testo_h-98-room_height/global.sz
hover=0
