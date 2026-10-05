// torre — Draw_End (eventtype=8 enumb=73)
// Estratto da gmx/objects/torre.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if selected=1
    {draw_set_halign(fa_center)
    draw_text(x,y-200,npresidio+"/2")
    draw_set_halign(fa_left)}
if hover=1 || hit=1 || selected=1
    {draw_rectangle_colour(x-25,y-205,x+25,y-212,c_black,c_black,c_black,c_black,false)
    draw_rectangle_colour(x-25,y-205,x-25+life/slife*50,y-212,c_green,c_green,c_green,c_green,false)}
