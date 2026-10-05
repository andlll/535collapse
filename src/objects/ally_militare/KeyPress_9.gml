// ally_militare — KeyPress_9 (eventtype=9 enumb=57)
// Estratto da gmx/objects/ally_militare.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if global.sele=0
{
if assi=9
if selected=0
{{global.sel+=1
global.milsel+=1}
selected=1}
if assi!=9
if selected=1
{global.sel-=1
global.milsel-=1
selected=0}}
if global.sele=1
if selected=1
assi=9
