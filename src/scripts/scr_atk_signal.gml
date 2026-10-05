///scr_atk_signal
var vx1 = view_xview[0];
var vy1 = view_yview[0];
var vx2 = vx1 + view_wview[0];
var vy2 = vy1 + view_hview[0];

if !(x >= vx1 && x <= vx2 && y >= vy1 && y <= vy2) 
    {
    if instance_number(atk_signal)>0
        {if distance_to_object(atk_signal)>500
        instance_create(x,y,atk_signal)
        else
        exit}
    else
    instance_create(x,y,atk_signal)}
