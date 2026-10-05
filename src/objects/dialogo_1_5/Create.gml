// dialogo_1_5 — Create (eventtype=0 enumb=0)
// Estratto da gmx/objects/dialogo_1_5.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///impostazioni
sprite_index=null
parlante=instance_nearest(x,y,ally_warrior)
titolo="Soldier 1"
testo="Out citizens gifted us gold. Also, we could use those barracks to train more soldiers!"
draw_set_font(overdue)
testo_h=string_height_ext(testo,30,340)
draw_set_font(GUI_1)
posx=parlante.x/global.scaleview-view_xview[0]/global.scaleview
posy=parlante.y/global.scaleview-view_yview[0]/global.scaleview
hover=0
arm=0
alarm[0]=30
