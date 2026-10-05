// mura_vert_fond — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/mura_vert_fond.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///creaz pulsanti di selezione
if selected=1
if instance_number(mplus_va)=0
    {
    instance_create(x,y,mplus_vb)
    instance_create(x,y-300,mplus_va)}
if life>=slife
    {instance_create(x,y,mura_vert)
    instance_destroy()}
if phase=0
if life>slife/2
if sprite_index!=m_vert_f2
    {sprite_index=m_vert_f2
    phase=1}
