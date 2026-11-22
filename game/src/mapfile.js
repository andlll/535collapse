// Le mappe come dati (STUDIO.md §9.180, §9.181): lo scenario "535-scenario"
// (§9.3, quello che scrive tools/12_tiled_import.py e che sta in scenari/)
// e la room del motore (game/assets/rooms/<room>.json, tools/07_scene.py).
//
// L'editor di mappe lavora sugli scenari: apre le mappe del gioco (room) e le
// riporta a scenario (roomToScenario); per provarle nel gioco fara' il
// contrario (scenarioToRoom, la stessa conversione di tools/07_scene.py).

export const MAP_FORMAT = "535-scenario", MAP_VERSION = 1;
// colore della room [C] (12632256 = c_silver in BGR) e sfondo predefiniti,
// come la mappa vuota del kit di Tiled (tools/11 --nuova)
export const MAP_COLOUR = 12632256, MAP_BACKGROUND = "green1";
// le parti disegnate a linee e a forme (§9.97, §9.99, §9.101), solo se ci
// sono, come in tools/07
export const MAP_FEATURES = ["patches", "roads", "rivers", "bridges", "paths"];

// Una mappa vuota: 6000 x 6000, sfondo green1. Manager e vista iniziale: li
// aggiunge l'editor (§9.180, "Da decidere").
export function newMap({ name = "", width = 6000, height = 6000, background = MAP_BACKGROUND } = {}) {
  return { format: MAP_FORMAT, version: MAP_VERSION, name, width, height, background, colour: MAP_COLOUR,
           view: { x: 0, y: 0, w: 3000, h: 2000 },
           instances: [], roads: [], rivers: [], bridges: [], patches: [] };
}

// Room del motore -> scenario. Le istanze: [oggetto, x, y, scala x, scala y,
// rotazione, colore, gruppo?] (tools/07); il colore e' sempre il bianco pieno
// negli scenari (4294967295) e non si riporta.
export function roomToScenario(room) {
  const v = (room.views && room.views[0]) || { xview: 0, yview: 0, wview: 3000, hview: 2000 };
  const bg = (room.backgrounds || []).find((b) => b.visible !== false && b.name);
  const sc = {
    format: MAP_FORMAT, version: MAP_VERSION, name: room.name || "", width: room.width, height: room.height,
    background: bg ? bg.name : "", colour: room.colour ?? MAP_COLOUR,
    view: { x: v.xview, y: v.yview, w: v.wview, h: v.hview },
    instances: room.instances.map(([object, x, y, sx, sy, rot, , group]) => {
      const i = { object, x, y, scale_x: sx, scale_y: sy, rotation: rot };
      if (group) i.group = group;
      return i;
    }),
  };
  for (const k of MAP_FEATURES) sc[k] = room[k] ? JSON.parse(JSON.stringify(room[k])) : [];
  return sc;
}

// Scenario -> room del motore: come tools/07_scene.py (gli scenari di
// scenari/ diventano game/assets/rooms/<nome>.json).
export function scenarioToRoom(sc) {
  const v = sc.view;
  const room = {
    name: sc.name, width: sc.width, height: sc.height, speed: 60, colour: sc.colour,
    views: [{ index: 0, follow: "mouser", xview: v.x, yview: v.y, wview: v.w, hview: v.h, xport: 0, yport: 0,
              wport: 1024, hport: 768, hborder: 32, vborder: 32, hspeed: -1, vspeed: -1 }],
    backgrounds: sc.background ? [{ name: sc.background, visible: true, foreground: false, x: 0, y: 0, htiled: true,
                                    vtiled: true, hspeed: 0, vspeed: 0, stretch: false }] : [],
    objects: [...new Set(sc.instances.map((i) => i.object))].sort(),
    instances: sc.instances.map((i) => [i.object, i.x, i.y, i.scale_x, i.scale_y, i.rotation, 4294967295]
      .concat(i.group ? [i.group] : [])),
  };
  for (const k of MAP_FEATURES) if (sc[k] && sc[k].length) room[k] = sc[k];
  return room;
}
