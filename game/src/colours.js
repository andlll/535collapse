// Colori di GameMaker: interi BGR (0xBBGGRR). Valori delle costanti c_* di
// GMS 1.x [I, documentazione del motore]; quelle usate dal gioco [C]:
// c_white, c_black, c_red, c_orange, c_teal, c_aqua, c_green, c_yellow,
// c_gray, c_dkgray, c_maroon, c_blue, c_olive.

export const c = {
  aqua: 0xffff00, black: 0x000000, blue: 0xff0000, dkgray: 0x404040, fuchsia: 0xff00ff,
  gray: 0x808080, green: 0x008000, lime: 0x00ff00, ltgray: 0xc0c0c0, maroon: 0x000080,
  navy: 0x800000, olive: 0x008080, orange: 0x40a0ff, purple: 0x800080, red: 0x0000ff,
  silver: 0xc0c0c0, teal: 0x808000, white: 0xffffff, yellow: 0x00ffff,
};

export function makeColourRgb(r, g, b) {
  return (r & 255) | ((g & 255) << 8) | ((b & 255) << 16);
}

// merge_colour(c1, c2, amount): interpolazione lineare per canale.
export function mergeColour(c1, c2, t) {
  const ch = (s) => Math.round(((c1 >> s) & 255) * (1 - t) + ((c2 >> s) & 255) * t);
  return ch(0) | (ch(8) << 8) | (ch(16) << 16);
}
