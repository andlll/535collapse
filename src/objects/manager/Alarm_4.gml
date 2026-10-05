// manager — Alarm_4 (eventtype=2 enumb=4)
// Estratto da gmx/objects/manager.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///pioggia
alarm[6]=irandom_range(12000,15000) //fine
if global.raining=0
    {//sistema pioggia
    global.raining=1
    rain=part_system_create()
    part_system_depth(rain,-9000)
    //prova creazione pioggia
    goccia=part_type_create()
    part_type_shape(goccia,pt_shape_line)
    part_type_orientation(goccia,160,170,0,0,true)
    part_type_size(goccia,0.3,0.5,0,0)
    part_type_colour_rgb(goccia,131,148,101,119,74,107)
    part_type_speed(goccia,18,21,0.1,0)
    part_type_direction(goccia,250,260,0,0)
    part_type_life(goccia,200,300)
    //fai piovere
    rain_emitter=part_emitter_create(rain)
    part_emitter_region(rain,rain_emitter,0,room_width+300,-16,-16,ps_shape_line,ps_distr_linear)
    part_emitter_stream(rain,rain_emitter,goccia,6)}
