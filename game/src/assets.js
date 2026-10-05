// Caricamento degli atlas per gruppo e tier (tools/05_atlas.py).
//
// - Concorrenza limitata (3 pagine alla volta): decodificare 13 pagine in
//   parallelo fa picchi di memoria e blocca il thread grafico (lezione NIMBUS).
// - Le pagine si decodificano gia' premoltiplicate (createImageBitmap) e
//   l'ImageBitmap si chiude subito dopo il caricamento in GPU: niente copia
//   in RAM dei 265 MB di texture.
// - Perdita del contesto WebGL: le texture spariscono; `reload()` le
//   riscarica (dalla cache HTTP del browser) e le ricarica in GPU.
// - `unloadGroup()` libera un gruppo che non serve piu' (p.es. la mappa della
//   campagna quando si lascia il menu).

const CONCURRENCY = 3;

export class Assets {
  constructor(renderer, base = "assets/") {
    this.r = renderer;
    this.base = base;
    this.groups = new Map(); // nome gruppo -> [texture per pagina]
    this.bg = new Map();     // nome sfondo -> texture
    this.loadedFiles = 0;
  }

  async init() {
    this.atlas = await (await fetch(this.base + "atlas.json")).json();
    this.sprites = this.atlas.sprites;
    for (const [name, g] of Object.entries(this.atlas.groups)) {
      for (const p of g.pages) {
        if (Math.max(p.width, p.height) > this.r.maxTextureSize) {
          throw new Error(`texture ${p.file} ${p.width}x${p.height} > MAX_TEXTURE_SIZE ${this.r.maxTextureSize} (${name})`);
        }
      }
    }
  }

  groupsOfTier(...tiers) {
    return Object.entries(this.atlas.groups).filter(([, g]) => tiers.includes(g.tier)).map(([n]) => n);
  }

  async _bitmap(file) {
    const blob = await (await fetch(this.base + file)).blob();
    return createImageBitmap(blob, { premultiplyAlpha: "premultiply", colorSpaceConversion: "none" });
  }

  // Carica i gruppi (e gli sfondi indicati), chiamando onProgress(fatti, totale).
  async load(groupNames, backgrounds = [], onProgress = () => {}) {
    const jobs = [];
    for (const g of groupNames) {
      if (this.groups.has(g)) continue;
      const pages = this.atlas.groups[g].pages;
      const slots = new Array(pages.length).fill(null);
      this.groups.set(g, slots);
      pages.forEach((p, i) => jobs.push(async () => {
        const bmp = await this._bitmap(p.file);
        slots[i] = this.r.createTexture(bmp);
        bmp.close();
      }));
    }
    for (const b of backgrounds) {
      if (this.bg.has(b) || !this.atlas.backgrounds[b]) continue;
      this.bg.set(b, null);
      jobs.push(async () => {
        const bmp = await this._bitmap(this.atlas.backgrounds[b].file);
        this.bg.set(b, this.r.createTexture(bmp, true));
        bmp.close();
      });
    }
    let done = 0;
    onProgress(0, jobs.length);
    const queue = jobs.slice();
    const worker = async () => {
      while (queue.length) {
        await queue.shift()();
        onProgress(++done, jobs.length);
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  }

  unloadGroup(name) {
    for (const t of this.groups.get(name) || []) this.r.deleteTexture(t);
    this.groups.delete(name);
  }

  // Dopo un webglcontextrestored: le vecchie texture non esistono piu'.
  async reload(onProgress) {
    const groups = [...this.groups.keys()];
    const bgs = [...this.bg.keys()];
    this.r.textures.clear();
    this.groups.clear();
    this.bg.clear();
    await this.load(groups, bgs, onProgress);
  }

  // Frame pronto da disegnare, o null se il gruppo non e' (ancora) caricato.
  frame(spriteName, index) {
    const s = this.sprites[spriteName];
    if (!s) return null;
    const n = s.frames.length;
    const f = s.frames[((Math.floor(index) % n) + n) % n];
    if (!f) return null;
    const pages = this.groups.get(s.group);
    const tex = pages && pages[f.page];
    return tex ? { s, f, tex } : null;
  }
}
