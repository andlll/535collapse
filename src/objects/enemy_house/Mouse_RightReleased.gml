// enemy_house — Mouse_RightReleased (eventtype=6 enumb=8)
// Estratto da gmx/objects/enemy_house.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///datemi fuoco
var iddo=id
with (ally_infantry)
    {if selected=1
    if warwork!=2
        {firework=1
        warwork=0
        action=1
        alarm[0]=15
        targetid=iddo
        dirox=targetid.x
        diroy=targetid.y}}
