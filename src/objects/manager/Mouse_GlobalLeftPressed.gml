// manager — Mouse_GlobalLeftPressed (eventtype=6 enumb=53)
// Estratto da gmx/objects/manager.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Multi=1 e credo roba per il riquadro di selezione
global.multi=1
global.startx=mouse_x
global.starty=mouse_y
if global.minim=1
    {if minim_viewhover=1
        {if global.minim=0
                {global.minim=1
                exit}
        else
            global.minim=0}
    if minim_plushover=1
    global.sz--
    if minim_minushover=1
    global.sz++}
else
    {if minim_viewhover_bis=1
    {global.minim=1
                exit}}
