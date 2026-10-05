// ally_omino — Step_Begin (eventtype=3 enumb=1)
// Estratto da gmx/objects/ally_omino.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///se non ci sono pulsanti costruzione in giro
if instance_number(torre_placer)>0
global.sele=1
pass=1 //resetta pass, poi se collide torna di nuovo a 0
