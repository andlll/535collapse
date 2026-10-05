// omino_clicker — KeyPress_Q (eventtype=9 enumb=81)
// Estratto da gmx/objects/omino_clicker.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
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
if progression=0
{alarm[0]=20
progression=1
exit}
if progression!=0
coda+=1}}
