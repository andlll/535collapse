// centro — Mouse_GlobalLeftPressed (eventtype=6 enumb=53)
// Estratto da gmx/objects/centro.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
with(omino_clicker)
{if hover=1
var ho=1
else
var ho=0}

with(centro_indietro_clicker)
{if hover=1
var ho1=1
else
var ho1=0}

if ho!=1 && ho1!=1
{
selected=0
with (omino_clicker)
instance_destroy()
with (centro_indietro_clicker)
instance_destroy()}
