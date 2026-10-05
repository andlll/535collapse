// manager — KeyPress_X (eventtype=9 enumb=88)
// Estratto da gmx/objects/manager.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///zoom out
if global.sele=1
global.sz++
else
{if global.scaleview<1.5 && room!=menu
global.scaleview+=0.1
    bi1=browser_width
    bi2=browser_height
    surface_resize(application_surface,bi1-5,bi2-5)
    window_set_size(bi1-5,bi2-5)
    view_wview[0]=(bi1-5)*global.scaleview
    view_wport[0]=bi1-5
    view_hview[0]=(bi2-5)*global.scaleview
    view_hport[0]=bi2-5}
