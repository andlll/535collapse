// enemy_manager_lv2 — Create (eventtype=0 enumb=0)
// Estratto da gmx/objects/enemy_manager_lv2.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///impostazione timer gestione nemici
//nuovi ordini a soldati nemici
sprite_index=null
alarm[4]=15000
x=300
y=300
with(ally_omino)
    {
    action=1
    dirox=112
    diroy=7449
    alarm[0]=13}
paisa=instance_nearest(mouse_x,mouse_y,ally_omino)
instance_create(paisa.x,paisa.y,dialogo_2_0)
liberati1=0
global.liberati=0
//Imposta aree di difesa
scr_area_difesa(2260,7450,2920,7900,2600,7700,110)
scr_area_difesa(2050,3550,2950,4150,2500,3850,120)
scr_area_difesa(1150,5400,1880,5900,1500,5750,130)
scr_area_difesa(120,3400,720,3800,400,3600,140)
scr_area_difesa(2000,1900,2950,2750,2500,2200,150)
scr_area_difesa(30,2100,1050,2550,500,2350,160)
scr_area_difesa(2200,950,2950,1600,2500,1300,170)
l1=0
l2=0
l3=0
l4=0
l5=0
l6=0
l7=0
dia14=0
