// caserma — Alarm_0 (eventtype=2 enumb=0)
// Estratto da gmx/objects/caserma.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Creazione pupazzacci
//coda0=in corso, gli altri in coda a seguire//
if flagx!=nope
    {var aflagx=flagx
    var aflagy=flagy}
else
    {var aflagx=nada
    var aflagy=nada}
if position_meeting(aflagx,aflagy,id)
    {var aflagx=nada
    var aflagy=nada}
if aflagx>x
var startx=1
else
var startx=-1
if aflagy>y
var starty=1
else
var starty=-1
if progression<100 && progression!=0
    {progression+=1
    alarm[0]=1}
if progression>=100
    {
    if global.pop+1>=global.popcap
        {alarm[0]=30
        instance_create(0,0,pop_blink)
        exit}
    progression=0
    if coda>0
        {coda-=1
        alarm[0]=9
        progression=1}
    if coda0=1
        {var nuovo=instance_create(x+20*startx,y+10*starty,ally_warrior)
        with (nuovo)
            {if aflagx!=nada
                {alarm[10]=10
                creation=1
                scr_find_free_cell_spiral64(aflagx,aflagy)}
            else
            scr_occupy()
                }
                    }
    if coda0=2
        {var nuovo=instance_create(x+20*startx,y+10*starty,ally_picchiere)
        with (nuovo)
            {if aflagx!=nada
                {alarm[10]=10
                creation=1
                scr_find_free_cell_spiral64(aflagx,aflagy)}
            else
            scr_occupy()
                }
                    }
    if coda0=3
        {var nuovo=instance_create(x+20*startx,y+10*starty,ally_arciere)
        with (nuovo)
            {if aflagx!=nada
                {alarm[10]=10
                creation=1
                scr_find_free_cell_spiral64(aflagx,aflagy)}
            else
            scr_occupy()
                }
                    }
    coda0=coda1
    coda1=coda2
    coda2=coda3
    coda3=coda4
    coda4=coda5
    coda5=coda6}
