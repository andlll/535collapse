// manager — KeyRelease_Delete (eventtype=10 enumb=46)
// Estratto da gmx/objects/manager.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Trucco visibilità
if global.sele=1 && global.visia=1
    {if global.fogville=1 
    global.fogville=0
    else
    global.fogville=1}
