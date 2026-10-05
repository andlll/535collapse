// casa_clicker — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/casa_clicker.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
x=view_xview[0]+450*global.scaleview
y=view_yview[0]+50*global.scaleview
depth=-y-999
if instance_number(casa_placer)!=0
global.sele=1
if global.sel=0 || global.milsel!=0
alarm[0]=1
image_xscale=global.scaleview
image_yscale=global.scaleview
