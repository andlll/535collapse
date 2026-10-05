// android_manager — Draw_End (eventtype=8 enumb=73)
// Estratto da gmx/objects/android_manager.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
draw_set_font(overdue)
draw_set_halign(fa_center)
if os_type=os_android
draw_text(view_wview[0]/2,view_hview[0]/2+200,"Android devices are not supported")
if os_type=os_ios
draw_text(view_wview[0]/2,view_hview[0]/2+200,"iPhones are not supported")
draw_text(view_wview[0]/2,view_hview[0]/2+300,"The game is compatible with desktop systems")
draw_text(view_wview[0]/2,view_hview[0]/2+400,"like Windows, Mac and Linux")
draw_sprite(pietra_grande1,0,view_wview[0]/2,view_hview[0]/2)
