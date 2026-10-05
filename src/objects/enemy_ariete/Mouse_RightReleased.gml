// enemy_ariete — Mouse_RightReleased (eventtype=6 enumb=8)
// Estratto da gmx/objects/enemy_ariete.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
var targhetto=id
with ally_warrior
{if selected=1
    {if warwork=0 || warwork=1
    {
    target_eu=targhetto
    warwork=1
    dirox=target_eu.x
    diroy=target_eu.y}}}
with ally_cavaliere
{if selected=1
    {if warwork=0 || warwork=1
    {
    target_eu=targhetto
    warwork=1
    dirox=target_eu.x
    diroy=target_eu.y}}}
with ally_picchiere
{if selected=1
    {if warwork=0 || warwork=1
    {
    target_eu=targhetto
    warwork=1
    dirox=target_eu.x
    diroy=target_eu.y}}}
