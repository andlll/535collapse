///scr_movimento_nemici_ff ()
if action=1
    {if point_distance(x,y,dirox,diroy)>400 && role=31 || place_free(x,y)=false
        {if instance_place(x,y,enemy_unit)!=noone // se c'è una collisione con un'altra unità amica
            {otro= instance_place(x,y,enemy_unit)
            if otro.ordo<self.ordo || otro.action!=1 //se l'altro ha rank più alto e si sta muovendo tu fermati
                scr_move_flow_field()
            else
                {step=0
                alarm[0]++}}
        else
        scr_move_flow_field()}
    else
        {mp_potential_step(dirox,diroy,autospeed,false)
        if role=31
             {with (enemy_unit)
                {if role=31
                    {role=32
                    action=0}}}}}
