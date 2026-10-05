// victory_manager — Mouse_GlobalLeftPressed (eventtype=6 enumb=53)
// Estratto da gmx/objects/victory_manager.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Torna a menu
if clicloc=1
    {instance_destroy()
    if room==lvl01
        {
        global.campagna=1
        if global.unlock<2
        global.unlock=2
        room_goto(menu)}
    if room==lvl02
        {
        global.campagna=1
        if global.unlock<3
        global.unlock=3
        room_goto(menu)}}
