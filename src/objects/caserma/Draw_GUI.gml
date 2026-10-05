// caserma — Draw_GUI (eventtype=8 enumb=64)
// Estratto da gmx/objects/caserma.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
if selected=1
    {
    draw_set_alpha(0.69)
    draw_circle_colour(450,50,30,c_white,c_white,false)
    draw_circle_colour(520,50,30,c_white,c_white,false)
    draw_circle_colour(590,50,30,c_white,c_white,false)
    draw_circle_colour(660,50,30,c_white,c_white,false)
    draw_set_alpha(1)
    draw_sprite_ext(ico_guerriero,0,450,50,0.6,0.6,0,c_white,1)
    draw_sprite_ext(ico_picchiere,0,520,50,0.6,0.6,0,c_white,1)
    draw_sprite_ext(ico_arciere,0,590,50,0.6,0.6,0,c_white,1)
    draw_sprite_ext(ico_indietro,0,660,50,0.7,0.7,0,c_white,1)
    if progression>0
        {draw_set_alpha(0.69)
            {draw_roundrect_colour_ext(420,90,550,150,60,60,c_white,c_white,false)
            draw_roundrect_colour_ext(420,90,480+70/100*progression,150,60,60,c_green,c_green,false)
            draw_set_alpha(0.7)
            draw_set_halign(fa_center)
            draw_text(520,120,progression+"%")
            draw_set_alpha(0.69)}}
    draw_set_alpha(0.69)
    draw_roundrect_colour_ext(260,20,390,150,60,60,c_white,c_white,false)
    draw_set_font(GUI_1)
    draw_set_colour(c_black)
    draw_set_alpha(0.75)
    draw_set_valign(fa_middle)
    draw_set_halign(fa_center)
    draw_text(325,120,life+" / "+slife)
    draw_set_alpha(1)
    if progression>0
    {draw_set_alpha(1)
    if coda0=1
    draw_sprite_ext(ico_guerriero,0,450,120,0.6,0.6,0,c_white,1)
    if coda0=2
    draw_sprite_ext(ico_picchiere,0,450,120,0.6,0.6,0,c_white,1)
    if coda0=3
    draw_sprite_ext(ico_arciere,0,450,120,0.6,0.6,0,c_white,1)
    draw_set_alpha(1)
    }
    draw_set_alpha(1)
    draw_sprite(ico_caserma,0,325,70)
    if coda>0
    {draw_set_alpha(0.69)
    draw_circle_colour(590,120,30,c_white,c_white,false)
    draw_set_alpha(1)
    if coda1=1
    draw_sprite_ext(ico_guerriero,0,590,120,0.6,0.6,0,c_white,1)
    if coda1=2
    draw_sprite_ext(ico_picchiere,0,590,120,0.6,0.6,0,c_white,1)
    if coda1=3
    draw_sprite_ext(ico_arciere,0,590,120,0.6,0.6,0,c_white,1)
    }
    if coda>1
    {draw_set_alpha(0.69)
    draw_circle_colour(660,120,30,c_white,c_white,false)
    draw_set_alpha(1)
    if coda2=1
    draw_sprite_ext(ico_guerriero,0,660,120,0.6,0.6,0,c_white,1)
    if coda2=2
    draw_sprite_ext(ico_picchiere,0,660,120,0.6,0.6,0,c_white,1)
    if coda2=3
    draw_sprite_ext(ico_arciere,0,660,120,0.6,0.6,0,c_white,1)
    }
    if coda>2
    {draw_set_alpha(0.69)
    draw_circle_colour(730,120,30,c_white,c_white,false)
    draw_set_alpha(1)
    if coda3=1
    draw_sprite_ext(ico_guerriero,0,730,120,0.6,0.6,0,c_white,1)
    if coda3=2
    draw_sprite_ext(ico_picchiere,0,730,120,0.6,0.6,0,c_white,1)
    if coda3=3
    draw_sprite_ext(ico_arciere,0,730,120,0.6,0.6,0,c_white,1)
    }
    if coda>3
    {draw_set_alpha(0.69)
    draw_circle_colour(800,120,30,c_white,c_white,false)
    draw_set_alpha(1)
    if coda4=1
    draw_sprite_ext(ico_guerriero,0,800,120,0.6,0.6,0,c_white,1)
    if coda4=2
    draw_sprite_ext(ico_picchiere,0,800,120,0.6,0.6,0,c_white,1)
    if coda4=3
    draw_sprite_ext(ico_arciere,0,800,120,0.6,0.6,0,c_white,1)
    }
    if coda>4
    {draw_set_alpha(0.69)
    draw_circle_colour(870,120,30,c_white,c_white,false)
    draw_set_alpha(1)
    if coda5=1
    draw_sprite_ext(ico_guerriero,0,870,120,0.6,0.6,0,c_white,1)
    if coda5=2
    draw_sprite_ext(ico_picchiere,0,870,120,0.6,0.6,0,c_white,1)
    if coda5=3
    draw_sprite_ext(ico_arciere,0,870,120,0.6,0.6,0,c_white,1)
    }
    if coda>5
    {draw_set_alpha(0.69)
    draw_circle_colour(940,120,30,c_white,c_white,false)
    draw_set_alpha(1)
    if coda6=1
    draw_sprite_ext(ico_guerriero,0,940,120,0.6,0.6,0,c_white,1)
    if coda6=2
    draw_sprite_ext(ico_picchiere,0,940,120,0.6,0.6,0,c_white,1)
    if coda6=3
    draw_sprite_ext(ico_arciere,0,940,120,0.6,0.6,0,c_white,1)
    }}
