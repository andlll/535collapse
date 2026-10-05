// mouser — Step_End (eventtype=3 enumb=2)
// Estratto da gmx/objects/mouser.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Menu pausa pulsanti
if mouse_x>view_xview[0]+view_wview[0]/2-225 && mouse_y>view_yview[0]+view_hview[0]-400 && mouse_x<view_xview[0]+view_wview[0]/2+25 && mouse_y<view_yview[0]+view_hview[0]-340
hoverresume=1
else
hoverresume=0
if mouse_x>view_xview[0]+view_wview[0]/2+55 && mouse_y>view_yview[0]+view_hview[0]-400 && mouse_x<view_xview[0]+view_wview[0]/2+225 && mouse_y<view_yview[0]+view_hview[0]-340
hoverhints=1
else
hoverhints=0
if mouse_x>view_xview[0]+view_wview[0]/2-225 && mouse_y>view_yview[0]+view_hview[0]-320 && mouse_x<view_xview[0]+view_wview[0]/2+25 && mouse_y<view_yview[0]+view_hview[0]-260
hoverrestart=1
else
hoverrestart=0
if mouse_x>view_xview[0]+view_wview[0]/2+55 && mouse_y>view_yview[0]+view_hview[0]-320 && mouse_x<view_xview[0]+view_wview[0]/2+225 && mouse_y<view_yview[0]+view_hview[0]-260
hoverobj=1
else
hoverobj=0
if mouse_x>view_xview[0]+view_wview[0]/2-225 && mouse_y>view_yview[0]+view_hview[0]-240 && mouse_x<view_xview[0]+view_wview[0]/2+25 && mouse_y<view_yview[0]+view_hview[0]-180
hovermenu=1
else
hovermenu=0
if mouse_x>view_xview[0]+view_wview[0]/2+55 && mouse_y>view_yview[0]+view_hview[0]-240 && mouse_x<view_xview[0]+view_wview[0]/2+225 && mouse_y<view_yview[0]+view_hview[0]-180
hoverfps=1
else
hoverfps=0
if mouse_x>view_xview[0]+view_wview[0]-90*global.scaleview && mouse_x<view_xview[0]+view_wview[0]-20*global.scaleview && y>view_yview[0]+20*global.scaleview && y<view_yview[0]+80*global.scaleview
hoverpb=1
else
hoverpb=0
