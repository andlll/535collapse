// legno_prizedrawer — Draw_GUI (eventtype=8 enumb=64)
// Estratto da gmx/objects/legno_prizedrawer.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
posx=x/global.scaleview-view_xview[0]/global.scaleview
posy=y/global.scaleview-view_yview[0]/global.scaleview
alf-=0.0333
draw_sprite_ext(ico_wood_prize,0,posx,posy+alf*100-100,1,1,0,c_white,alf)
