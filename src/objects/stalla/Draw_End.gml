// stalla — Draw_End (eventtype=8 enumb=73)
// Estratto da gmx/objects/stalla.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if flagx!=nope && flagy!=nope
if selected=1
{draw_sprite(director_blue,0,flagx,flagy)
draw_line_width_color(x,y,flagx,flagy,2,c_white,c_white)}
if selected=1
{draw_rectangle_colour(x-25,y-75,x+25,y-82,c_black,c_black,c_black,c_black,false)
draw_rectangle_colour(x-25,y-75,x-25+life/slife*50,y-82,c_green,c_green,c_green,c_green,false)
}
if hover=1 || hit=1
{draw_rectangle_colour(x-25,y-75,x+25,y-82,c_black,c_black,c_black,c_black,false)
draw_rectangle_colour(x-25,y-75,x-25+life/slife*50,y-82,c_green,c_green,c_green,c_green,false)}
