// ally_omino — KeyRelease_Enter (eventtype=10 enumb=13)
// Estratto da gmx/objects/ally_omino.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///impostazioni di step

mp_potential_settings(30,3,3,true)

// --- azione 2: drag&drop action_if_variable ---
if (action == 1)
{
    // --- azione 3: drag&drop action_potential_step [assoluto] ---
    action_potential_step(dirox, diroy, autospeed, 0);
}
