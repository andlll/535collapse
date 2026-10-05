// victory_manager — Draw_GUI (eventtype=8 enumb=64)
// Estratto da gmx/objects/victory_manager.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Disegno interfaccia
score=global.seconds+60*global.minutes+3600*global.hours+1000*global.basidistrutte+1000
draw_set_colour(c_white)
draw_set_alpha(fogalpha)
draw_rectangle(0,0,view_wview[0],view_hview[0],false)
if fogalpha>=0.7
    {draw_set_colour(c_black)
    draw_set_halign(fa_center)
    draw_set_font(gui_sblocco)
    draw_text(view_wview[0]/2,view_hview[0]/2-200,"VICTORY")
    draw_set_font(overdue)
    if room=match
        {draw_text(view_wview[0]/2,view_hview[0]/2-100,"You destroyed all the secondary enemy bases")  
        draw_text(view_wview[0]/2,view_hview[0]/2,"Your partial score is "+score)}
    if room=lvl01
        {draw_text(view_wview[0]/2,view_hview[0]/2+200,"Code to unlock the next level:")
        draw_set_font(gui_sblocco)
        draw_text(view_wview[0]/2,view_hview[0]/2+300,"4 9 2 1 7")}
    if room=lvl02
        {draw_text(view_wview[0]/2,view_hview[0]/2+200,"Code to unlock the next level:")
        draw_set_font(gui_sblocco)
        draw_text(view_wview[0]/2,view_hview[0]/2+300,"5 8 4 2 1")}
    if clicloc=1
    draw_text(view_wview[0]/2,view_hview[0]/2+100,"click anywhere to continue")}
