// dialogo_2_5 — Create (eventtype=0 enumb=0)
// Estratto da gmx/objects/dialogo_2_5.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///impostazioni
sprite_index=null
parlante=instance_nearest(x,y,ally_militare)
titolo="Soldier"
testo="Let's get to work! I promise you we will free the countryside"
draw_set_font(overdue)
testo_h=string_height_ext(testo,30,340)
draw_set_font(GUI_1)
posx=parlante.x/global.scaleview-view_xview[0]/global.scaleview
posy=parlante.y/global.scaleview-view_yview[0]/global.scaleview
hover=0
instance_create(2654,7571,palo_1)
instance_create(1262,5438,palo_1)
instance_create(2842,3928,palo_1)
instance_create(173,3516,palo_1)
instance_create(49,2174,palo_1)
instance_create(2784,2248,palo_1)
instance_create(2876,1200,palo_1)
instance_create(0,0,objective_button)
arm=0
alarm[0]=10
