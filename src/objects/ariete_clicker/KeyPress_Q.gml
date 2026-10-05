// ariete_clicker — KeyPress_Q (eventtype=9 enumb=81)
// Estratto da gmx/objects/ariete_clicker.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
with(castello)
    {if selected=1
    if coda<6
    var ok=1
    else
    var ok=0}
if global.wood<250
instance_create(0,0,wood_blink)
if global.gold<60
instance_create(0,0,gold_blink)
if global.pop+2>=global.popcap
instance_create(0,0,pop_blink)
if ok=1
if global.wood>=250
if global.gold>=60
if global.pop+2<global.popcap
    {active=1
    global.wood-=250
    global.gold-=30
    with (castello)
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
    {alarm[1]=30
    progression=1
    exit}}
    }}
