// mura_vert_fond — KeyPress_Delete (eventtype=9 enumb=46)
// Estratto da gmx/objects/mura_vert_fond.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if selected=1
    {instance_destroy()
    global.stone+=50
    with (mplus_va)
    instance_destroy()
    with (mplus_vb)
    instance_destroy()}
