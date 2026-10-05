// object122 — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/object122.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///mouse sinistro
if hover=1
if mouse_check_button_released(mb_left)=true
{
with(caserma)
{if selected=1
if coda<6
var ok=1
else
var ok=0}
if ok=1
if global.food>=75
if global.gold>=35
if global.pop+1<global.popcap
{active=1
global.food-=75
global.gold-=35
with (caserma)
{if selected=1
{if progression!=0
coda+=1
if progression=0 && coda=0
coda0=1
if coda=1
coda1=1
if coda=2
coda2=1
if coda=3
coda3=1
if coda=4
coda4=1
if coda=5
coda5=1
if coda=6
coda6=1
if selected=1
if progression=0
{alarm[0]=20
progression=1
exit}}
}}
if global.food<75
instance_create(0,0,food_blink)
if global.gold<35
instance_create(0,0,gold_blink)
if global.pop+1>=global.popcap
instance_create(0,0,pop_blink)
mouse_clear(mb_left)}

// --- azione 2: execute code ---
x=view_xview[0]+605
y=view_yview[0]+62
depth=-y-999

// --- azione 3: execute code ---
if mouse_x>x-40 && mouse_x<x+40 && mouse_y>y-40 && mouse_y<y+40
global.sele=1
else
global.sele=0
