// mura_ori_fond — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/mura_ori_fond.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///creaz pulsanti di selezione
if selected=1
if instance_number(mplus_os)=0
    {
    instance_create(x-219,y,mplus_os)
    instance_create(x+207,y,mplus_od)}
if life>=slife
    {instance_create(x,y,mura_ori)
    instance_destroy()}
if phase=0
if life>slife/2
if sprite_index!=m_ori_f2
    {sprite_index=m_ori_f2
    phase=1}
