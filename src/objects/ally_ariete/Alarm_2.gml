// ally_ariete — Alarm_2 (eventtype=2 enumb=2)
// Estratto da gmx/objects/ally_ariete.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if action=2
    {if step=0
    {step=1
    alarm[2]=30
    exit}
if step=1
    {step=2
    alarm[2]=13
    exit}
if step=2
    {step=3
    alarm[2]=13
    exit}
if step=3
    {step=0
    alarm[2]=13
        with instance_nearest(x+50*cos(degtorad(direction)),y-50*sin(degtorad(direction)),enemy_build)
            {hit=1
            alarm[2]=50
            if slife=100
            life-=5
            else
            life-=50
            }
exit}}
