// android_manager — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/android_manager.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
    bi1=browser_width
    bi2=browser_height
    surface_resize(application_surface,bi1-5,bi2-5)
    window_set_size(bi1-5,bi2-5)
    view_wview[0]=bi1-5
    view_wport[0]=bi1-5
    view_hview[0]=bi2-5
    view_hport[0]=bi2-5
with(pietra_grande)
    {x=view_wview[0]/2
    y=view_hview[0]/2}
