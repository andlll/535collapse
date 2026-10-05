// gameover_manager — Draw_GUI (eventtype=8 enumb=64)
// Estratto da gmx/objects/gameover_manager.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///il coso finale
score=global.seconds+60*global.minutes+3600*global.hours+1000*global.basidistrutte+global.victory*1000
draw_set_colour(c_black)
draw_set_alpha(fogalpha)
if fogalpha>0
draw_rectangle(0,0,view_wview[0],view_hview[0],false)
draw_set_alpha(1)
if fogalpha>=1
    {draw_set_colour(c_white)
    draw_set_halign(fa_center)
    draw_text(view_wview[0]/2,view_hview[0]/2-200,"Your town hall was destroyed.")
    draw_text(view_wview[0]/2,view_hview[0]/2-100,"You resisted for "+global.hours+" hours, "+global.minutes+" minutes and "+global.seconds+" seconds.")  
    draw_text(view_wview[0]/2,view_hview[0]/2,global.basidistrutte+" enemy bases were sucessfully destroyed.")
    draw_text(view_wview[0]/2,view_hview[0]/2+100,"The final score is "+score)}
