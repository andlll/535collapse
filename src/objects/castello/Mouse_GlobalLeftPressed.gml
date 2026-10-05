// castello — Mouse_GlobalLeftPressed (eventtype=6 enumb=53)
// Estratto da gmx/objects/castello.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
with(ariete_clicker)
{if hover=1
var ho1=1
else
var ho1=0}
with(catapulta_clicker)
{if hover=1
var ho2=1
else
var ho2=0}
with(castello_indietro_clicker)
{if hover=1
var ho4=1
else
var ho4=0}

if ho1!=1 && ho2!=1 && ho4!=1
{
selected=0
with (ariete_clicker)
instance_destroy()
with (catapulta_clicker)
instance_destroy()
with (castello_indietro_clicker)
instance_destroy()}
