// idle_clicker — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/idle_clicker.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///clic del mouse
if mouse_check_button_released(mb_left)
if hover=1
    {
    var ordero=orderu
    with (ally_omino)
        {if idling=1
        if idleorder=ordero
            {selected=1
            view_xview[0]=x-view_wview[0]/2
            view_yview[0]=y-view_hview[0]/2
            global.sel+=1
            with (idle_clicker)
                {orderu+=1
                if orderu>global.idle
                orderu=1}}}
    mouse_clear(mb_left)}

// --- azione 2: execute code ---
///posisione
depth=-9999
x=view_xview[0]+view_wport[0]*global.scaleview-90*global.scaleview
y=view_yview[0]+100*global.scaleview
image_xscale=global.scaleview
image_yscale=global.scaleview
