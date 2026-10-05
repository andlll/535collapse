// enemy_manager_menu — Mouse_GlobalLeftReleased (eventtype=6 enumb=56)
// Estratto da gmx/objects/enemy_manager_menu.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
///premere pulsanti
if global.campagna=0
    {if mouse_x>view_xview[0]+view_wview[0]/2-200 && mouse_y>view_yview[0]+view_hview[0]-400 && mouse_x<view_xview[0]+view_wview[0]/2+200 && mouse_y<view_yview[0]+view_hview[0]-300
        {room_goto(match)
        if part_system_exists(rain)
        part_system_destroy(rain)}
    if campagnahover=1
    global.campagna=1}
if c_indhover=1
    if sblocco=0
        {global.campagna=0
        c_indhover=0
        exit}
    else
    sblocco=0
if lvlhover=1 && mouse_x>view_xview[0]+30 && mouse_y>view_yview[0]+75 && mouse_x<view_xview[0]+290 && mouse_y<view_yview[0]+125
{room_goto(lvl01)
        if part_system_exists(rain)
        part_system_destroy(rain)}
if lvlhover=2 && mouse_x>view_xview[0]+30 && mouse_y>view_yview[0]+115 && mouse_x<view_xview[0]+290 && mouse_y<view_yview[0]+165
{room_goto(lvl02)
        if part_system_exists(rain)
        part_system_destroy(rain)}
if c_unlhover=1
    {sblocco=1
    c_unlhover=0}
if sblocco=1
    {if comb1hplus=1
        {if comb1>-1 && comb1<9
            {comb1++
            exit}
        if comb1=9
            comb1=0}
    if comb1hmin=1
        {if comb1>0 && comb1<10
            {comb1--
            exit}
        if comb1=0
            comb1=9}
    if comb2hplus=1
        {if comb2>-1 && comb2<9
            {comb2++
            exit}
        if comb2=9
            comb2=0}
    if comb2hmin=1
        {if comb2>0 && comb2<10
            {comb2--
            exit}
        if comb2=0
            comb2=9}
    if comb3hplus=1
        {if comb3>-1 && comb3<9
            {comb3++
            exit}
        if comb3=9
            comb3=0}
    if comb3hmin=1
        {if comb3>0 && comb3<10
            {comb3--
            exit}
        if comb3=0
            comb3=9}
    if comb4hplus=1
        {if comb4>-1 && comb4<9
            {comb4++
            exit}
        if comb4=9
            comb4=0}
    if comb4hmin=1
        {if comb4>0 && comb4<10
            {comb4--
            exit}
        if comb4=0
            comb4=9}
    if comb5hplus=1
        {if comb5>-1 && comb5<9
            {comb5++
            exit}
        if comb5=9
            comb5=0}
    if comb5hmin=1
        {if comb5>0 && comb5<10
            {comb5--
            exit}
        if comb5=0
            comb5=9}
    if sblocco_hover=1
        {if comb1=4 && comb2=9 && comb3=2 && comb4=1 && comb5=7 && global.unlock<2
        global.unlock=2
        else
            {if comb1=5 && comb2=8 && comb3=4 && comb4=2 && comb5=1 && global.unlock<3
            global.unlock=3
            else
                {if comb1=9 && comb2=3 && comb3=0 && comb4=7 && comb5=6 && global.unlock<4
                global.unlock=4
                else
                    {if comb1=1 && comb2=2 && comb3=7 && comb4=9 && comb5=4 && global.unlock<5
                    global.unlock=5
                    else
                        {if comb1=8 && comb2=0 && comb3=6 && comb4=5 && comb5=3 && global.unlock<6
                        global.unlock=6
                        else
                            {if comb1=0 && comb2=7 && comb3=3 && comb4=6 && comb5=0 && global.unlock<7
                            global.unlock=7
                            else
                                {if comb1=7 && comb2=6 && comb3=3 && comb4=0 && comb5=8 && global.unlock<8
                                global.unlock=8
                                else
                                    {if comb1=3 && comb2=5 && comb3=1 && comb4=6 && comb5=0 && global.unlock<9
                                    global.unlock=9
                                    else
                                        {if comb1=2 && comb2=1 && comb3=9 && comb4=4 && comb5=7 && global.unlock<10
                                        global.unlock=10
                                        else
                                        redamount=1}}}}}}}}}}
