// arciere_clicker — KeyPress_E (eventtype=9 enumb=69)
// Estratto da gmx/objects/arciere_clicker.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
with(caserma)
{if selected=1
if coda<6
var ok=1
else
var ok=0}
if global.wood<40
instance_create(0,0,wood_blink)
if global.gold<55
instance_create(0,0,gold_blink)
if global.pop+1>=global.popcap
instance_create(0,0,pop_blink)
if ok=1
if global.wood>=40
if global.gold>=55
if global.pop+1<global.popcap
{active=1
global.wood-=40
global.gold-=55
with (caserma)
{if selected=1
{if progression!=0
coda+=1
if progression=0 && coda=0
coda0=3
if coda=1
coda1=3
if coda=2
coda2=3
if coda=3
coda3=3
if coda=4
coda4=3
if coda=5
coda5=3
if coda=6
coda6=3
if selected=1
if progression=0
{alarm[0]=13
progression=1
exit}
}}}
