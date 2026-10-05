// casa_clicker — Draw (eventtype=8 enumb=0)
// Estratto da gmx/objects/casa_clicker.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if active=1
with(casa_placer)
{if tipo=1
    {if place=1
    draw_sprite_ext(c1s,0,mouse_x,mouse_y,1,1,0,c_white,0.5)
    else
    draw_sprite_ext(c1s,0,mouse_x,mouse_y,1,1,0,c_red,0.5)
    }
if tipo=2
    {if place=1
    draw_sprite_ext(c2s,0,mouse_x,mouse_y,1,1,0,c_white,0.5)
    else
    draw_sprite_ext(c2s,0,mouse_x,mouse_y,1,1,0,c_red,0.5)
    }
if tipo=3
    {if place=1
    draw_sprite_ext(c3s,0,mouse_x,mouse_y,1,1,0,c_white,0.5)
    else
    draw_sprite_ext(c3s,0,mouse_x,mouse_y,1,1,0,c_red,0.5)
    }
if tipo=4
    {if place=1
    draw_sprite_ext(c4s,0,mouse_x,mouse_y,1,1,0,c_white,0.5)
    else
    draw_sprite_ext(c4s,0,mouse_x,mouse_y,1,1,0,c_red,0.5)
    }
if tipo=5
    {if place=1
    draw_sprite_ext(c5s,0,mouse_x,mouse_y,1,1,0,c_white,0.5)
    else
    draw_sprite_ext(c5s,0,mouse_x,mouse_y,1,1,0,c_red,0.5)
    }
if tipo=6
    {if place=1
    draw_sprite_ext(c6s,0,mouse_x,mouse_y,1,1,0,c_white,0.5)
    else
    draw_sprite_ext(c6s,0,mouse_x,mouse_y,1,1,0,c_red,0.5)
    }}
