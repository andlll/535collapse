// dialogo_2_13 — Mouse_GlobalLeftPressed (eventtype=6 enumb=53)
// Estratto da gmx/objects/dialogo_2_13.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Distruggi
if mouse_x>view_xview[0]+posx*global.scaleview && mouse_x<view_xview[0]+posx*global.scaleview+380*global.scaleview && mouse_y>view_yview[0]+posy*global.scaleview && mouse_y<view_yview[0]+posy*global.scaleview+testo_h*global.scaleview+68*global.scaleview && arm=1
    {with(mouser)
        {x=500
        y=600}
    view_xview[0]=mouser.x
    view_yview[0]=mouser.y
    instance_destroy()}
