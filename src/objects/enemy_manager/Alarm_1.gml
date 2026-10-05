// enemy_manager — Alarm_1 (eventtype=2 enumb=1)
// Estratto da gmx/objects/enemy_manager.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///creazione nemici
if global.waves<7
alarm[1]=18550
if global.waves>=7
alarm[1]=14550
var randomizer=irandom_range(1,4)
if randomizer=1
var randomsol=enemy_warrior
if randomizer=2
var randomsol=enemy_picchiere
if randomizer=3
var randomsol=enemy_arciere
if randomizer=4
var randomsol=enemy_cavaliere
global.waves+=1
    if place_free(5500,150) && global.waves>4
    instance_create(5500,150,randomsol)
    if place_free(5500,200) && global.waves>3
    instance_create(5500,200,randomsol)
    if place_free(5500,250) && global.waves>2
    instance_create(5500,250,enemy_cavaliere)
    if place_free(5500,300)
    instance_create(5500,300,enemy_warrior)
    if place_free(5550,350)
    instance_create(5550,350,enemy_picchiere)
    if place_free(5550,400)
    instance_create(5550,400,enemy_arciere)
    if place_free(5250,450) && global.waves>5
       {var qualassedio=irandom_range(1,2)
        if qualassedio=1
        instance_create(5250,450,enemy_ariete)
        else
        instance_create(5250,450,enemy_catapulta)}
