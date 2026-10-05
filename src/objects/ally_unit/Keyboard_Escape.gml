// ally_unit — Keyboard_Escape (eventtype=5 enumb=27)
// Estratto da gmx/objects/ally_unit.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///se non ci sta ctrl o alt premuto quando clicchi fuori
if global.sele=0
    {
    if selected=1
        {global.sel-=1
        selected=0
        with (mouser)
            {pausarm=0
            alarm[0]=40}}
        }
