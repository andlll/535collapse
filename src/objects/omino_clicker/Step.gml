// omino_clicker — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/omino_clicker.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
x=view_xview[0]+450*global.scaleview
y=view_yview[0]+50*global.scaleview
depth=-y-999
image_xscale=global.scaleview
image_yscale=global.scaleview

// --- azione 2: execute code ---
///tasto sinistro del mouse
if hover=1
if mouse_check_button_released(mb_left)=true
{
with(centro)
{if selected=1
if coda<6
var ok=1
else
var ok=0}
if global.food<50
instance_create(0,0,food_blink)
if global.pop>=global.popcap
instance_create(0,0,pop_blink)
if ok=1
if global.food>=50
if global.pop<global.popcap
{active=1
global.food-=50
with (centro)
{
if selected=1
{if progression=0
{alarm[0]=20
progression=1
mouse_clear(mb_left)
exit}
if progression!=0
coda+=1}}}
mouse_clear(mb_left)}
