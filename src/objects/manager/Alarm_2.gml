// manager — Alarm_2 (eventtype=2 enumb=2)
// Estratto da gmx/objects/manager.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///resize sperando consumi meno
alarm[2]=10
//resize per finestra
if browser_width!=bi1 or browser_height!=bi2
    {
    bi1=browser_width
    bi2=browser_height
    surface_resize(application_surface,bi1-5,bi2-5)
    window_set_size(bi1-5,bi2-5)
    view_wview[0]=(bi1-5)*global.scaleview
    view_wport[0]=bi1-5
    view_hview[0]=(bi2-5)*global.scaleview
    view_hport[0]=bi2-5}
//spegnimento incendi
if global.raining=1
with(ally_wooden)
onfire=0
