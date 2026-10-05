// ally_omino — Mouse_GlobalRightReleased (eventtype=6 enumb=57)
// Estratto da gmx/objects/ally_omino.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///movimento
if selected=1
    {with(ally_unit)
        {if selected=1
        scr_free()}
    creation=0
    if stonework=2 
    stonework=0
    if goldwork=2 
    goldwork=0
    if woodwork=2
    woodwork=0
    if foodwork=2
    foodwork=0
    if buildwork=2 
    buildwork=0
    dirox=mouse_x
    diroy=mouse_y
    if position_meeting(dirox,diroy,miniera_oro)=false
    goldwork=0
    if position_meeting(dirox,diroy,albero)=false
    woodwork=0
    if position_meeting(dirox,diroy,campo)=false
    foodwork=0
    if position_meeting(dirox,diroy,stone_parent)=false
    stonework=0
    if position_meeting(dirox,diroy,ally_fondamenta)=false
    buildwork=0
    if action=0
    global.idle-=1
    if action!=0 && alarm[0]<1
    alarm[0]=13
    if action=0
    alarm[0]=13
    alarm[8]=1200
    action=1
    if woodwork=1
        {woodx=dirox
        woody=diroy}
    else
    woodwork=0
    if goldwork=1
        {goldx=dirox
        goldy=diroy}
    else
    goldwork=0
    if foodwork=1
        {
        dirox=campox
        diroy=campoy
        foodx=campox
        foody=campoy}
    else
    foodwork=0
    if stonework=1
        {
        stonex=dirox
        stoney=diroy}
    else
    stonework=0
    if buildwork=1 || fieldwork=1
        {
        buildx=dirox
        buildy=diroy}
    else
    buildwork=0}
