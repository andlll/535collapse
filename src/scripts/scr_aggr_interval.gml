///scr_aggr_interval(interval)
var interval=argument0 //quanto ritardare l'attacco, in secondi
with (enemy_caserma)
    {if role=30
    alarm[3]+=interval*60}
with (enemy_stalla)
    {if role=30
    alarm[3]+=interval*60}
