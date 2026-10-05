// mura_ori — Mouse_GlobalLeftPressed (eventtype=6 enumb=53)
// Estratto da gmx/objects/mura_ori.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
with(gate_clicker)
    {if hover=1
    var ho1=1
    else
    var ho1=0}
with(mplus_os)
    {if hover=1
    var ho2=1
    else
    var ho2=0}
with(mplus_od)
    {if hover=1
    var ho3=1
    else
    var ho3=0}
    
if ho1!=1 && ho2!=1 && ho3!=1
    {selected=0
    with (gate_clicker)
    instance_destroy()
    with (mplus_os)
    instance_destroy()
    with (mplus_od)
    instance_destroy()}
