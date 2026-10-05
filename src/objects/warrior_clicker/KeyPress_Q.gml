// warrior_clicker — KeyPress_Q (eventtype=9 enumb=81)
// Estratto da gmx/objects/warrior_clicker.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
with(caserma)
{if selected=1
if coda<6
var ok=1
else
var ok=0}
if global.food<75
instance_create(0,0,food_blink)
if global.gold<35
instance_create(0,0,gold_blink)
if global.pop+1>=global.popcap
instance_create(0,0,pop_blink)
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
{alarm[0]=13
progression=1
exit}}
}}
