// manager — Draw_End (eventtype=8 enumb=73)
// Estratto da gmx/objects/manager.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///debug cost field
if global.debugging=1
    {draw_set_alpha(0.5)
    for (var xa = 0; xa < global.grid_width; xa++) {
        for (var ya = 0; ya < global.grid_height; ya++) {
            var px = xa * global.grid_size;
            var py = ya * global.grid_size;
            var cost = ds_grid_get(global.cost_field, xa, ya);
            
            // Colore in base al valore della cella
            if (cost == 1000) {
                draw_set_color(c_red);
            } else {
                draw_set_color(make_color_rgb(144, 238, 144)); // Verde chiaro
            }
            
            draw_rectangle(px, py, px + global.grid_size, py + global.grid_size, false);
        }
    }
    draw_set_alpha(1)}

// --- azione 2: execute code ---
///schermata nera attorno a room
draw_set_color(c_black);

// Sopra la room
draw_rectangle(-10000, -10000, room_width+10000, 0, false);

// Sotto la room
draw_rectangle(-10000, room_height, room_width+10000, room_height+10000, false);

// Sinistra della room
draw_rectangle(-10000, 0, 0, room_height, false);

// Destra della room
draw_rectangle(room_width, 0, room_width+10000, room_height, false);
draw_set_color(c_white);

// --- azione 3: execute code ---
///disegna il rettangolo di selezione
if global.multi=1
{if global.night=0
draw_rectangle_colour(global.startx,global.starty,mouse_x,mouse_y,c_blue,c_blue,c_blue,c_blue,true)
else
draw_rectangle_colour(global.startx,global.starty,mouse_x,mouse_y,c_white,c_white,c_white,c_white,true)
}

// --- azione 4: execute code ---
///debug robe varie

// --- azione 5: execute code ---
///superfici
if room!=menu && global.fogville=1
{if surface_exists(fog)
{surface_set_target(fog)
var col = make_colour_rgb(110, 110, 110);
draw_rectangle_colour(view_xview[0],view_yview[0],view_xview[0]+view_wview[0],view_yview[0]+view_hview[0],col,col,col,col,false)
with (ally_unit)
draw_ellipse_colour(x-200-200*(1-global.night),y-120-120*(1-global.night),x+200+200*(1-global.night),y+120+120*(1-global.night),c_black,c_black,false)
with (ally_build)
draw_ellipse_colour(x-200-200*(1-global.night),y-120-120*(1-global.night),x+200+200*(1-global.night),y+120+120*(1-global.night),c_black,c_black,false)
with (palo_1)
draw_ellipse_colour(x-200-200*(1-global.night),y-120-120*(1-global.night),x+200+200*(1-global.night),y+120+120*(1-global.night),c_black,c_black,false)
with (castello)
draw_ellipse_colour(x-500-500*(1-global.night),y-300-300*(1-global.night),x+500+500*(1-global.night),y+300+300*(1-global.night),c_black,c_black,false)
with (torre)
draw_ellipse_colour(x-500-500*(1-global.night),y-300-300*(1-global.night),x+500+500*(1-global.night),y+300+300*(1-global.night),c_black,c_black,false)
with (centro)
draw_ellipse_colour(x-300-300*(1-global.night),y-180-180*(1-global.night),x+300+300*(1-global.night),y+180+180*(1-global.night),c_black,c_black,false)
with (mura_ori)
draw_ellipse_colour(x-300-200*(1-global.night),y-120-120*(1-global.night),x+300+200*(1-global.night),y+120+120*(1-global.night),c_black,c_black,false)
with (mura_ori_fond)
draw_ellipse_colour(x-300-200*(1-global.night),y-120-120*(1-global.night),x+300+200*(1-global.night),y+120+120*(1-global.night),c_black,c_black,false)
with (porta_ori)
draw_ellipse_colour(x-300-200*(1-global.night),y-120-120*(1-global.night),x+300+200*(1-global.night),y+120+120*(1-global.night),c_black,c_black,false)
with (mura_vert)
draw_ellipse_colour(x-200-200*(1-global.night),y-370-120*(1-global.night),x+200+200*(1-global.night),y+120+120*(1-global.night),c_black,c_black,false)
with (mura_vert_fond)
draw_ellipse_colour(x-200-200*(1-global.night),y-370-120*(1-global.night),x+200+200*(1-global.night),y+120+120*(1-global.night),c_black,c_black,false)
with (porta_vert)
draw_ellipse_colour(x-200-200*(1-global.night),y-370-120*(1-global.night),x+200+200*(1-global.night),y+120+120*(1-global.night),c_black,c_black,false)
surface_reset_target()
draw_set_blend_mode(bm_subtract)
draw_surface(fog,0,0)
draw_set_blend_mode(bm_normal)
}
else
{fog=surface_create(room_width,room_height)
surface_set_target(fog)
draw_clear_alpha(c_black,1)
surface_reset_target()}

if surface_exists(blackfog) //nebbia di guerra
    {surface_set_target(blackfog)
    with (ally_unit)
    draw_ellipse_colour(x-200-200*(1-global.night),y-120-120*(1-global.night),x+200+200*(1-global.night),y+120+120*(1-global.night),c_black,c_black,false)
    with (ally_build)
    draw_ellipse_colour(x-200-200*(1-global.night),y-120-120*(1-global.night),x+200+200*(1-global.night),y+120+120*(1-global.night),c_black,c_black,false)
    with (palo_1)
    draw_ellipse_colour(x-200-200*(1-global.night),y-120-120*(1-global.night),x+200+200*(1-global.night),y+120+120*(1-global.night),c_black,c_black,false)
    with (castello)
    draw_ellipse_colour(x-500-500*(1-global.night),y-300-300*(1-global.night),x+500+500*(1-global.night),y+300+300*(1-global.night),c_black,c_black,false)
    with (torre)
    draw_ellipse_colour(x-500-500*(1-global.night),y-300-300*(1-global.night),x+500+500*(1-global.night),y+300+300*(1-global.night),c_black,c_black,false)
    with (centro)
    draw_ellipse_colour(x-300-300*(1-global.night),y-180-180*(1-global.night),x+300+300*(1-global.night),y+180+180*(1-global.night),c_black,c_black,false)
    with (mura_ori)
    draw_ellipse_colour(x-300-200*(1-global.night),y-120-120*(1-global.night),x+300+200*(1-global.night),y+120+120*(1-global.night),c_black,c_black,false)
    with (porta_ori)
    draw_ellipse_colour(x-300-200*(1-global.night),y-120-120*(1-global.night),x+300+200*(1-global.night),y+120+120*(1-global.night),c_black,c_black,false)
    with (mura_ori_fond)
    draw_ellipse_colour(x-300-200*(1-global.night),y-120-120*(1-global.night),x+300+200*(1-global.night),y+120+120*(1-global.night),c_black,c_black,false)
    with (mura_vert)
    draw_ellipse_colour(x-200-200*(1-global.night),y-370-120*(1-global.night),x+200+200*(1-global.night),y+120+120*(1-global.night),c_black,c_black,false)
    with (mura_vert_fond)
    draw_ellipse_colour(x-200-200*(1-global.night),y-370-120*(1-global.night),x+200+200*(1-global.night),y+120+120*(1-global.night),c_black,c_black,false)
    with (porta_vert)
    draw_ellipse_colour(x-200-200*(1-global.night),y-370-120*(1-global.night),x+200+200*(1-global.night),y+120+120*(1-global.night),c_black,c_black,false)
    with (o_statua1)
    if attiva=1
    draw_ellipse_colour(x-200-200*(1-global.night),y-120-120*(1-global.night),x+200+200*(1-global.night),y+120+120*(1-global.night),c_black,c_black,false)
    with (o_statua2)
    if attiva=1
    draw_ellipse_colour(x-200-200*(1-global.night),y-120-120*(1-global.night),x+200+200*(1-global.night),y+120+120*(1-global.night),c_black,c_black,false)
    with (o_statua3)
    if attiva=1
    draw_ellipse_colour(x-200-200*(1-global.night),y-120-120*(1-global.night),x+200+200*(1-global.night),y+120+120*(1-global.night),c_black,c_black,false)
    with (o_statua4)
    if attiva=1
    draw_ellipse_colour(x-200-200*(1-global.night),y-120-120*(1-global.night),x+200+200*(1-global.night),y+120+120*(1-global.night),c_black,c_black,false)
    surface_reset_target()
    draw_set_blend_mode(bm_subtract)
    draw_surface(blackfog,0,0)
    draw_set_blend_mode(bm_normal)
    }
else
    {blackfog=surface_create(room_width,room_height)
    surface_set_target(blackfog)
    draw_clear_alpha(c_white,1)
    surface_reset_target()}

var n2=merge_colour(c_black,c_orange,global.night) //luce da fuoco
if surface_exists(nite)
    {surface_set_target(nite)
    draw_clear_alpha(n2,1)
    with (flameqq)
    draw_sprite_ext( arealight, 0, x, y, 3+0.15 * sin(x+global.frame * 0.17), 3+0.15 * sin(x+global.frame * 0.17), 0, c_white, 1)
    with (firestarter)
    draw_sprite_ext( arealight, 0, x, y, 3+0.15 * sin(x+global.frame * 0.17), 3+0.15 * sin(x+global.frame * 0.17), 0, c_white, 1)
    with (firestarter_small)
    draw_sprite_ext( arealight, 0, x, y, 3+0.15 * sin(x+global.frame * 0.17), 3+0.15 * sin(x+global.frame * 0.17), 0, c_white, 1)
    with (casa)
    if onfire=1
    draw_sprite_ext( arealight, 0, x, y, 3+(1-life/slife)+0.15 * sin(x+global.frame * 0.17), 3+(1-life/slife)+0.15 * sin(x+global.frame * 0.17), 0, c_white, 1)
    with (barn)
    if onfire=1
    draw_sprite_ext( arealight, 0, x, y, 3+(1-life/slife)+0.15 * sin(x+global.frame * 0.17), 3+(1-life/slife)+0.15 * sin(x+global.frame * 0.17), 0, c_white, 1)
    with (magazzino)
    if onfire=1
    draw_sprite_ext( arealight, 0, x, y, 3+(1-life/slife)+0.15 * sin(x+global.frame * 0.17), 3+(1-life/slife)+0.15 * sin(x+global.frame * 0.17), 0, c_white, 1)
    with (caserma)
    if onfire=1
    draw_sprite_ext( arealight, 0, x, y, 4+(1-life/slife)+0.15 * sin(x+global.frame * 0.17), 4+(1-life/slife)+0.15 * sin(x+global.frame * 0.17), 0, c_white, 1)
    with (stalla)
    if onfire=1
    draw_sprite_ext( arealight, 0, x, y, 4+(1-life/slife)+0.15 * sin(x+global.frame * 0.17), 4+(1-life/slife)+0.15 * sin(x+global.frame * 0.17), 0, c_white, 1)
    with (enemy_house)
    if onfire=1
    draw_sprite_ext( arealight, 0, x, y, 3+(1-life/slife)+0.15 * sin(x+global.frame * 0.17), 3+(1-life/slife)+0.15 * sin(x+global.frame * 0.17), 0, c_white, 1)
    with (enemy_stalla)
    if onfire=1
    draw_sprite_ext( arealight, 0, x, y, 4+(1-life/slife)+0.15 * sin(x+global.frame * 0.17), 4+(1-life/slife)+0.15 * sin(x+global.frame * 0.17), 0, c_white, 1)
    with (enemy_caserma)
    if onfire=1
    draw_sprite_ext( arealight, 0, x, y, 4+(1-life/slife)+0.15 * sin(x+global.frame * 0.17), 4+(1-life/slife)+0.15 * sin(x+global.frame * 0.17), 0, c_white, 1)
    with (o_box1)
    if onfire=1
    draw_sprite_ext( arealight, 0, x, y, 2+(1-life/slife)+0.15 * sin(x+global.frame * 0.17), 2+(1-life/slife)+0.15 * sin(x+global.frame * 0.17), 0, c_white, 1)
    with (o_box2)
    if onfire=1
    draw_sprite_ext( arealight, 0, x, y, 2+(1-life/slife)+0.15 * sin(x+global.frame * 0.17), 2+(1-life/slife)+0.15 * sin(x+global.frame * 0.17), 0, c_white, 1)
    with (flameqq_small)
    draw_sprite_ext( arealight, 0, x, y, 2, 2, 0, c_white, 1)
    with (flameqq_nosmoke)
    draw_sprite_ext( arealight, 0, x, y, 3, 3, 0, c_white, 1)
    with (fire_bullet)
    draw_sprite_ext( arealight, 0, x, y, 1, 1, 0, c_white, 1)
    with (ally_infantry)
        {if action=6
        if step!=2
        draw_sprite_ext( arealight, 0, x, y-67, 1, 1, 0, c_white, 1)}
    surface_reset_target()
    draw_set_blend_mode(bm_subtract)
    draw_surface_ext(nite, 0, 0, 1, 1, 0, c_white, 1)
    draw_set_blend_mode(bm_normal)
    }
else
    {nite=surface_create(room_width,room_height)
    surface_set_target(nite)
    draw_clear_alpha(n2,1)
    surface_reset_target()}}
