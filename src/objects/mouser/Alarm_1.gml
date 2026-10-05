// mouser — Alarm_1 (eventtype=2 enumb=1)
// Estratto da gmx/objects/mouser.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Apri menu di pausa e disattiva tutto
if room!=menu
    {if pausa=0 && global.sel=0 && pausarm=1
        {instance_deactivate_all(true)
        pausa=1}
    else
        {instance_activate_all()
        pausa=0}}
