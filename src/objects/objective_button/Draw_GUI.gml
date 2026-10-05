// objective_button — Draw_GUI (eventtype=8 enumb=64)
// Estratto da gmx/objects/objective_button.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Disegna riquadro obiettivi
if room==match
var nobs=4
if room==lvl01 || room==lvl02
var nobs=3
if global.obj=1
    {draw_set_alpha(0.69)
    draw_roundrect_colour_ext(view_wport[0]-520,20,view_wport[0]-120,38+30*nobs,60,60,c_white,c_white,false)
    draw_set_font(GUI_1)
    draw_set_colour(c_black)
    draw_set_valign(fa_bottom)
    draw_set_halign(fa_left)
    draw_set_alpha(0.75)
    draw_set_font(overdue)
    if room==match
        {draw_text(view_wport[0]-500,58,"Survive for the most time possible")
        draw_text(view_wport[0]-500,88,"Destroy the enemy secondary bases ("+global.basidistrutte+"/3)")
        draw_text(view_wport[0]-500,118,"Survival time: "+global.hours+" hrs "+global.minutes+" min "+global.seconds+" sec" )
        draw_text(view_wport[0]-500,148,"Number of waves: "+global.waves)}
    if room==lvl01
        {draw_text(view_wport[0]-500,58,"Reach the norther gates and escape the city")
        if global.dialogochest=1
        draw_text(view_wport[0]-500,88,"Destroy the chests to gather resources")
        if global.lvl01_gate=1
        draw_text(view_wport[0]-500,118,"Use the barracks to train more soldiers")}
    if room==lvl02
        {draw_text(view_wport[0]-500,58,"Free the villages under attack ("+global.liberati+"/7)") 
        if global.liberati=7
            {draw_set_colour(c_black)
            draw_rectangle(view_wport[0]-500,43,view_wport[0]-500+string_width("Free the villages under attack ("+global.liberati+"/7)"),45,false)
            }
        draw_text(view_wport[0]-500,88,"Use the freed paesants to build your base")
        draw_text(view_wport[0]-500,118,"Destroy all the enemy buildings")
        if instance_number(enemy_build)=0
            {draw_set_colour(c_black)
            draw_rectangle(view_wport[0]-500,103,view_wport[0]-500+string_width("Destroy all the enemy buildings"),105,false)
            }}
    draw_set_font(GUI_1)
    draw_set_valign(fa_middle)
    draw_set_alpha(1)}
