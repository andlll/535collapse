// muraplacer_os — Step (eventtype=3 enumb=0)
// Estratto da gmx/objects/muraplacer_os.object.gmx con tools/02_extract.py: non modificare a mano.

// --- azione 1: execute code ---
diro=point_direction(x,y,mouse_x,mouse_y)
if diro>=120 && diro<180
if instance_number(oodl)=0
    {instance_create(x-208,y,oodl)
    with (ovbl)
    instance_destroy()
    with (oval)
    instance_destroy()}
if diro>60 && diro<=120
if instance_number(ovbl)=0
    {instance_create(x,y,ovbl)
    with (oodl)
    instance_destroy()
    with (oval)
    instance_destroy()}
if diro>0 && diro<=60
    {with (oval)
    instance_destroy()
    with (ovbl)
    instance_destroy()
    with (oodl)
    instance_destroy()}
if diro>=310
    {with (oval)
    instance_destroy()
    with (ovbl)
    instance_destroy()
    with (oodl)
    instance_destroy()}
if diro>240 && diro<310
if instance_number(oval)=0
    {instance_create(x,y+246,oval)
    with (oodl)
    instance_destroy()
    with (ovbl)
    instance_destroy()}
