/// scr_area_difesa(rect_x1, rect_y1, rect_x2, rect_y2, def_point_x, def_point_y, def_point_id)
// Assegna il ruolo di difesa a tutti i nemici dentro l'area specificata

var x1 = argument0; //coordinate del rettangolo di competenza
var y1 = argument1;
var x2 = argument2;
var y2 = argument3;
var def_x = argument4; //punto da difendere, serve?
var def_y = argument5;
var def_id = argument6; //id unico del punto

with (enemy_unit) {
    if (x > x1 && x < x2 && y > y1 && y < y2) {
        role = 10;    // 10=difesa del punto
        def_point_x = def_x;
        def_point_y = def_y;
        def_point_id = def_id
    }
}
