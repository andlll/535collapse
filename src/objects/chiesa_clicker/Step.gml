// chiesa_clicker — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/chiesa_clicker.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
x=view_xview[0]+730*global.scaleview
y=view_yview[0]+50*global.scaleview
depth=-y-999
image_xscale=global.scaleview
image_yscale=global.scaleview
if instance_number(chiesa_placer)!=0
global.sele=1
if global.sel=0 || global.milsel!=0
instance_destroy()

// --- azione 2: execute code ---

