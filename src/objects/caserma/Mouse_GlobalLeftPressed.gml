// caserma — Mouse_GlobalLeftPressed (eventtype=6 enumb=53)
// Estratto da gmx/objects/caserma.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
with(warrior_clicker)
{if hover=1
var ho1=1
else
var ho1=0}
with(picchiere_clicker)
{if hover=1
var ho2=1
else
var ho2=0}
with(arciere_clicker)
{if hover=1
var ho3=1
else
var ho3=0}
with(caserma_indietro_clicker)
{if hover=1
var ho4=1
else
var ho4=0}

if ho1!=1 && ho2!=1 && ho3!=1 && ho4!=1
{
selected=0
with (warrior_clicker)
instance_destroy()
with (picchiere_clicker)
instance_destroy()
with (arciere_clicker)
instance_destroy()
with (caserma_indietro_clicker)
instance_destroy()}
