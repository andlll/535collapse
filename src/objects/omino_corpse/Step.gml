// omino_corpse — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/omino_corpse.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
//assegnazione sprite//
{if phase=1
{if step=0
sprite_index=oc41
if step=1
sprite_index=oc42
if step=2
sprite_index=oc43}
if phase=2
{if step=0
sprite_index=oc51
if step=1
sprite_index=oc52
if step=2
sprite_index=oc53}
if phase=3
{if step=0
sprite_index=oc61
if step=1
sprite_index=oc62
if step=2
sprite_index=oc63}
if phase=4
{if step=0
sprite_index=oc71
if step=1
sprite_index=oc72
if step=2
sprite_index=oc73}
if phase=5
{if step=0
sprite_index=oc81
if step=1
sprite_index=oc82
if step=2
sprite_index=oc83}
if phase=6
{if step=0
sprite_index=oc11
if step=1
sprite_index=oc12
if step=2
sprite_index=oc13}
if phase=7
{if step=0
sprite_index=oc21
if step=1
sprite_index=oc22
if step=2
sprite_index=oc23}
if phase=8
{if step=0
sprite_index=oc31
if step=1
sprite_index=oc32
if step=2
sprite_index=oc33}}

// --- azione 2: execute code ---
//direzione//
depth=-y
if direction<22.5
phase=1
if direction>=337.5
phase=1
if direction>=22.5
if direction<67.5
phase=2
if direction>=67.5
if direction<112.5
phase=3
if direction>=112.5
if direction<157.5
phase=4
if direction>=157.5
if direction<202.5
phase=5
if direction>=202.5
if direction<247.5
phase=6
if direction>=247.5
if direction<292.5
phase=7
if direction>=292.5
if direction<337.5
phase=8

// --- azione 3: execute code ---
///alpha
if step=3
image_alpha-=0.025
