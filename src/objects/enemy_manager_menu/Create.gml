// enemy_manager_menu — Create (eventtype=0 enumb=0)
// Estratto da gmx/objects/enemy_manager_menu.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///impostazione timer gestione nemici
sprite_index=null
//nuovi ordini a soldati
alarm[0]=120
//arrivo prima wave
alarm[1]=9000
//la nebbia
instance_create(3070,650,fog_controller)
instance_create(1100,550,fog_controller)
instance_create(1600,1000,fog_controller)
instance_create(2500,950,fog_controller)
instance_create(2080,1630,fog_controller)
instance_create(3100,1500,fog_controller)
testo=irandom_range(1,8)
testo_c="null"
hover=0
if global.campagna!=1
global.campagna=0
campagnahover=0
sblocco=0
c_indhover=0
c_unlhover=0
lvlhover=0
comb1=0
comb2=0
comb3=0
comb4=0
comb5=0
comb1hplus=0
comb1hmin=0
comb2hplus=0
comb2hmin=0
comb3hplus=0
comb3hmin=0
comb4hplus=0
comb4hmin=0
comb5hplus=0
comb5hmin=0
sblocco_hover=0
redamount=0
global.unlock=2
