// castello — Mouse_RightReleased (eventtype=6 enumb=8)
// Estratto da gmx/objects/castello.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
var towx=x
var towy=y
if life<slife
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
//presidio
if npresidio<4
with (ally_arciere)
 if selected=1
    {presidiowork=1
    dirox=towx
    diroy=towy
    action=1
    alarm[0]=13}
