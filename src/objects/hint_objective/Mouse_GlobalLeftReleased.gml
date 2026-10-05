// hint_objective — Mouse_GlobalLeftReleased (eventtype=6 enumb=56)
// Estratto da gmx/objects/hint_objective.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///crea hint objective 2
if mouse_x>view_xview[0]+posx*global.scaleview && mouse_x<view_xview[0]+posx*global.scaleview+380*global.scaleview && mouse_y>view_yview[0]+posy*global.scaleview && mouse_y<view_yview[0]+posy*global.scaleview+testo_h*global.scaleview+68*global.scaleview
    {instance_create(0,0,hint_objective2)
    instance_destroy()}
