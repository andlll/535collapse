///scr_attacca(nsend,interval,target)
//si esegue teoricamente a ogni step
var nsend=argument0 //numero di nemici da mandare a ogni ondata
var interval=argument1 //intervallo tra le varie ondate, in secondi
var target=argument2 //cosa va attaccato
var ff=flow_field;
if !instance_exists(target) && instance_exists(enemy_unit)
with(enemy_unit)
    {if role>29
        {action=0
        role=0
        dirox=x
        diroy=y}}
var count=0
if instance_exists(enemy_unit)
with (enemy_unit)
    {if role=30
    count++}
if count>nsend && instance_exists(target) && instance_exists(enemy_caserma) && instance_exists(enemy_stalla) && instance_exists(enemy_unit)
    {scr_inizializza_ff_nemici(target)
    var ff=flow_field;
    with (enemy_unit)
    if role==30 && action==0
        {action=1
        flow_field=ff
        dirox=instance_nearest(x,y,target).x
        diroy=instance_nearest(x,y,target).y
        alarm[0]=irandom_range(12,15)
        role=31}
    with (enemy_caserma)
        {if role=30
        alarm[3]+=interval*60}
    with (enemy_stalla)
        {if role=30
        alarm[3]+=interval*60}}
if instance_exists(enemy_unit)
with (enemy_unit)
if role=32 && action=0 && instance_exists(target)
    {action=1
    dirox=instance_nearest(x,y,target).x
    diroy=instance_nearest(x,y,target).y
    alarm[0]=irandom_range(12,15)
    }

