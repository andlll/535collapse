// View 0 di GameMaker: rettangolo di room disegnato su tutto il canvas.
//
// Dimensioni [C, manager Create/Alarm_2]: l'originale ridimensiona la view
// alla finestra del browser per global.scaleview (1 px di mondo = 1 px CSS a
// zoom 1); X/Z cambiano scaleview di 0,1 fra 1,0 e 1,5 (manager KeyPress_X,
// KeyPress_Z). Il "-5" sui lati di manager (bi1-5) era per evitare le barre
// di scorrimento della pagina HTML5: qui non serve.
//
// Inseguimento [C, room: view che segue "mouser" con bordi hborder/vborder,
// velocita' -1 = istantanea; mouser Step: x=mouse_x]: la view si sposta per
// tenere il puntatore a `hborder` dal bordo, quindi avvicinandosi al bordo
// lo schermo scorre. Regola dell'inseguimento [I, runner GMS]: la view si
// sposta del minimo necessario, poi resta dentro la room.
// [Deviazione] Se il puntatore esce dal canvas (pagina in un iframe di
// portale) lo scorrimento si ferma: nell'export HTML5 l'ultima posizione
// restava valida e la mappa continuava a scorrere da sola.

export class Camera {
  constructor(roomW, roomH, view) {
    this.roomW = roomW;
    this.roomH = roomH;
    this.x = view ? view.xview : 0;
    this.y = view ? view.yview : 0;
    this.w = view ? view.wview : 1600;
    this.h = view ? view.hview : 900;
    this.follow = view ? view.follow : null;
    this.hborder = view ? view.hborder : 0;
    this.vborder = view ? view.vborder : 0;
    this.scaleview = 1; // global.scaleview
  }

  // Dimensioni in pixel CSS dell'area di gioco (il "browser_width/height").
  resize(cssW, cssH) {
    this.cssW = cssW;
    this.cssH = cssH;
    this.w = cssW * this.scaleview;
    this.h = cssH * this.scaleview;
    this.clamp();
  }

  setScale(s) {
    this.scaleview = Math.round(Math.min(1.5, Math.max(1, s)) * 10) / 10;
    this.resize(this.cssW, this.cssH);
  }

  // mouse_x / mouse_y: posizione del puntatore in coordinate di room.
  toRoom(px, py) {
    return [this.x + px * (this.w / this.cssW), this.y + py * (this.h / this.cssH)];
  }

  followPoint(px, py) {
    if (px - this.x < this.hborder) this.x = px - this.hborder;
    if (this.x + this.w - px < this.hborder) this.x = px + this.hborder - this.w;
    if (py - this.y < this.vborder) this.y = py - this.vborder;
    if (this.y + this.h - py < this.vborder) this.y = py + this.vborder - this.h;
    this.clamp();
  }

  clamp() {
    this.x = Math.max(0, Math.min(this.x, this.roomW - this.w));
    this.y = Math.max(0, Math.min(this.y, this.roomH - this.h));
  }
}
