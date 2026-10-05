// resizer_manager — Draw_GUI (eventtype=8 enumb=64)
// Estratto da gmx/objects/resizer_manager.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
draw_set_alpha(0.49)
    draw_roundrect_colour_ext(20,20,690,690,80,80,c_red,c_orange,false)
    draw_roundrect_colour_ext(20,view_hview[0]-20,690,view_hview[0]-690,80,80,c_teal,c_aqua,false)
draw_set_alpha(1)
draw_set_font(GUI_1)
if view_hview[0]-690<690
draw_set_colour(c_red)
else
draw_set_colour(c_white)
draw_set_halign(fa_center)
draw_text(view_wview[0]/2,100,"WARNING")
draw_set_font(overdue)
draw_text(view_wview[0]/2,200,"Regulate the zoom level of the browser window to avoid overlapping issues")
draw_text(view_wview[0]/2,260,"Use Ctrl+scrolling wheel on Windows and View > Zoom Out/in on mac")
draw_text(view_wview[0]/2,320,"If the squares on the left overlap the zoom level is excessive")
if view_hview[0]-690<690
draw_sprite(smile2,0,view_wview[0]/2,600)
else
draw_sprite(smile1,0,view_wview[0]/2,600)
if view_hview[0]-690>690
draw_text(view_wview[0]/2,view_hview[0]-40,"Press ENTER to continue to the menu")
draw_set_blend_mode(bm_add)
    draw_set_alpha(0.7)
    draw_circle_colour(mouse_x,mouse_y,30,c_white,c_black,false)
    draw_set_alpha(1)
    draw_set_blend_mode(bm_normal)
