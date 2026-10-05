// enemy_manager_menu — Draw_GUI (eventtype=8 enumb=64)
// Estratto da gmx/objects/enemy_manager_menu.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///menu iniziale
if global.campagna=0
    {draw_set_blend_mode(bm_normal)
    if campagnahover=0
    draw_set_alpha(0.69)
    if campagnahover=1
    draw_set_alpha(0.99)
    draw_roundrect_colour_ext(view_wview[0]/2-200,view_hview[0]-200,view_wview[0]/2+200,view_hview[0]-100,60,60,c_white,c_white,false)
    if hover=0
    draw_set_alpha(0.69)
    if hover=1
    draw_set_alpha(0.99)
    draw_roundrect_colour_ext(view_wview[0]/2-200,view_hview[0]-400,view_wview[0]/2+200,view_hview[0]-300,60,60,c_white,c_white,false)
    draw_set_alpha(1)
    draw_set_halign(fa_center)
    draw_set_valign(fa_center)
    draw_set_font(GUI_1)
    draw_set_color(c_black)
    draw_set_alpha(0.75)
    draw_text(view_wview[0]/2,view_hview[0]-150,"Campaign - Collapse")
    draw_text(view_wview[0]/2,view_hview[0]-350,"Play the tutorial")
    draw_set_font(overdue)
    if testo!=8
    draw_text(view_wview[0]/2,view_hview[0]-50,"Mount Fuji Software, 2025")
    else
    draw_text(view_wview[0]/2,view_hview[0]-50,"Non mi interessa se sta roba non ingrana quando soffro d'insonnia e non dormo da una settimana")
    draw_set_halign(fa_left)
    draw_text(20,view_hview[0]-50,"0.250125")
    draw_set_alpha(1)
    draw_sprite(logo535,0,view_wview[0]/2,350)}
if global.campagna=1
    {draw_set_blend_mode(bm_normal)
    draw_set_alpha(0.9)
    draw_sprite(mappa_camp,0,view_wview[0]/2,view_hview[0]/2)
    if sblocco=0 && global.unlock>0
        {draw_set_colour(make_colour_rgb(139, 0, 0))
        draw_set_font(GUI_1)
        if lvlhover>0 //Icone su mappa
            {draw_sprite(cap1,0,view_wview[0]/2+663,view_hview[0]/2+78)
            draw_text(view_wview[0]/2+663,view_hview[0]/2+128,"1.")
            }
        if lvlhover>1
            {draw_sprite(cap2,0,view_wview[0]/2+463,view_hview[0]/2+28)
            draw_sprite(fr_corta,0,view_wview[0]/2+563,view_hview[0]/2+53)
            draw_text(view_wview[0]/2+463,view_hview[0]/2+88,"2.")
            }
        draw_set_colour(c_black)
        draw_set_font(overdue)}
    draw_set_alpha(0.69)
    draw_roundrect_colour_ext(20,20,300,490,60,60,c_white,c_white,false) 
    if c_indhover=0
    draw_set_alpha(0.69)
    else
    draw_set_alpha(0.99)
    draw_circle_colour(view_wview[0]-50,50,30,c_white,c_white,false)
    if c_unlhover=0
    draw_set_alpha(0.69)
    else
    draw_set_alpha(0.99)
    if sblocco=0
    draw_circle_colour(view_wview[0]-120,50,30,c_white,c_white,false)   
    draw_set_alpha(0.99) 
    if lvlhover>0 //Testi che vanno sotto
        {draw_roundrect_colour_ext(30,35+40*lvlhover,290,85+40*lvlhover,50,50,c_white,c_white,false) 
        if lvlhover=1
        testo_c="It's over. Someone betrayed our city and guided the enemy to a secret entrance. They claimed to come here to bring back the glory of the old empire, but they brought back only death and destruction. We must find our way out to survive and start a resistence." 
        if lvlhover=2
        testo_c="An army of survivors makes its way out of the city into the hills. Their priority is to free the citizens imprisoned by the invaders."
        testo_h=string_height_ext(testo_c,40,view_wview[0]-80)
        }
    draw_set_alpha(1)
    draw_sprite_ext(ico_indietro,0,view_wview[0]-50,50,0.6,0.6,0,c_white,1)
    if sblocco=0
    draw_sprite(ico_lock,0,view_wview[0]-120,50)
    draw_set_alpha(0.8) //Titoli
    draw_set_halign(fa_left)
    draw_set_valign(fa_center)
    draw_set_font(GUI_1)
    draw_text(40,50,"Collapse")
    draw_set_font(overdue)
    draw_text(40,100,"1. Shove the sun aside")
    if global.unlock>1
    draw_text(40,140,"2. A long walk")
    if global.unlock>2
    draw_text(40,180,"3. The monastery")
    if global.unlock>3
    draw_text(40,220,"4. Crossing a bridge")
    if global.unlock>4
    draw_text(40,260,"5. The siege")
    if global.unlock>5
    draw_text(40,300,"6. One hundred towers")
    if global.unlock>6
    draw_text(40,340,"7. Our old gods")
    if global.unlock>7
    draw_text(40,380,"8. Escape from the city")
    if global.unlock>8
    draw_text(40,420,"9. Allies")
    if global.unlock>9
    draw_text(40,460,"10. The last day")
    draw_set_valign(fa_top)
    draw_set_alpha(0.69) //Testo sotto
    draw_roundrect_colour_ext(30,view_hview[0]-30,view_wview[0]-30,view_hview[0]-50-testo_h,50,50,c_white,c_white,false)
    draw_set_alpha(0.8)
    draw_text_ext(40,view_hview[0]-40-testo_h,testo_c,30,view_wview[0]-80)
    if sblocco=1
        {if comb3hplus=0 && comb3hmin=0
        draw_set_alpha(0.69)
        if comb3hplus=1 || comb3hmin=1
        draw_set_alpha(0.99)
        draw_roundrect_colour_ext(view_wview[0]/2-50,view_hview[0]/2-100,view_wview[0]/2+50,view_hview[0]/2+100,50,50,c_white,c_white,false)
        if comb2hplus=0 && comb2hmin=0
        draw_set_alpha(0.69)
        if comb2hplus=1 || comb2hmin=1
        draw_set_alpha(0.99)
        draw_roundrect_colour_ext(view_wview[0]/2-170,view_hview[0]/2-100,view_wview[0]/2-70,view_hview[0]/2+100,50,50,c_white,c_white,false)
        if comb1hplus=0 && comb1hmin=0
        draw_set_alpha(0.69)
        if comb1hplus=1 || comb1hmin=1
        draw_set_alpha(0.99)
        draw_roundrect_colour_ext(view_wview[0]/2-290,view_hview[0]/2-100,view_wview[0]/2-190,view_hview[0]/2+100,50,50,c_white,c_white,false)
        if comb4hplus=0 && comb4hmin=0
        draw_set_alpha(0.69)
        if comb4hplus=1 || comb4hmin=1
        draw_set_alpha(0.99)
        draw_roundrect_colour_ext(view_wview[0]/2+70,view_hview[0]/2-100,view_wview[0]/2+170,view_hview[0]/2+100,50,50,c_white,c_white,false)
        if comb5hplus=0 && comb5hmin=0
        draw_set_alpha(0.69)
        if comb5hplus=1 || comb5hmin=1
        draw_set_alpha(0.99)
        draw_roundrect_colour_ext(view_wview[0]/2+190,view_hview[0]/2-100,view_wview[0]/2+290,view_hview[0]/2+100,50,50,c_white,c_white,false)
        if sblocco_hover=1
        draw_set_alpha(0.99)
        else
        draw_set_alpha(0.69)
        draw_roundrect_colour_ext(view_wview[0]/2-170,view_hview[0]/2+120,view_wview[0]/2+170,view_hview[0]/2+170,50,50,c_white,c_white,false)
        draw_sprite_ext(ico_back,0,view_wview[0]/2-120,view_hview[0]/2-70,0.5,0.5,270,c_white,1)
        draw_sprite_ext(ico_back,0,view_wview[0]/2-120,view_hview[0]/2+70,0.5,0.5,90,c_white,1)
        draw_sprite_ext(ico_back,0,view_wview[0]/2,view_hview[0]/2-70,0.5,0.5,270,c_white,1)
        draw_sprite_ext(ico_back,0,view_wview[0]/2,view_hview[0]/2+70,0.5,0.5,90,c_white,1)
        draw_sprite_ext(ico_back,0,view_wview[0]/2-240,view_hview[0]/2-70,0.5,0.5,270,c_white,1)
        draw_sprite_ext(ico_back,0,view_wview[0]/2-240,view_hview[0]/2+70,0.5,0.5,90,c_white,1)
        draw_sprite_ext(ico_back,0,view_wview[0]/2+120,view_hview[0]/2-70,0.5,0.5,270,c_white,1)
        draw_sprite_ext(ico_back,0,view_wview[0]/2+120,view_hview[0]/2+70,0.5,0.5,90,c_white,1)
        draw_sprite_ext(ico_back,0,view_wview[0]/2+240,view_hview[0]/2-70,0.5,0.5,270,c_white,1)
        draw_sprite_ext(ico_back,0,view_wview[0]/2+240,view_hview[0]/2+70,0.5,0.5,90,c_white,1)
        draw_set_font(gui_sblocco)
        draw_set_valign(fa_center)
        draw_set_halign(fa_center)
        draw_set_alpha(0.8)
        draw_set_colour(merge_colour(c_black,c_red,redamount))
        draw_text(view_wview[0]/2-240,view_hview[0]/2,comb1)
        draw_text(view_wview[0]/2-120,view_hview[0]/2,comb2)
        draw_text(view_wview[0]/2,view_hview[0]/2,comb3)
        draw_text(view_wview[0]/2+120,view_hview[0]/2,comb4)
        draw_text(view_wview[0]/2+240,view_hview[0]/2,comb5)
        draw_set_font(overdue)
        draw_sprite_ext(ico_lock,0,view_wview[0]/2-63,view_hview[0]/2+144,0.5,0.5,0,c_white,1)
        draw_set_colour(c_black)
        draw_text(view_wview[0]/2+17,view_hview[0]/2+145,"Unlock level")}}
draw_set_alpha(1)
draw_set_colour(c_white)
