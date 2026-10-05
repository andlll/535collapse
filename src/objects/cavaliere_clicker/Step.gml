// cavaliere_clicker — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/cavaliere_clicker.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///tasto sinistro mouse
if hover=1
if mouse_check_button_released(mb_left)=true
{
with(stalla)
    {if selected=1
    if coda<6
    var ok=1
    else
    var ok=0}
if global.food<50
instance_create(0,0,food_blink)
if global.gold<70
instance_create(0,0,gold_blink)
if global.pop+2>=global.popcap
instance_create(0,0,pop_blink)
if ok=1
if global.food>=50
if global.gold>=70
if global.pop+2<global.popcap
{active=1
global.food-=50
global.gold-=70
with (stalla)
{
if selected=1
if progression!=0
coda+=1
if selected=1
if progression=0
{alarm[0]=20
progression=1
exit}
}}
mouse_clear(mb_left)}

// --- azione 2: execute code ---
x=view_xview[0]+450*global.scaleview
y=view_yview[0]+50*global.scaleview
depth=-y-999
image_xscale=global.scaleview
image_yscale=global.scaleview

// --- azione 3: execute code ---
if mouse_x>x-30 && mouse_x<x+30 && mouse_y>y-30 && mouse_y<y+30
global.sele=1
else
global.sele=0
