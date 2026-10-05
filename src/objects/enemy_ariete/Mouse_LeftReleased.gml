// enemy_ariete — Mouse_LeftReleased (eventtype=6 enumb=7)
// Estratto da gmx/objects/enemy_ariete.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: drag&drop action_if_variable ---
if (dc == 1)
{
    // --- azione 2: execute code (applies to: ally_omino -> with) ---
    with (ally_omino) {
        selected=1
    }
}

// --- azione 3: execute code ---
///quando non ci sta alt premuto che succede
if global.sele>-1
{
selected=1
if action=1
if dc=0
{dc=1
alarm[1]=20}}
//quando alt sta premuto che succede//
if global.sele=-1
{
selected=0
}
