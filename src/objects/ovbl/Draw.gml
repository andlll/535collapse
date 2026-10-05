// ovbl — Draw (eventtype=8 enumb=0)
// Estratto da gmx/objects/ovbl.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---


// --- azione 2: execute code ---
{if place=1
{draw_sprite_ext(m_vert,0,x,y,1,1,0,c_white,0.5)
draw_sprite(x,y,0,ovbl)}
else
{draw_sprite_ext(m_vert,0,x,y,1,1,0,c_red,0.5)
draw_sprite(x,y,0,ovbl)}
}
