// ally_omino — Alarm_3 (eventtype=2 enumb=3)
// Estratto da gmx/objects/ally_omino.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Se quando nasci posto è occupato
//idleorder corretto
if action=0
    {global.idle+=1
    idleorder=global.idle}
var act=action
var gol=goldwork
var sto=stonework
var woo=woodwork
var foo=foodwork
var dix=dirox
var diy=diroy
if place_free(x,y)=false
{var nuovo=instance_create(x+50,y-20,ally_omino)
with(nuovo)
{action=1
alarm[0]=13
goldwork=gol
stonework=sto
woodwork=woo
foodwork=foo
dirox=dix
diroy=diy
goldx=dirox
goldy=diroy
woodx=dirox
woody=diroy
stonex=dirox
stoney=diroy
foodx=dirox
foody=diroy}
if action=0
global.idle-=1
global.pop-=1
instance_destroy()}
