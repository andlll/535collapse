// hint_create_2 — Create (eventtype=0 enumb=0)
// Estratto da gmx/objects/hint_create_2.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
global.resourcehint=1
arm=0
alarm[0]=10
titolo="Shortcuts and undoing creation"
testo="You can also use shortcut to create units. If you change your mind while the process is ongoing, press the back button near the units creation buttons to have your resources back." 
draw_set_font(overdue)
testo_h=string_height_ext(testo,30,340)
draw_set_font(GUI_1)
posx=instance_nearest(mouse_x,mouse_y,centro).x/global.scaleview-view_xview[0]/global.scaleview
posy=instance_nearest(mouse_x,mouse_y,centro).y/global.scaleview-view_yview[0]/global.scaleview
hover=0
