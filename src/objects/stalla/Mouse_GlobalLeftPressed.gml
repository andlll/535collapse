// stalla — Mouse_GlobalLeftPressed (eventtype=6 enumb=53)
// Estratto da gmx/objects/stalla.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
with(cavaliere_clicker)
{if hover=1
var ho=1
else
var ho=0}

with(stalla_indietro_clicker)
{if hover=1
var ho1=1
else
var ho1=0}

if ho!=1 && ho1!=1
{
selected=0
with (cavaliere_clicker)
instance_destroy()
with (stalla_indietro_clicker)
instance_destroy()}
