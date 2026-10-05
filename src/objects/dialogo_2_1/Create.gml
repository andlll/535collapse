// dialogo_2_1 — Create (eventtype=0 enumb=0)
// Estratto da gmx/objects/dialogo_2_1.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///impostazioni
sprite_index=null
parlante=instance_nearest(x,y,ally_omino)
titolo="Villager"
testo="Thank you for saving us! The invader's army is kidnapping villagers from the countryside!"
draw_set_font(overdue)
testo_h=string_height_ext(testo,30,340)
draw_set_font(GUI_1)
posx=parlante.x/global.scaleview-view_xview[0]/global.scaleview
posy=parlante.y/global.scaleview-view_yview[0]/global.scaleview
hover=0
var idme=id
with(enemy_manager_lv2)
    {scr_inizializza_ff_nemici(idme)
    alarm[3]=10}
if instance_exists(dialogo_2_0)
    {with(dialogo_2_0)
    instance_destroy()}
