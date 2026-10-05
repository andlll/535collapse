// campo — Draw_End (eventtype=8 enumb=73)
// Estratto da gmx/objects/campo.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if selected=1
{draw_rectangle_colour(x-25,y-75,x+25,y-82,c_black,c_black,c_black,c_black,false)
draw_rectangle_colour(x-25,y-75,x-25+life/slife*50,y-82,c_green,c_green,c_green,c_green,false)
}
if hover=1 || hit=1
{draw_rectangle_colour(x-25,y-75,x+25,y-82,c_black,c_black,c_black,c_black,false)
draw_rectangle_colour(x-25,y-75,x-25+life/slife*50,y-82,c_green,c_green,c_green,c_green,false)}
