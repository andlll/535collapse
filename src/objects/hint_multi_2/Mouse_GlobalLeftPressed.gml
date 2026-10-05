// hint_multi_2 — Mouse_GlobalLeftPressed (eventtype=6 enumb=53)
// Estratto da gmx/objects/hint_multi_2.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///distruggi
if mouse_x>view_xview[0]+posx*global.scaleview && arm=1 && mouse_x<view_xview[0]+posx*global.scaleview+380*global.scaleview && mouse_y>view_yview[0]+posy*global.scaleview && mouse_y<view_yview[0]+posy*global.scaleview+testo_h*global.scaleview+68*global.scaleview
    {
    instance_destroy()}
