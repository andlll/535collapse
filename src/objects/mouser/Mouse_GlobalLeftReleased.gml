// mouser — Mouse_GlobalLeftReleased (eventtype=6 enumb=56)
// Estratto da gmx/objects/mouser.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Premere pulsanti menu pausa
if pausa=1 && hoverresume=1 && room!=menu
    {instance_activate_all()
    pausa=0}
if pausa=1 && hoverrestart=1 && room!=menu
    {instance_activate_all()
    room_restart()}
if pausa=1 && hovermenu=1 && room!=menu
    {instance_activate_all()
    room_goto(menu)}
if pausa=1 && hoverhints=1 && room!=menu
if global.hint=1
    global.hint=0
    else
    global.hint=1
if pausa=1 && hoverobj=1 && room!=menu
if global.obj=1
    global.obj=0
    else
    global.obj=1
if pausa=1 && hoverfps=1 && room!=menu
if global.fps_show=1
    global.fps_show=0
    else
    global.fps_show=1
if hoverpb=1 && pausa=0 && room!=menu
    {instance_deactivate_all(true)
    pausa=1}
