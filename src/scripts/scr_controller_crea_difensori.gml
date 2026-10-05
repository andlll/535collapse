///scr_controller_crea_difensori(critical,interval,def_x,def_y,targetid)
var critical=argument0;
var interval=argument1;
var def_x = argument2; //punto da difendere, serve?
var def_y = argument3;
var targetid=argument4;
var count=0
with (enemy_unit)
    {if role=10 && def_point_id=targetid
    count++}
if instance_exists(enemy_caserma)
    {if count<critical
        {with(enemy_caserma)
        if role=10 && alarm[3]=-1
            {alarm[3]=540
            scr_creazione_difensori_arciere(def_x,def_y,targetid)}}
    else
        {with(enemy_caserma)
        if role=10
        alarm[3]=interval*60}}
