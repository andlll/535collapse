// mura_ori_fond — Mouse_GlobalLeftPressed (eventtype=6 enumb=53)
// Estratto da gmx/objects/mura_ori_fond.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
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
    
if ho2!=1 && ho3!=1
    {selected=0
    with (mplus_os)
    instance_destroy()
    with (mplus_od)
    instance_destroy()}
