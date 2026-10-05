// casa — Mouse_RightReleased (eventtype=6 enumb=8)
// Estratto da gmx/objects/casa.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
with (ally_omino)
    if selected=1
        {repairwork=1
        repx=mouse_x
        repy=mouse_y
        dirox=repx
        diroy=repy
        if action=0
        global.idle-=1
        action=1
        alarm[0]=13}
