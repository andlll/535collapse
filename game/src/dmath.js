// [§9.152, richiesta dell'autore: multiplayer, fase 1] Funzioni matematiche
// deterministiche: lo stesso risultato, bit per bit, in ogni browser.
//
// In JavaScript somme, prodotti, divisioni e Math.sqrt sono IEEE 754 a
// doppia precisione con arrotondamento esatto, e il linguaggio vieta di
// fonderle (niente FMA): danno lo stesso bit dappertutto. Math.sin, cos,
// atan2, hypot, exp, log invece sono "approssimazioni dipendenti
// dall'implementazione": V8 (Chrome), SpiderMonkey (Firefox) e JavaScriptCore
// (Safari) possono differire nell'ultimo bit, e in una partita in rete (due
// browser che simulano la stessa partita) un bit diverso diventa, dopo
// migliaia di passi, un'unita' che colpisce o no.
//
// Qui gli algoritmi di fdlibm (FreeBSD msun: __kernel_sin, __kernel_cos,
// atan), scritti solo con + - * / e Math.round / Math.sqrt / Math.abs:
// errore entro un paio di ulp rispetto al valore vero (test/dmath.test.mjs).
// Il gioco li usa al posto di Math.* in tutti i file (test/determinism.test.mjs
// controlla che non ne restino).

// pi/2 in due pezzi per la riduzione dell'argomento (Cody-Waite)
const PIO2_HI = 1.5707963267341256, PIO2_LO = 6.077100506506192e-11, INV_PIO2 = 0.6366197723675814;
const S1 = -1.66666666666666324348e-01, S2 = 8.33333333332248946124e-03, S3 = -1.98412698298579493134e-04,
  S4 = 2.75573137070700676789e-06, S5 = -2.50507602534068634195e-08, S6 = 1.58969099521155010221e-10;
const C1 = 4.16666666666666019037e-02, C2 = -1.38888888888741095749e-03, C3 = 2.48015872894767294178e-05,
  C4 = -2.75573143513906633035e-07, C5 = 2.08757232129817482790e-09, C6 = -1.13596475577881948265e-11;

// sin e cos di r in [-pi/4, pi/4]
function ksin(r) {
  const z = r * r;
  return r + r * z * (S1 + z * (S2 + z * (S3 + z * (S4 + z * (S5 + z * S6)))));
}
function kcos(r) {
  const z = r * r;
  return 1 - 0.5 * z + z * z * (C1 + z * (C2 + z * (C3 + z * (C4 + z * (C5 + z * C6)))));
}

// x = n * pi/2 + r: [n mod 4, r]
function reduce(x) {
  const n = Math.round(x * INV_PIO2);
  return [((n % 4) + 4) % 4, (x - n * PIO2_HI) - n * PIO2_LO];
}

export function dsin(x) {
  if (!Number.isFinite(x)) return NaN;
  const [q, r] = reduce(x);
  return q === 0 ? ksin(r) : q === 1 ? kcos(r) : q === 2 ? -ksin(r) : -kcos(r);
}

export function dcos(x) {
  if (!Number.isFinite(x)) return NaN;
  const [q, r] = reduce(x);
  return q === 0 ? kcos(r) : q === 1 ? -ksin(r) : q === 2 ? -kcos(r) : ksin(r);
}

// atan (fdlibm s_atan.c)
const ATANHI = [4.63647609000806093515e-01, 7.85398163397448278999e-01, 9.82793723247329054082e-01, 1.57079632679489655800e+00];
const ATANLO = [2.26987774529616870924e-17, 3.06161699786838301793e-17, 1.39033110312309984516e-17, 6.12323399573676603587e-17];
const AT = [3.33333333333329318027e-01, -1.99999999998764832476e-01, 1.42857142725034663711e-01, -1.11111104054623557880e-01,
  9.09088713343650656196e-02, -7.69187620504482999495e-02, 6.66107313738753120669e-02, -5.83357013379057348645e-02,
  4.97687799461593236017e-02, -3.65315727442169155270e-02, 1.62858201153657823623e-02];

export function datan(x) {
  if (Number.isNaN(x)) return NaN;
  const neg = x < 0;
  let a = Math.abs(x), id = -1;
  if (a >= 2.4375) {
    if (a === Infinity) return neg ? -ATANHI[3] : ATANHI[3];
    id = 3; a = -1 / a;
  } else if (a >= 1.1875) { id = 2; a = (a - 1.5) / (1 + 1.5 * a); }
  else if (a >= 0.6875) { id = 1; a = (a - 1) / (a + 1); }
  else if (a >= 0.4375) { id = 0; a = (2 * a - 1) / (2 + a); }
  const z = a * a, w = z * z;
  const s1 = z * (AT[0] + w * (AT[2] + w * (AT[4] + w * (AT[6] + w * (AT[8] + w * AT[10])))));
  const s2 = w * (AT[1] + w * (AT[3] + w * (AT[5] + w * (AT[7] + w * AT[9]))));
  const r = id < 0 ? a - a * (s1 + s2) : ATANHI[id] - ((a * (s1 + s2) - ATANLO[id]) - a);
  return neg ? -r : r;
}

const PI = 3.141592653589793, PI_LO = 1.2246467991473532e-16, HALF_PI = 1.5707963267948966;
// atan2 (fdlibm e_atan2.c, i casi del gioco: niente infiniti)
export function datan2(y, x) {
  if (Number.isNaN(x) || Number.isNaN(y)) return NaN;
  if (y === 0) return x >= 0 && !Object.is(x, -0) ? y : (Object.is(y, -0) ? -PI : PI);
  if (x === 0) return y > 0 ? HALF_PI : -HALF_PI;
  const t = datan(Math.abs(y / x));
  if (x > 0) return y > 0 ? t : -t;
  const r = PI - (t - PI_LO);
  return y > 0 ? r : -r;
}

// hypot: la radice e' esatta (IEEE); i numeri del gioco non arrivano
// all'overflow da cui Math.hypot si protegge
export const dhypot = (x, y) => Math.sqrt(x * x + y * y);

// il quadrato: `x ** 2` e' "approssimato dall'implementazione" come Math.pow
export const sq = (v) => v * v;
