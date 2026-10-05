// dialogo_1_4 — Create (eventtype=0 enumb=0)
// Estratto da gmx/objects/dialogo_1_4.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///impostazioni
sprite_index=null
parlante=instance_nearest(x,y,enemy_picchiere)
titolo="Enemy soldier"
testo="Kill them! No one will survive!"
draw_set_font(overdue)
testo_h=string_height_ext(testo,30,340)
draw_set_font(GUI_1)
posx=parlante.x/global.scaleview-view_xview[0]/global.scaleview
posy=parlante.y/global.scaleview-view_yview[0]/global.scaleview
hover=0
arm=0
alarm[0]=30
alarm[1]=240
