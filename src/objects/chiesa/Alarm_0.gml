// chiesa — Alarm_0 (eventtype=2 enumb=0)
// Estratto da gmx/objects/chiesa.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
alarm[0]=180
var chiesax=x
var chiesay=y
with (ally_unit)
    {var diri=point_direction(x,y,chiesax,chiesay)
    if point_distance(x,y,chiesax,chiesay)*(1-0.36*abs(sin(degtorad(diri))))<800
    if life<slife
        {instance_create(x,y,sfx_croce)
        life+=3
        if life>slife
        life=slife}
   }
