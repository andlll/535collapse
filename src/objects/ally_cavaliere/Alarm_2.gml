// ally_cavaliere — Alarm_2 (eventtype=2 enumb=2)
// Estratto da gmx/objects/ally_cavaliere.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if action=2
    {if step=0
        {step=1
        alarm[2]=13
        exit}
    if step=1
        {step=2
        alarm[2]=13
        exit}
    if step=2
        {step=0
        alarm[2]=13
        with instance_nearest(x+30*cos(degtorad(direction)),y-30*sin(degtorad(direction)),enemy_unit)
            {hit=1
            if slife!=125 && slife!=100
            alarm[5]=47
            if slife=75 || slife=90
            life-=5
            if slife=125 || slife=100
            {life-=5
                if action=0
                    {var dirscampa=point_direction(io_x,io_y,x,y)
                    action=1
                    warwork=4
                    step=0
                    if alarm[0]<0
                    alarm[0]=12
                    var scampa_x=x+lengthdir_x(200,dirscampa)
                    var scampa_y=y+lengthdir_y(200,dirscampa)
                    dirox=scampa_x
                    diroy=scampa_y}}
            if slife=55
            life-=22
            if slife=60
            life-=3
            }
        exit}}
