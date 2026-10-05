// mouser — Draw_GUI (eventtype=8 enumb=64)
// Estratto da gmx/objects/mouser.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Disegna menu di pausa
if pausa=1
    {draw_set_alpha(1)
    draw_set_halign(fa_center)
    draw_set_colour(c_white)
    draw_text_transformed(view_wview[0]/2,view_hview[0]/2+200,"GAME PAUSED",1,1,0)
    if hoverresume=0
    draw_set_alpha(0.69)
    else
    draw_set_alpha(0.99)
    draw_roundrect_colour_ext(view_wview[0]/2-225,view_hview[0]-400,view_wview[0]/2+25,view_hview[0]-340,60,60,c_white,c_white,false)
    if hoverhints=0
    draw_set_alpha(0.69)
    else
    draw_set_alpha(0.99)
    draw_roundrect_colour_ext(view_wview[0]/2+55,view_hview[0]-400,view_wview[0]/2+225,view_hview[0]-340,60,60,c_white,c_white,false)
    draw_set_alpha(0.49)
    if global.hint=0
        {draw_roundrect_colour_ext(view_wview[0]/2+55,view_hview[0]-400,view_wview[0]/2+115,view_hview[0]-340,60,60,c_red,c_red,false)
        draw_set_alpha(0.99)
        draw_sprite(ico_false,0,view_wview[0]/2+85,view_hview[0]-370)}
    else
        {draw_roundrect_colour_ext(view_wview[0]/2+55,view_hview[0]-400,view_wview[0]/2+225,view_hview[0]-340,60,60,c_green,c_green,false)
        draw_set_alpha(0.99)
        draw_sprite(ico_true,0,view_wview[0]/2+85,view_hview[0]-370)}
    if hoverrestart=0
    draw_set_alpha(0.69)
    else
    draw_set_alpha(0.99)
    draw_roundrect_colour_ext(view_wview[0]/2-225,view_hview[0]-320,view_wview[0]/2+25,view_hview[0]-260,60,60,c_white,c_white,false)
    if hoverobj=0
    draw_set_alpha(0.69)
    else
    draw_set_alpha(0.99)
    draw_roundrect_colour_ext(view_wview[0]/2+55,view_hview[0]-320,view_wview[0]/2+225,view_hview[0]-260,60,60,c_white,c_white,false)
    draw_set_alpha(0.49)
    if global.obj=0
        {draw_roundrect_colour_ext(view_wview[0]/2+55,view_hview[0]-320,view_wview[0]/2+115,view_hview[0]-260,60,60,c_red,c_red,false)
        draw_set_alpha(0.99)
        draw_sprite(ico_false,0,view_wview[0]/2+85,view_hview[0]-290)}
    else
        {draw_roundrect_colour_ext(view_wview[0]/2+55,view_hview[0]-320,view_wview[0]/2+225,view_hview[0]-260,60,60,c_green,c_green,false)
        draw_set_alpha(0.99)
        draw_sprite(ico_true,0,view_wview[0]/2+85,view_hview[0]-290)}
    if hovermenu=0
    draw_set_alpha(0.69)
    else
    draw_set_alpha(0.99)
    draw_roundrect_colour_ext(view_wview[0]/2-225,view_hview[0]-240,view_wview[0]/2+25,view_hview[0]-180,60,60,c_white,c_white,false)
    if hoverfps=0
    draw_set_alpha(0.69)
    else
    draw_set_alpha(0.99)
    draw_roundrect_colour_ext(view_wview[0]/2+55,view_hview[0]-240,view_wview[0]/2+225,view_hview[0]-180,60,60,c_white,c_white,false)
    draw_set_alpha(0.49)
    if global.fps_show=0
        {draw_roundrect_colour_ext(view_wview[0]/2+55,view_hview[0]-240,view_wview[0]/2+115,view_hview[0]-180,60,60,c_red,c_red,false)
        draw_set_alpha(0.99)
        draw_sprite(ico_false,0,view_wview[0]/2+85,view_hview[0]-210)}
    else
        {draw_roundrect_colour_ext(view_wview[0]/2+55,view_hview[0]-240,view_wview[0]/2+225,view_hview[0]-180,60,60,c_green,c_green,false)
        draw_set_alpha(0.99)
        draw_sprite(ico_true,0,view_wview[0]/2+85,view_hview[0]-210)}
    draw_set_alpha(1)
    draw_set_halign(fa_center)
    draw_set_valign(fa_center)
    draw_set_font(GUI_1)
    draw_set_color(c_black)
    draw_set_alpha(1)
    draw_text(view_wview[0]/2-100,view_hview[0]-370,"Resume game")
    draw_text(view_wview[0]/2+170,view_hview[0]-370,"Hints")
    draw_text(view_wview[0]/2+170,view_hview[0]-290,"Objectives")
    draw_text(view_wview[0]/2+170,view_hview[0]-210,"FPS")
    draw_text(view_wview[0]/2-100,view_hview[0]-290,"Restart level")
    draw_text(view_wview[0]/2-100,view_hview[0]-210,"Back to main menu")
    draw_sprite(castello_f3,0,view_wview[0]/2,view_hview[0]/2)}
else
    {if hoverpb=0
    draw_set_alpha(0.69)
    else
    draw_set_alpha(0.99)
    if room!=menu
        {draw_roundrect_colour_ext(view_wport[0]-90,20,view_wport[0]-20,80,60,60,c_white,c_white,false)
        draw_sprite(icopausa,0,view_wport[0]-55,50)}
    draw_set_alpha(1)}

// --- azione 2: execute code ---
///test
draw_text(1000,1000,"num"+instance_number(atk_signal))
