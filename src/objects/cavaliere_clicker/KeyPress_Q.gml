// cavaliere_clicker — KeyPress_Q (eventtype=9 enumb=81)
// Estratto da gmx/objects/cavaliere_clicker.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
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
if progression=0
{alarm[0]=20
progression=1
exit}
if selected=1
if progression!=0
coda+=1}}
