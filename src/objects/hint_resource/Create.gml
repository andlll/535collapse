// hint_resource — Create (eventtype=0 enumb=0)
// Estratto da gmx/objects/hint_resource.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
titolo="Resources gathering"
testo="Use your workers to gather resources. With at least one worker selected right click on a resource to start collecting it."
draw_set_font(overdue)
testo_h=string_height_ext(testo,30,340)
draw_set_font(GUI_1)
global.resourcehint=1
posx=20
posy=170
hover=0
