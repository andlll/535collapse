// dialogo_2_9 — Create (eventtype=0 enumb=0)
// Estratto da gmx/objects/dialogo_2_9.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///impostazioni
sprite_index=null
parlante=instance_nearest(x,y,ally_omino)
titolo="Villager"
testo="Finally free! We will work together to defeat the invaders!"
draw_set_font(overdue)
testo_h=string_height_ext(testo,30,340)
draw_set_font(GUI_1)
posx=parlante.x/global.scaleview-view_xview[0]/global.scaleview
posy=parlante.y/global.scaleview-view_yview[0]/global.scaleview
hover=0
arm=0
alarm[0]=10
