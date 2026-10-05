// stalla_indietro_clicker — KeyPress_W (eventtype=9 enumb=87)
// Estratto da gmx/objects/stalla_indietro_clicker.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
with(stalla)
{if selected=1
if progression!=0
{global.gold+=70
global.food+=50
if coda>0
coda-=1
else
progression=0}}
