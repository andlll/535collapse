// lvl1_surface_generato — Draw (eventtype=8 enumb=0)
// Estratto da gmx/objects/lvl1_surface_generato.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
var tex_w = sprite_get_width(erba_spr);
var tex_h = sprite_get_height(erba_spr);

for (posx = 0; posx < room_width; posx += tex_w) {
    for (posy = 4040; posy < room_height; posy += tex_h) {
        draw_sprite(erba_spr, 0, posx, posy);
    }
}
