/// scr_area_difesa(def_point_x, def_point_y, def_point_id, raggio)

var def_x = argument0; //punto da difendere
var def_y = argument1;
var def_id = argument2; //id unico del punto
var raggio = argument3; //raggio d'azione in cui cercare il nemico
if instance_exists(enemy_unit)
with enemy_unit
    {if def_point_id = def_id
        {if warwork=0 || warwork=4
            {var invasore=instance_nearest(def_x,def_y,ally_unit)
            if point_distance(def_x,def_y,invasore.x,invasore.y)<raggio
                {if action!=1 
                alarm[0]=15
                action=1
                warwork=1
                dirox=invasore.x
                diroy=invasore.y}
            else
                if point_distance(def_x,def_y,x,y)>(raggio/1.5)
                    {if action!=1 
                    alarm[0]=15
                    action=1
                    warwork=4
                    dirox=def_x
                    diroy=def_y
                    }}}}

