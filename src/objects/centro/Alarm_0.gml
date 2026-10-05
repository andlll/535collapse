// centro — Alarm_0 (eventtype=2 enumb=0)
// Estratto da gmx/objects/centro.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Crea omino
if flagx!=nope
    {var aflagx=flagx
    var aflagy=flagy}
else
    {var aflagx=x+250
    var aflagy=y+150}
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
    alarm[0]=10}
if progression>=100
    {
    if global.pop>=global.popcap
        {alarm[0]=30
        instance_create(0,0,pop_blink)
        exit}
    progression=0
    if coda>0
        {coda-=1
        alarm[0]=10
        progression=1}
        var nuovo=instance_create(x,y,ally_omino)
        with nuovo
            {alarm[10]=10
            creation=1
            flaggox=aflagx
            flaggoy=aflagy
                }}
alarm[2]=30
alarm[3]=70
