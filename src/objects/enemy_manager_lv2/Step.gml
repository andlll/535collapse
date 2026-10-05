// enemy_manager_lv2 — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/enemy_manager_lv2.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Condizioni di liberazione punti e vittoria
if liberati1=0 
if (collision_rectangle(760, 6770, 1868, 7450, enemy_unit, false, true) == noone)
    {instance_create(1645,7109,ally_omino)
    instance_create(1745,7109,ally_omino)
    instance_create(1645,7109,dialogo_2_1)
    liberati1=1}
if l1=0
 {var l1exists=false
     with (enemy_unit) 
         {if (def_point_id == 110) 
         l1exists = true;}        
 if l1exists = false
    {instance_create(2600,7650,ally_omino)
    instance_create(2600,7650,dialogo_2_6)
    l1=1
    global.liberati++
    exit} } 
if l2=0
 {var l2exists=false
     with (enemy_unit) 
         {if (def_point_id == 120) 
         l2exists = true;}        
 if l2exists = false
    {instance_create(2950,3950,ally_omino)
    instance_create(3050,3950,ally_omino)
    instance_create(3150,3950,ally_omino)
    instance_create(2950,3950,dialogo_2_7)
    l2=1
    global.liberati++
    exit} }  
if l3=0
 {var l3exists=false
     with (enemy_unit) 
         {if (def_point_id == 130) 
         l3exists = true;}        
 if l3exists = false
    {instance_create(1800,5580,ally_omino)
    instance_create(2000,5650,ally_omino)
    instance_create(2000,5650,dialogo_2_8)
    instance_create(2000,5580,legno_prizedrawer)
    global.wood+=100
    l3=1
    global.liberati++
    exit} }
if l4=0
 {var l4exists=false
     with (enemy_unit) 
         {if (def_point_id == 140) 
         l4exists = true;}        
 if l4exists = false
    {instance_create(50,3530,ally_omino)
    instance_create(50,3530,dialogo_2_9)
    l4=1
    global.liberati++
    exit}}
if l5=0
 {var l5exists=false
     with (enemy_unit) 
         {if (def_point_id == 150) 
         l5exists = true;}        
 if l5exists = false
    {instance_create(2950,3950,ally_omino)
    instance_create(2950,4050,ally_omino)
    instance_create(3050,3950,ally_omino)
    instance_create(3050,4050,ally_omino)
    instance_create(2950,4050,dialogo_2_10)
    l5=1
    global.liberati++
    exit}}
if l6=0
 {var l6exists=false
     with (enemy_unit) 
         {if (def_point_id == 160) 
         l6exists = true;}        
 if l6exists = false
    {instance_create(200,2330,ally_omino)
    instance_create(200,2330,dialogo_2_11)
    instance_create(200,2330,oro_prizedrawer)
    global.gold+=100
    l6=1
    global.liberati++
    exit}}
if l7=0
 {var l7exists=false
     with (enemy_unit) 
         {if (def_point_id == 170) 
         l7exists = true;}        
 if l7exists = false
    {instance_create(2950,850,ally_omino)
    instance_create(3050,850,ally_omino)
    instance_create(2950,850,dialogo_2_12)
    l7=1
    global.liberati++
    exit}}
//Ordini a difensori
scr_difendi(2600,7700,110,800)
scr_difendi(2500,3850,120,800)
scr_difendi(1500,5750,130,800)
scr_difendi(400,3600,140,800)
scr_difendi(2500,2200,150,800)
scr_difendi(500,2350,160,800)
scr_difendi(2500,1300,170,800)
if instance_number(ally_omino)>0
scr_attacca(4,300,ally_omino)
if l6exists = true
scr_controller_crea_difensori(6,30,500,2350,160)
else
with (enemy_caserma)
    {if role=10
        {alarm[3]=-1}}
if dia14=0
    {var vicc=instance_nearest(1500,2200,ally_militare)
    if point_distance(1500,2200,vicc.x,vicc.y)<400
        {dia14=1
        instance_create(vicc.x,vicc.y,dialogo_2_14)}}
if l1=1 && l2=1 && l3=1 && l4=1 && l5=1 && l6=1 && instance_number(enemy_build)=0
instance_create(0,0,victory_manager)
