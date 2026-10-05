// hint_multi_2 — Create (eventtype=0 enumb=0)
// Estratto da gmx/objects/hint_multi_2.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///impostazioni
titolo="Multiple selection"
testo="Press Ctrl + left click to add units to the selection, Alt + left click to remove them. Press Ctrl + numbers (digits) to assign a quick selection number to a group." 
draw_set_font(overdue)
testo_h=string_height_ext(testo,30,340)
draw_set_font(GUI_1)
vicino=instance_nearest(mouse_x,mouse_y,ally_militare)
posx=vicino.x/global.scaleview-view_xview[0]/global.scaleview
posy=vicino.y/global.scaleview-view_yview[0]/global.scaleview
hover=0
arm=0
alarm[0]=10
