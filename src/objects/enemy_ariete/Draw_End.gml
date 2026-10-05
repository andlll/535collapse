// enemy_ariete — Draw_End (eventtype=8 enumb=73)
// Estratto da gmx/objects/enemy_ariete.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if selected=1 || hover=1
    {draw_rectangle_colour(x-25,y-75,x+25,y-82,c_black,c_black,c_black,c_black,false)
    draw_rectangle_colour(x-25,y-75,x-25+life/slife*50,y-82,c_blue,c_blue,c_blue,c_blue,false)
    draw_sprite(circ_1,0,x,y)
    if action=1
    draw_sprite(director_blue,0,dirox,diroy)
    draw_sprite(director_blue,0,foodx,foody)}
if hit=1
    {draw_rectangle_colour(x-25,y-75,x+25,y-82,c_black,c_black,c_black,c_black,false)
    draw_rectangle_colour(x-25,y-75,x-25+life/slife*50,y-82,c_blue,c_blue,c_blue,c_blue,false)}
