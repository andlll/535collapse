// catapulta_clicker — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/catapulta_clicker.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///mouse sinistro
if hover=1
if mouse_check_button_released(mb_left)=true
    {
    with(castello)
        {if selected=1
        if coda<6
        var ok=1
        else
        var ok=0}
        if global.wood<200
    instance_create(0,0,wood_blink)
    if global.gold<100
    instance_create(0,0,gold_blink)
    if global.pop+2>=global.popcap
    instance_create(0,0,pop_blink)
    mouse_clear(mb_left)
    if ok=1
    if global.wood>=200
    if global.gold>=100
    if global.pop+1<global.popcap
    {active=1
    global.wood-=200
    global.gold-=100
    with (castello)
        {if selected=1
            {if progression!=0
            coda+=1
            if progression=0 && coda=0
            coda0=2
            if coda=1
            coda1=2
            if coda=2
            coda2=2
            if coda=3
            coda3=2
            if coda=4
            coda4=2
            if coda=5
            coda5=2
            if coda=6
            coda6=2
            if selected=1
            if progression=0
            {alarm[1]=30
            progression=1
            exit}}
        }}
}

// --- azione 2: execute code ---
x=view_xview[0]+520*global.scaleview
y=view_yview[0]+50*global.scaleview
depth=-y-999
image_xscale=global.scaleview
image_yscale=global.scaleview

// --- azione 3: execute code ---
if mouse_x>x-30 && mouse_x<x+30 && mouse_y>y-30 && mouse_y<y+30
global.sele=1
else
global.sele=0
