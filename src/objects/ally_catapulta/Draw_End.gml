// ally_catapulta — Draw_End (eventtype=8 enumb=73)
// Estratto da gmx/objects/ally_catapulta.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if selected=1 || hover=1
    {draw_rectangle_colour(x-25,y-75,x+25,y-82,c_black,c_black,c_black,c_black,false)
    draw_rectangle_colour(x-25,y-75,x-25+life/slife*50,y-82,c_green,c_green,c_green,c_green,false)
    draw_sprite(circ_1,0,x,y)
    if action=1
    draw_sprite(director_blue,0,dirox,diroy)
    draw_sprite(director_blue,0,foodx,foody)}
if hit=1
    {draw_rectangle_colour(x-25,y-75,x+25,y-82,c_black,c_black,c_black,c_black,false)
    draw_rectangle_colour(x-25,y-75,x-25+life/slife*50,y-82,c_green,c_green,c_green,c_green,false)}
if assi!=0
    {
    draw_set_alpha(.3)
    draw_set_font(GUI_1)
    draw_set_halign(fa_center)
    if assi!=10
    draw_text(x,y-100,assi)
    else
    draw_text(x,y-100,"0")
    draw_set_font(GUI_1)
    draw_set_alpha(1)
    }
