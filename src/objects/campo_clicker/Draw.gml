// campo_clicker — Draw (eventtype=8 enumb=0)
// Estratto da gmx/objects/campo_clicker.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if active=1
with(campo_placer)
{if place=1
draw_sprite_ext(campo1,0,mouse_x,mouse_y,1,1,0,c_white,0.5)
else
draw_sprite_ext(campo1,0,mouse_x,mouse_y,1,1,0,c_red,0.5)
}
