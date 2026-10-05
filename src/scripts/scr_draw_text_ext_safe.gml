/// scr_draw_text_ext_safe(x, y, text, sep, maxw)
// Drop-in replacement per draw_text_ext in GMS 1.4
// x,y    = coordinate di partenza
// text   = stringa da disegnare
// sep    = spazio extra in pixel tra una riga e l'altra
// maxw   = larghezza massima in pixel prima di andare a capo

var xx   = argument0;
var yy   = argument1;
var txt  = string(argument2);
var sep  = argument3;
var maxw = argument4;

var lh = string_height("W") + sep; // altezza riga
var lines = ds_list_create();

// funzione interna (in 1.4 la facciamo come script inline)
repeat (1) {
    while (string_length(txt) > 0) {

        // gestisci newline esplicito (# o \n)
        var p_hash = string_pos("#", txt);
        var p_lf   = string_pos(chr(10), txt);
        var p_nl   = 0;
        if (p_hash > 0) p_nl = p_hash;
        if (p_lf > 0 && (p_nl == 0 || p_lf < p_nl)) p_nl = p_lf;

        if (p_nl > 0 && string_width(string_copy(txt, 1, p_nl - 1)) <= maxw) {
            ds_list_add(lines, string_copy(txt, 1, p_nl - 1));
            txt = string_delete(txt, 1, p_nl); // taglia anche il newline
            // rimuovi spazi iniziali
            while (string_length(txt) > 0 && string_char_at(txt, 1) == " ") {
                txt = string_delete(txt, 1, 1);
            }
            continue;
        }

        // misura quanti caratteri entrano
        var len = string_length(txt);
        var k = 0;
        repeat (len) {
            if (string_width(string_copy(txt, 1, k + 1)) <= maxw) {
                k++;
            } else {
                break;
            }
        }

        if (k <= 0) k = 1; // evita loop infinito

        var candidate = string_copy(txt, 1, k);

        // trova ultimo spazio per non tagliare la parola
        var last_space = 0;
        var j = k;
        repeat (k) {
            if (string_char_at(candidate, j) == " " || string_char_at(candidate, j) == chr(9)) {
                last_space = j;
                break;
            }
            j -= 1;
        }

        var line, eat;
        if (last_space > 0) {
            line = string_copy(candidate, 1, last_space - 1);
            eat  = last_space;
        } else {
            line = candidate;
            eat  = k;
        }

        ds_list_add(lines, line);
        txt = string_delete(txt, 1, eat);

        // rimuovi spazi iniziali
        while (string_length(txt) > 0 && string_char_at(txt, 1) == " ") {
            txt = string_delete(txt, 1, 1);
        }
    }
}

// disegna tutte le righe
var n = ds_list_size(lines);
for (var i = 0; i < n; i++) {
    draw_text(xx, yy, lines[| i]);
    yy += lh;
}

ds_list_destroy(lines);
