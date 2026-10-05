// hint_oro — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/hint_oro.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if mouse_x>view_xview[0]+posx*global.scaleview && mouse_x<view_xview[0]+posx*global.scaleview+380*global.scaleview && mouse_y>view_yview[0]+posy*global.scaleview && mouse_y<view_yview[0]+posy*global.scaleview+testo_h*global.scaleview+68*global.scaleview
hover=1
else
hover=0
posx=instance_nearest(mouse_x,mouse_y,miniera_oro).x/global.scaleview-view_xview[0]/global.scaleview
posy=instance_nearest(mouse_x,mouse_y,miniera_oro).y/global.scaleview-view_yview[0]/global.scaleview
