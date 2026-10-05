// enemy_manager_menu — Step_End (eventtype=3 enumb=2)
// Estratto da gmx/objects/enemy_manager_menu.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///Hover dei vari pulsanti
if room==menu
global.sele=-1
if global.campagna=0
    {if mouse_x>view_xview[0]+view_wview[0]/2-200 && mouse_y>view_yview[0]+view_hview[0]-400 && mouse_x<view_xview[0]+view_wview[0]/2+200 && mouse_y<view_yview[0]+view_hview[0]-300
    hover=1
    else
    hover=0
    if global.campagna=0
    if mouse_x>view_xview[0]+view_wview[0]/2-200 && mouse_y>view_yview[0]+view_hview[0]-200 && mouse_x<view_xview[0]+view_wview[0]/2+200 && mouse_y<view_yview[0]+view_hview[0]-100
    campagnahover=1
    else
    campagnahover=0}
if global.campagna=1
    {if mouse_x>view_xview[0]+view_wview[0]-80 && mouse_y>view_yview[0]+20 && mouse_x<view_xview[0]+view_wview[0]-20 && mouse_y<view_yview[0]+70
    c_indhover=1
    else
    c_indhover=0
    if mouse_x>view_xview[0]+view_wview[0]-150 && mouse_y>view_yview[0]+20 && mouse_x<view_xview[0]+view_wview[0]-90 && mouse_y<view_yview[0]+70
    c_unlhover=1
    else
    c_unlhover=0
    if mouse_x>view_xview[0]+30 && mouse_y>view_yview[0]+75 && mouse_x<view_xview[0]+290 && mouse_y<view_yview[0]+125
    lvlhover=1
    if mouse_x>view_xview[0]+30 && mouse_y>view_yview[0]+115 && mouse_x<view_xview[0]+290 && mouse_y<view_yview[0]+165 && global.unlock>1
    lvlhover=2
    if mouse_x>view_xview[0]+30 && mouse_y>view_yview[0]+155 && mouse_x<view_xview[0]+290 && mouse_y<view_yview[0]+205 && global.unlock>2
    lvlhover=3
    if mouse_x>view_xview[0]+30 && mouse_y>view_yview[0]+195 && mouse_x<view_xview[0]+290 && mouse_y<view_yview[0]+245 && global.unlock>3
    lvlhover=4
    if mouse_x>view_xview[0]+30 && mouse_y>view_yview[0]+235 && mouse_x<view_xview[0]+290 && mouse_y<view_yview[0]+285 && global.unlock>4
    lvlhover=5
    if mouse_x>view_xview[0]+30 && mouse_y>view_yview[0]+275 && mouse_x<view_xview[0]+290 && mouse_y<view_yview[0]+325 && global.unlock>5
    lvlhover=6
    if mouse_x>view_xview[0]+30 && mouse_y>view_yview[0]+315 && mouse_x<view_xview[0]+290 && mouse_y<view_yview[0]+365 && global.unlock>6
    lvlhover=7
    if mouse_x>view_xview[0]+30 && mouse_y>view_yview[0]+355 && mouse_x<view_xview[0]+290 && mouse_y<view_yview[0]+405 && global.unlock>7
    lvlhover=8
    if mouse_x>view_xview[0]+30 && mouse_y>view_yview[0]+395 && mouse_x<view_xview[0]+290 && mouse_y<view_yview[0]+445 && global.unlock>8
    lvlhover=9
    if mouse_x>view_xview[0]+30 && mouse_y>view_yview[0]+435 && mouse_x<view_xview[0]+290 && mouse_y<view_yview[0]+485 && global.unlock>9
    lvlhover=10
    if sblocco=1
        {if mouse_x>view_xview[0]+view_wview[0]/2-290 && mouse_y>view_yview[0]+view_hview[0]/2-100 && mouse_x<view_xview[0]+view_wview[0]/2-190 && mouse_y<view_yview[0]+view_hview[0]/2
        comb1hplus=1
        else
        comb1hplus=0
        if mouse_x>view_xview[0]+view_wview[0]/2-290 && mouse_y>view_yview[0]+view_hview[0]/2 && mouse_x<view_xview[0]+view_wview[0]/2-190 && mouse_y<view_yview[0]+view_hview[0]/2+100
        comb1hmin=1
        else
        comb1hmin=0
        if mouse_x>view_xview[0]+view_wview[0]/2-170 && mouse_y>view_yview[0]+view_hview[0]/2-100 && mouse_x<view_xview[0]+view_wview[0]/2-70 && mouse_y<view_yview[0]+view_hview[0]/2
        comb2hplus=1
        else
        comb2hplus=0
        if mouse_x>view_xview[0]+view_wview[0]/2-170 && mouse_y>view_yview[0]+view_hview[0]/2 && mouse_x<view_xview[0]+view_wview[0]/2-70 && mouse_y<view_yview[0]+view_hview[0]/2+100
        comb2hmin=1
        else
        comb2hmin=0
        if mouse_x>view_xview[0]+view_wview[0]/2-50 && mouse_y>view_yview[0]+view_hview[0]/2-100 && mouse_x<view_xview[0]+view_wview[0]/2+50 && mouse_y<view_yview[0]+view_hview[0]/2
        comb3hplus=1
        else
        comb3hplus=0
        if mouse_x>view_xview[0]+view_wview[0]/2-50 && mouse_y>view_yview[0]+view_hview[0]/2 && mouse_x<view_xview[0]+view_wview[0]/2+50 && mouse_y<view_yview[0]+view_hview[0]/2+100
        comb3hmin=1
        else
        comb3hmin=0
        if mouse_x>view_xview[0]+view_wview[0]/2+70 && mouse_y>view_yview[0]+view_hview[0]/2-100 && mouse_x<view_xview[0]+view_wview[0]/2+170 && mouse_y<view_yview[0]+view_hview[0]/2
        comb4hplus=1
        else
        comb4hplus=0
        if mouse_x>view_xview[0]+view_wview[0]/2+70 && mouse_y>view_yview[0]+view_hview[0]/2 && mouse_x<view_xview[0]+view_wview[0]/2+170 && mouse_y<view_yview[0]+view_hview[0]/2+100
        comb4hmin=1
        else
        comb4hmin=0
        if mouse_x>view_xview[0]+view_wview[0]/2+190 && mouse_y>view_yview[0]+view_hview[0]/2-100 && mouse_x<view_xview[0]+view_wview[0]/2+290 && mouse_y<view_yview[0]+view_hview[0]/2
        comb5hplus=1
        else
        comb5hplus=0
        if mouse_x>view_xview[0]+view_wview[0]/2+190 && mouse_y>view_yview[0]+view_hview[0]/2 && mouse_x<view_xview[0]+view_wview[0]/2+290 && mouse_y<view_yview[0]+view_hview[0]/2+100
        comb5hmin=1
        else
        comb5hmin=0
        if mouse_x>view_xview[0]+view_wview[0]/2-170 && mouse_y>view_yview[0]+view_hview[0]/2+120 && mouse_x<view_xview[0]+view_wview[0]/2+170 && mouse_y<view_yview[0]+view_hview[0]/2+170
        sblocco_hover=1
        else
        sblocco_hover=0}}
if redamount>0
redamount-=0.03125
