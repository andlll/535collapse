// b_catapulta_bullet — Destroy (eventtype=1 enumb=0)
// Estratto da gmx/objects/b_catapulta_bullet.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if position_meeting(x,y,ally_build)
    {var mattone1=instance_create(x,y,sfx_mattone)
    var mattone2=instance_create(x,y,sfx_mattone)
    var mattone3=instance_create(x,y,sfx_mattone)
    var obb=instance_nearest(x,y,ally_build)
    with mattone1
        {speed=2
        direction=irandom_range(0,300)}
            with mattone2
        {speed=2
        direction=irandom_range(0,300)}
            with mattone3
        {speed=2
        direction=irandom_range(0,300)}
        with obb
        life-=40}
if position_meeting(x,y,ally_unit)
    {instance_create(x,y,sfx_sangue)
    var ob2=instance_nearest(x,y,ally_unit)
    with ob2
    life-=40}
if !position_meeting(x,y,ally_build) &&  !position_meeting(x,y,ally_unit)
   {var erbas1=instance_create(x,y,sfx_erba)
    var erba2=instance_create(x,y,sfx_erba)
    var erba3=instance_create(x,y,sfx_erba)
    with erbas1
        {speed=2
        direction=irandom_range(0,300)}
            with erba2
        {speed=2
        direction=irandom_range(0,300)}
            with erba3
        {speed=2
        direction=irandom_range(0,300)}}
