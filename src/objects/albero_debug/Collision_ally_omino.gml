// albero_debug — Collision_ally_omino (eventtype=4 ename=ally_omino)
// Estratto da gmx/objects/albero_debug.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: drag&drop action_if_variable ---
if (woodwork == 1)
{
    // --- azione 2: drag&drop action_if_variable ---
    if (other.woodwork == 1)
    {
        // --- azione 3: execute code (applies to: other -> with) ---
        with (other) {
            action=2
            woodwork=0
            alarm[2]=13
            step=0
        }
    }
}
