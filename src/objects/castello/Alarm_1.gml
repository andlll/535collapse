// castello — Alarm_1 (eventtype=2 enumb=1)
// Estratto da gmx/objects/castello.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
//coda0=in corso, gli altri in coda a seguire//
if flagx!=nope
{var aflagx=flagx
var aflagy=flagy}
else
{var aflagx=x+150
var aflagy=y+100}
if progression<100 && progression!=0
{progression+=1
alarm[1]=30}
if progression>=100
{
if global.pop+2>=global.popcap
{alarm[1]=30
instance_create(0,0,pop_blink)
exit}
progression=0
if coda>0
{coda-=1
alarm[1]=30
progression=1}
if coda0=1
{var nuovo=instance_create(x+200,y+100,ally_ariete)
with (nuovo)
{
alarm[0]=13
dirox=aflagx
diroy=aflagy
action=1
}}
if coda0=2
{var nuovo=instance_create(x+200,y+100,ally_catapulta)
with (nuovo)
{
alarm[0]=13
dirox=aflagx
diroy=aflagy
action=1
}}
if coda0=3
{var nuovo=instance_create(x+200,y+100,ally_arciere)
with (nuovo)
{
alarm[1]=13
dirox=aflagx
diroy=aflagy
action=1
}}
coda0=coda1
coda1=coda2
coda2=coda3
coda3=coda4
coda4=coda5
coda5=coda6}
