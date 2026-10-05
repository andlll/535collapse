// mouser — Draw_End (eventtype=8 enumb=73)
// Estratto da gmx/objects/mouser.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Effetti puntatore mouse
if pausa=1
    {draw_set_colour(c_black)
    draw_rectangle(0,0,room_width,room_height,false)}
draw_set_blend_mode(bm_add)
draw_set_alpha(0.7)
if global.sel>0 &&  global.milsel<global.sel
    {if global.minierahover=1
    draw_circle_colour(x,y,60,c_yellow,c_black,false)
    if global.alberhover=1
    draw_circle_colour(x,y,60,c_green,c_black,false)
    if global.farmhover=1
    draw_circle_colour(x,y,60,c_teal,c_black,false)
    if global.stonehover=1
    draw_circle_colour(x,y,60,c_gray,c_black,false)
    if global.buildhover=1
    draw_circle_colour(x,y,60,c_orange,c_black,false)
    else
    if global.minierahover=0 && global.alberhover=0 && global.farmhover=0 && global.stonehover=0 && global.buildhover=0
    draw_circle_colour(x,y,30,c_white,c_black,false)}
else
    {if global.enemyhover=0
    draw_circle_colour(x,y,30,c_white,c_black,false)
    else
    draw_circle_colour(x,y,60,c_red,c_black,false)}
if global.arcsel>0
    {if global.preshover=1
    draw_circle_colour(x,y,60,c_aqua,c_black,false)
    else
    draw_circle_colour(x,y,30,c_white,c_black,false)}
if global.firesel>0
    {if position_meeting(mouse_x,mouse_y,enemy_wooden)
    draw_circle_colour(x,y,60,c_red,c_black,false)
    else
    draw_circle_colour(x,y,30,c_white,c_black,false)}
if global.siegsel>0
    {if position_meeting(mouse_x,mouse_y,enemy_build)
    draw_circle_colour(x,y,60,c_red,c_black,false)
    else
    draw_circle_colour(x,y,30,c_white,c_black,false)}
with(centro)
if selected=1
var censel=1
else
var censel=0
if censel=1
    {if global.minierahover=1
    draw_circle_colour(x,y,60,c_yellow,c_black,false)
    if global.alberhover=1
    draw_circle_colour(x,y,60,c_green,c_black,false)
    if global.farmhover=1
    draw_circle_colour(x,y,60,c_teal,c_black,false)
    if global.stonehover=1
    draw_circle_colour(x,y,60,c_gray,c_black,false)
    if global.buildhover=1
    draw_circle_colour(x,y,60,c_orange,c_black,false)
    else
    if global.minierahover=0 && global.alberhover=0 && global.farmhover=0 && global.stonehover=0 && global.buildhover=0
    draw_circle_colour(x,y,30,c_white,c_black,false)}
draw_set_alpha(1)
draw_set_blend_mode(bm_normal)
if room==resizer
    {draw_set_blend_mode(bm_add)
    draw_set_alpha(0.7)
    draw_circle_colour(x,y,30,c_white,c_black,false)
    draw_set_alpha(1)
    draw_set_blend_mode(bm_normal)}
if global.debugging>0
    {
    draw_text(mouse_x,mouse_y,x-view_wview[0]/2-view_xview[0])
    draw_text(mouse_x,mouse_y+50,y-view_hview[0]/2-view_yview[0])}
