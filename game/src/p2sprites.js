// [§9.155, multiplayer, fase 3] Gli sprite del giocatore 2.
//
// Decisione dell'autore (17 novembre 2026): nel multiplayer il secondo
// giocatore ha oggetti suoi, gemelli di quelli del giocatore (p2_*: la
// stessa logica, le stesse maschere), ma si vede con gli sprite blu dei
// nemici della CPU, non con una tinta. Uno dei due giocatori si vede rosso
// (gli sprite di sempre), l'altro blu.
//
// La partita usa per i gemelli gli sprite del giocatore (stesse maschere,
// stessi fotogrammi: la simulazione non sa di colori); solo il disegno
// (world.draw, sprites.js setSpriteRemap) mette al posto di ognuno il suo
// corrispondente blu, da questa tabella. Senza corrispondente resta quello
// del giocatore: cantieri e rovine (neutri, il nemico ha un cantiere solo),
// le icone.

// le famiglie d'animazione (prefisso + direzione e fotogramma): giocatore ->
// nemico (animTables.js, i blocchi ally_* e *_corpse contro enemy_*)
export const P2_FAMILIES = {
  ww: "bww", wa: "bwa", ff: "bfg",                    // guerriero (ff: il colpo, anche del picchiere)
  pw: "bpw", pa: "bpa",                               // picchiere
  cm: "bcw", ca: "bca",                               // cavaliere
  aw: "baw", aa: "baa",                               // arciere
  arm: "barm", ara: "bara",                           // ariete
  catm: "bcatm", cati: "bcati", catt: "bcatt",        // catapulta
  os: "b_os", ow: "b_ow", ob: "b_ob", owo: "b_owo", car: "b_car", // civile (la CPU non li usa: enemy_omino e' rosso)
  wc: "bwc", pc: "bpd", cc: "bcd", ac: "bac", arc: "bard", catc: "bcatc", oc: "b_oc", // cadaveri
};
// gli altri, uno per uno (edifici finiti, mura e porte, campo, bandiera)
export const P2_EXACT = {
  cc_spr: "cc_b", cas_spr: "cas_b", castello_spr: "castello_b", torre_spr: "torre_b", chiesa_spr: "chiesa_b",
  magazzino_spr: "magazzino_b", stal_spr: "stal_b", barn_spr: "mub", campo2: "campo1", rflag: "bflag",
};

// il corrispondente blu di `name` fra gli sprite `S` (nome -> sprite), o null
export function p2Target(name, S) {
  if (P2_EXACT[name]) return S[P2_EXACT[name]] ? P2_EXACT[name] : null;
  const m = /^([a-z]+)(\d\d)$/.exec(name);
  if (m && P2_FAMILIES[m[1]]) {
    const fam = P2_FAMILIES[m[1]], dir = m[2][0];
    if (S[fam + m[2]]) return fam + m[2];
    // un fotogramma che manca (bwa31, bpa31): il primo che c'e' nella stessa direzione
    for (let k = 1; k <= 9; k++) if (S[fam + dir + k]) return fam + dir + k;
    return null;
  }
  // le case (c1s..c6s -> c1b..c6b), mura e porte e i loro danni
  // (m_ori -> m_ori_b, castello_r1 -> castello_b_r1, m_ori_pa_r2 -> m_ori_pa_b_r2)
  const casa = /^c([1-6])s$/.exec(name);
  if (casa) return S["c" + casa[1] + "b"] ? "c" + casa[1] + "b" : null;
  const dmg = /^(.*)_r([12])$/.exec(name);
  if (dmg && S[dmg[1] + "_b_r" + dmg[2]]) return dmg[1] + "_b_r" + dmg[2];
  if (/^m_(ori|vert)(_pa?)?$/.test(name) && S[name + "_b"]) return name + "_b";
  return null;
}

// la tabella intera per gli sprite dell'atlas: nome -> nome blu
export function p2SpriteMap(S) {
  const out = {};
  for (const name of Object.keys(S)) {
    const t = p2Target(name, S);
    if (t && t !== name) out[name] = t;
  }
  return out;
}
