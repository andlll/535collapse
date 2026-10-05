// ally_omino — Alarm_2 (eventtype=2 enumb=2)
// Estratto da gmx/objects/ally_omino.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Sostitutivi di bullet per azioni su risorse
if action=2
    {if step=0
        {step=1
        alarm[2]=13
        exit}
    if step=1
        {step=2
        alarm[2]=13
        exit}
    if step=2
        {step=0
        alarm[2]=13
        wood+=2
        with instance_nearest(x+30*cos(degtorad(direction)),y-30*sin(degtorad(direction)),albero)
            {wood-=2
            if wood=0
            instance_destroy()}
        exit}}
if action=3
    {if step=0
        {step=1
        alarm[2]=13
        exit}
    if step=1
        {step=2
        alarm[2]=13
        exit}
    if step=2
        {step=0
        alarm[2]=13
        gold+=1
        with instance_nearest(x+30*cos(degtorad(direction)),y-30*sin(degtorad(direction)),miniera_oro)
            {gold-=1
            if gold=0
            instance_destroy()}
        exit}}
if action=4
    {if step=0
        {step=1
        alarm[2]=13
        exit}
    if step=1
        {step=2
        alarm[2]=13
        exit}
    if step=2
        {step=0
        alarm[2]=13
        food+=1
        if food<10
            {with instance_nearest(x,y,campo)
                {alarm[1]=40
                foodwork=1}}
        else
            {with instance_nearest(x,y,campo)
                {alarm[1]=1
                foodwork=1}}
        exit}}
if action=5
    {if step=0
        {step=1
        alarm[2]=13
        exit}
    if step=1
        {step=2
        alarm[2]=13
        exit}
    if step=2
        {step=0
        alarm[2]=13
        stone+=1
        with instance_nearest(x+30*cos(degtorad(direction)),y-30*sin(degtorad(direction)),stone_parent)
            {stone-=1
            if stone=0
            instance_destroy()}
        exit}}
//costruzione
if action=6
    {
    with instance_nearest(buildx,buildy,ally_fondamenta)
        {if fondazione=1
            {if slife=329 || slife=899 || slife=349 || slife=299 || slife=379
            life+=1
            if slife=139 || slife=119 || slife=149
            life+=2
            if slife=799 || slife=100
            life+=5
            if life>slife
            life=slife}}
        {if step=0
            {step=1
            alarm[2]=13
            exit}
        if step=1
            {step=2
            alarm[2]=13
            exit}
        if step=2
            {step=0
            alarm[2]=13
            exit}}}
//riparazione
if action=7
    {
    with instance_nearest(repx,repy,ally_build)
        {if pietra=1
            {if global.stone>0
                {global.stone--
                life++
                if life>slife
                life=slife}}
        if legno=1
             {if global.wood>0
                {global.wood--
                life++
                onfire=0
                if firestarted=1
                    {part_system_destroy(fire_ps)
                    part_system_destroy(fire_psf)
                    firestarted=0}
                if life>slife
                life=slife}}}    
    {if step=0
        {step=1
        alarm[2]=13
        exit}
    if step=1
        {step=2
        alarm[2]=13
        exit}
    if step=2
        {step=0
        alarm[2]=13
        exit}}}
//coltivazione campo
if action=8
    {
    with instance_nearest(buildx,buildy,campo_fond)
        {if fondazione=1
            {life+=5
            if life>slife
            life=slife}}
        {if step=0
            {step=1
            alarm[2]=13
            exit}
        if step=1
            {step=2
            alarm[2]=13
            exit}
        if step=2
            {step=0
            var emitter = part_emitter_create(global.ptc_system);
            var dir = direction; // Direzione basata sul frame di animazione
            
            // Posizione della mano (se vuoi maggiore precisione)
            var hand_x = x + lengthdir_x(8, dir);
            var hand_y = y -40
            if direction>0 && direction <181
            part_system_depth(global.ptc_system,-y+1)
            else
            part_system_depth(global.ptc_system,-y-1)
            part_emitter_region(global.ptc_system, emitter, hand_x, hand_x, hand_y, hand_y, ps_shape_rectangle, ps_distr_linear);
            part_type_direction(global.ptc_semi, dir - 10, dir + 10, 0, 0);
            part_emitter_burst(global.ptc_system, emitter, global.ptc_semi, 8);
            alarm[2]=13
            exit}}}
