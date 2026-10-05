// centro_indietro_clicker — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/centro_indietro_clicker.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///mouse sinistro
if hover=1
if mouse_check_button_released(mb_left)=true
{
with(centro)
{if selected=1
if progression!=0
{
global.food+=50
if coda>0
coda-=1
else
progression=0}}
mouse_clear(mb_left)}

// --- azione 2: execute code ---
x=view_xview[0]+520*global.scaleview
y=view_yview[0]+50*global.scaleview
depth=-y-999
image_xscale=global.scaleview
image_yscale=global.scaleview

// --- azione 3: execute code ---
if hover=1
global.sele=1
else
global.sele=0
