// ally_omino — Keyboard_Escape (eventtype=5 enumb=27)
// Estratto da gmx/objects/ally_omino.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///se non ci sta ctrl o alt premuto quando clicchi fuori
with(casa_clicker)
    {if hover=0
    var ho1=0
    if hover=1
    var ho1=1}
with(magazzino_clicker)
    {if hover=0
    var ho2=0
    else
    var ho2=1}
with(barn_clicker)
    {if hover=0
    var ho3=0
    else
    var ho3=1}
with(campo_clicker)
    {if hover=0
    var ho4=0
    else
    var ho4=1}
with(chiesa_clicker)
    {if hover=0
    var ho5=0
    else
    var ho5=1}
with(torre_clicker)
    {if hover=0
    var ho6=0
    else
    var ho6=1}
with(caserma_clicker)
    {if hover=0
    var ho7=0
    else
    var ho7=1}
with(stalla_clicker)
    {if hover=0
    var ho8=0
    else
    var ho8=1}
with(castello_clicker)
    {if hover=0
    var ho9=0
    else
    var ho9=1}
with(mura_clicker)
    {if hover=0
    var ho10=0
    else
    var ho10=1}
if global.sele=0 && ho1=0 && ho2=0 && ho3=0 && ho4=0 && ho5=0 && ho6=0 && ho7=0 && ho8=0 && ho9=0 && ho10=0
    {
    if selected=1
        {global.sel-=1
        with (mouser)
            {pausarm=0
            alarm[0]=40}
        selected=0}
    }
