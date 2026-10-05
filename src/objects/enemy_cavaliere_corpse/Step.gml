// enemy_cavaliere_corpse — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/enemy_cavaliere_corpse.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
//assegnazione sprite//
{if phase=1
{if step=0
sprite_index=bcd41
if step=1
sprite_index=bcd42
if step=2
sprite_index=bcd43}
if phase=2
{if step=0
sprite_index=bcd51
if step=1
sprite_index=bcd52
if step=2
sprite_index=bcd53}
if phase=3
{if step=0
sprite_index=bcd61
if step=1
sprite_index=bcd62
if step=2
sprite_index=bcd63}
if phase=4
{if step=0
sprite_index=bcd71
if step=1
sprite_index=bcd72
if step=2
sprite_index=bcd73}
if phase=5
{if step=0
sprite_index=bcd81
if step=1
sprite_index=bcd82
if step=2
sprite_index=bcd83}
if phase=6
{if step=0
sprite_index=bcd11
if step=1
sprite_index=bcd12
if step=2
sprite_index=bcd13}
if phase=7
{if step=0
sprite_index=bcd21
if step=1
sprite_index=bcd22
if step=2
sprite_index=bcd23}
if phase=8
{if step=0
sprite_index=bcd31
if step=1
sprite_index=bcd32
if step=2
sprite_index=bcd33}}

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
