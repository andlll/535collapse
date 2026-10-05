// manager — Other_RoomEnd (eventtype=7 enumb=5)
// Estratto da gmx/objects/manager.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
part_emitter_destroy(rain,rain_emitter)
part_system_destroy(rain)
global.raining=0
if (surface_exists(fog))
{surface_free(fog)}
if (surface_exists(blackfog))
{surface_free(blackfog)}
if (surface_exists(nite))
{surface_free(nite)}
