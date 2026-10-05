// castello_indietro_clicker — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/castello_indietro_clicker.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///mouse sinistro
if hover=1
if mouse_check_button_released(mb_left)=true
{
mouse_clear(mb_left)
with(castello)
{if selected=1
if progression!=0
{
if coda=6
{if coda6=1
{global.wood+=250
global.stone+=30}
if coda6=2
{global.wood+=200
global.stone+=100}
if coda6=3
{global.wood+=40
global.gold+=55}
coda6=0
coda-=1
exit}
if coda=5
{if coda5=1
{global.wood+=250
global.stone+=30}
if coda5=2
{global.wood+=200
global.stone+=100}
if coda5=3
{global.wood+=40
global.gold+=55}
coda5=0
coda-=1
exit}
if coda=4
{if coda4=1
{global.wood+=250
global.stone+=30}
if coda4=2
{global.wood+=200
global.stone+=100}
if coda4=3
{global.wood+=40
global.gold+=55}
coda4=0
coda-=1
exit}
if coda=3
{if coda3=1
{global.wood+=250
global.stone+=30}
if coda3=2
{global.wood+=200
global.stone+=100}
if coda3=3
{global.wood+=40
global.gold+=55}
coda3=0
coda-=1
exit}
if coda=2
{if coda2=1
{global.wood+=250
global.stone+=30}
if coda2=2
{global.wood+=200
global.stone+=100}
if coda2=3
{global.wood+=40
global.gold+=55}
coda2=0
coda-=1
exit}
if coda=1
{if coda1=1
{global.wood+=250
global.stone+=30}
if coda1=2
{global.wood+=200
global.stone+=100}
if coda1=3
{global.wood+=40
global.gold+=55}
coda1=0
coda-=1
exit}
if coda=0
{if coda0=1
{global.wood+=250
global.stone+=30}
if coda0=2
{global.wood+=200
global.stone+=100}
if coda0=3
{global.wood+=40
global.gold+=55}
coda0=0
progression=0
exit}}}}

// --- azione 2: execute code ---
x=view_xview[0]+590*global.scaleview
y=view_yview[0]+50*global.scaleview
depth=-y-999
image_xscale=global.scaleview
image_yscale=global.scaleview

// --- azione 3: execute code ---
if mouse_x>x-30 && mouse_x<x+30 && mouse_y>y-30 && mouse_y<y+30
global.sele=1
else
global.sele=0
