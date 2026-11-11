// The eight rooms of the Cygne Conservatory. Coordinates are in 16 px tiles.
// Tile chars: see gfx/tiles.js. '+' doors sit in top walls (push into them),
// 'D' doorways and 'v' stairs are walkable exits.

export const SOLID = ['#', '=', ' ', '|', '+', 'M', 'B', 'C', 'L', '~', 'O'];
export const isSolidChar = (ch) => ch === undefined || SOLID.includes(ch);

function grid(w, h, floor = '.') {
  const rows = ['#'.repeat(w), `#${'='.repeat(w - 2)}#`];
  for (let y = 2; y < h - 1; y++) rows.push(`#${floor.repeat(w - 2)}#`);
  rows.push('#'.repeat(w));
  return rows;
}

function put(rows, x, y, s) {
  rows[y] = rows[y].slice(0, x) + s + rows[y].slice(x + s.length);
}

// --- 1. Dormitory -----------------------------------------------------------
const dormRows = grid(20, 12);
put(dormRows, 4, 1, '|'); put(dormRows, 8, 1, 'M'); put(dormRows, 12, 1, '|'); put(dormRows, 16, 1, '+');
put(dormRows, 8, 6, '____'); put(dormRows, 8, 7, '____');

const dorm = {
  id: 'dorm', name: 'Dormitory', rows: dormRows, ambient: 0.17, music: 'drone_school',
  tileEvents: { M: 'dorm_mirror', '|': 'dorm_window' },
  objects: [
    { id: 'bed_mira', x: 2, y: 2, h: 2, sprite: 'bed', solid: true, event: 'mira_bed' },
    { id: 'stool', x: 3, y: 2, sprite: 'stool', solid: true, event: 'dorm_candle' },
    { id: 'stool_candle', x: 3, y: 2, sprite: 'candle', lift: 6, hideIf: 'has_candle', light: { r: 34 } },
    { id: 'bed_vesna', x: 6, y: 2, h: 2, sprite: 'bed_dark', solid: true, event: 'vesna_bed' },
    { id: 'bed3', x: 10, y: 2, h: 2, sprite: 'bed', solid: true, event: 'empty_bed' },
    { id: 'bed4', x: 14, y: 2, h: 2, sprite: 'bed', solid: true, event: 'empty_bed' },
    { id: 'bed5', x: 2, y: 8, h: 2, sprite: 'bed', solid: true, event: 'empty_bed' },
    { id: 'bed6', x: 6, y: 8, h: 2, sprite: 'bed', solid: true, event: 'empty_bed' },
    { id: 'bed7', x: 14, y: 8, h: 2, sprite: 'bed', solid: true, event: 'empty_bed' },
    { id: 'wardrobe', x: 17, y: 8, h: 2, sprite: 'wardrobe', solid: true, event: 'dorm_wardrobe' },
    { id: 'note', x: 16, y: 2, sprite: 'note', event: 'dorm_note', hideIf: 'read_note' },
  ],
  doors: [{ x: 16, y: 1, to: 'corridor', spawn: 'dorm' }],
  spawns: { bed: { x: 3, y: 3, dir: 'down' }, door: { x: 16, y: 3, dir: 'down' } },
};

// --- 2. East corridor (hub) -------------------------------------------------
const corRows = grid(40, 9);
put(corRows, 1, 4, '_'.repeat(38));
put(corRows, 2, 1, '+');
for (const x of [7, 17, 27]) put(corRows, x, 1, '|');
put(corRows, 12, 1, '+'); put(corRows, 22, 1, '+'); put(corRows, 30, 1, '+');
put(corRows, 33, 1, 'L'); put(corRows, 36, 1, '++');
put(corRows, 33, 7, 'vv');

const corridor = {
  id: 'corridor', name: 'East corridor', rows: corRows, ambient: 0.14, music: 'drone_school',
  tileEvents: { '|': 'corridor_window', L: 'corridor_shelf' },
  objects: [
    { id: 'portrait1', x: 5, y: 1, wall: true, sprite: 'portrait', event: 'portrait', year: 1891, name: 'Odalys Cygne' },
    { id: 'portrait2', x: 9, y: 1, wall: true, sprite: 'portrait', event: 'portrait', year: 1924, name: 'Irena Vauquelin' },
    { id: 'portrait3', x: 15, y: 1, wall: true, sprite: 'portrait', event: 'portrait', year: 1957, name: 'Margit Halloran' },
    { id: 'portrait4', x: 19, y: 1, wall: true, sprite: 'portrait', event: 'portrait', year: 1988, name: 'Lune Ostrova' },
    { id: 'chain', x: 36, y: 1, w: 2, wall: true, sprite: 'chain', hideIf: 'theatre_open', event: 'theatre_chain' },
    { id: 'cand1', x: 10, y: 2, sprite: 'candelabra', solid: true, light: { r: 44 } },
    { id: 'cand2', x: 25, y: 2, sprite: 'candelabra', solid: true, light: { r: 44 } },
    { id: 'cand3', x: 34, y: 2, sprite: 'candelabra', solid: true, light: { r: 44 } },
    { id: 'diary0', x: 26, y: 6, sprite: 'paper', event: 'diary', page: 0, hideIf: 'diary_0' },
  ],
  doors: [
    { x: 2, y: 1, to: 'dorm', spawn: 'door' },
    { x: 12, y: 1, to: 'rehearsal', spawn: 'door' },
    { x: 22, y: 1, to: 'costume', spawn: 'door', lock: 'costume_open' },
    { x: 30, y: 1, to: 'office', spawn: 'door', lock: 'office_unlocked' },
    { x: 36, y: 1, to: 'theatre', spawn: 'door', lock: 'theatre_open' },
    { x: 37, y: 1, to: 'theatre', spawn: 'door', lock: 'theatre_open' },
    { x: 33, y: 7, to: 'bath', spawn: 'stairs', lock: 'stairs_open' },
    { x: 34, y: 7, to: 'bath', spawn: 'stairs', lock: 'stairs_open' },
  ],
  spawns: {
    dorm: { x: 2, y: 2, dir: 'down' },
    rehearsal: { x: 12, y: 2, dir: 'down' },
    costume: { x: 22, y: 2, dir: 'down' },
    office: { x: 30, y: 2, dir: 'down' },
    theatre: { x: 36, y: 2, dir: 'down' },
    stairs: { x: 33, y: 6, dir: 'up' },
  },
};

// --- 3. Rehearsal hall --------------------------------------------------------
const rehRows = grid(24, 14);
put(rehRows, 1, 1, 'BB'); put(rehRows, 3, 1, 'M'.repeat(18)); put(rehRows, 21, 1, 'BB');
put(rehRows, 11, 13, 'DD');

const rehearsal = {
  id: 'rehearsal', name: 'Rehearsal hall', rows: rehRows, ambient: 0.16, music: 'drone_school',
  tileEvents: { M: 'rehearsal_mirror', B: 'barre' },
  objects: [
    { id: 'piano', x: 17, y: 8, w: 2, h: 2, sprite: 'piano', solid: true, event: 'piano' },
    { id: 'bench', x: 17, y: 10, w: 2, sprite: 'bench' },
    { id: 'cand1', x: 2, y: 11, sprite: 'candelabra', solid: true, light: { r: 46 } },
    { id: 'cand2', x: 21, y: 11, sprite: 'candelabra', solid: true, light: { r: 46 } },
    { id: 'stool1', x: 3, y: 6, sprite: 'stool' },
    { id: 'stool2', x: 5, y: 9, sprite: 'stool' },
    { id: 'mirror_key', x: 7, y: 4, sprite: 'key', mirrorOnly: true, event: 'mirror_key', hideIf: 'has_office_key' },
  ],
  doors: [
    { x: 11, y: 13, to: 'corridor', spawn: 'rehearsal' },
    { x: 12, y: 13, to: 'corridor', spawn: 'rehearsal' },
  ],
  spawns: { door: { x: 11, y: 12, dir: 'up' }, piano: { x: 16, y: 10, dir: 'right' }, mirror: { x: 12, y: 3, dir: 'up' } },
};

// --- 4. Costume room ---------------------------------------------------------
const cosRows = grid(18, 12);
put(cosRows, 4, 1, 'L'); put(cosRows, 12, 1, 'L');
put(cosRows, 8, 11, 'DD');

const costume = {
  id: 'costume', name: 'Costume room', rows: cosRows, ambient: 0.1, music: 'drone_school',
  tileEvents: { L: 'fabric_shelf' },
  objects: [
    { id: 'wardrobe1', x: 2, y: 2, h: 2, sprite: 'wardrobe', solid: true, event: 'wardrobe' },
    { id: 'wardrobe2', x: 15, y: 2, h: 2, sprite: 'wardrobe', solid: true, event: 'shrine' },
    { id: 'rack1', x: 5, y: 4, w: 2, sprite: 'rack', solid: true, event: 'rack_white' },
    { id: 'rack2', x: 10, y: 4, w: 2, sprite: 'rack', solid: true, event: 'rack_black' },
    { id: 'rack3', x: 5, y: 7, w: 2, sprite: 'rack', solid: true, event: 'rack_white' },
    { id: 'rack4', x: 10, y: 7, w: 2, sprite: 'rack', solid: true, event: 'rack_black' },
    { id: 'mannequin1', x: 3, y: 8, sprite: 'mannequin', solid: true, event: 'mannequin', turns: true },
    { id: 'mannequin2', x: 14, y: 8, sprite: 'mannequin', solid: true, event: 'mannequin', turns: true },
    { id: 'mannequin3', x: 8, y: 2, sprite: 'mannequin', solid: true, event: 'mannequin', turns: true },
    { id: 'candle', x: 13, y: 10, sprite: 'candle', light: { r: 36 } },
  ],
  doors: [
    { x: 8, y: 11, to: 'corridor', spawn: 'costume' },
    { x: 9, y: 11, to: 'corridor', spawn: 'costume' },
  ],
  spawns: { door: { x: 8, y: 10, dir: 'up' }, wardrobe: { x: 2, y: 4, dir: 'up' } },
};

// --- 5. Headmistress's office -------------------------------------------------
const offRows = grid(16, 11);
put(offRows, 2, 1, 'LLLL'); put(offRows, 10, 1, 'LLLL');
for (let y = 4; y <= 7; y++) put(offRows, 4, y, '________');
put(offRows, 7, 10, 'DD');

const office = {
  id: 'office', name: "Headmistress's office", rows: offRows, ambient: 0.12, music: 'drone_school',
  tileEvents: { L: 'office_books' },
  objects: [
    { id: 'desk', x: 6, y: 4, w: 2, sprite: 'desk', solid: true, event: 'desk', light: { r: 40 } },
    { id: 'chair', x: 7, y: 3, sprite: 'stool' },
    { id: 'safe', x: 13, y: 2, sprite: 'safe', solid: true, event: 'safe', frameIf: 'safe_open' },
    { id: 'clipping', x: 9, y: 6, sprite: 'paper', event: 'clipping' },
    { id: 'diary1', x: 3, y: 6, sprite: 'paper', event: 'diary', page: 1, hideIf: 'diary_1' },
    { id: 'madame', x: 8, y: 1, wall: true, sprite: 'portrait', event: 'madame_portrait' },
    { id: 'cand1', x: 2, y: 8, sprite: 'candelabra', solid: true, light: { r: 40 } },
  ],
  doors: [
    { x: 7, y: 10, to: 'corridor', spawn: 'office' },
    { x: 8, y: 10, to: 'corridor', spawn: 'office' },
  ],
  spawns: { door: { x: 7, y: 9, dir: 'up' } },
};

// --- 6. Bath house ------------------------------------------------------------
const bathRows = grid(22, 13, ',');
put(bathRows, 3, 1, '+');
for (let y = 8; y <= 10; y++) put(bathRows, 13, y, '~~~~~~~');

const bath = {
  id: 'bath', name: 'Bath house', rows: bathRows, ambient: 0.12, music: 'drone_bath',
  tileEvents: { '~': 'bath_pool' },
  objects: [
    { id: 'tub_corpse', x: 4, y: 4, w: 2, sprite: 'tub_corpse', solid: true, event: 'tub_corpse' },
    { id: 'tub_bubble', x: 8, y: 4, w: 2, sprite: 'tub_bubble', solid: true, event: 'tub_bubble' },
    { id: 'tub3', x: 4, y: 8, w: 2, sprite: 'tub', solid: true, event: 'tub_plain' },
    { id: 'tub4', x: 8, y: 8, w: 2, sprite: 'tub', solid: true, event: 'tub_plain' },
    { id: 'glass1', x: 12, y: 4, h: 2, sprite: 'glass', solid: true, event: 'glass', alpha: 0.82 },
    { id: 'glass2', x: 14, y: 4, h: 2, sprite: 'glass', solid: true, event: 'glass', alpha: 0.82 },
    { id: 'glass3', x: 16, y: 4, h: 2, sprite: 'glass', solid: true, event: 'glass', alpha: 0.82 },
    { id: 'sink1', x: 18, y: 2, sprite: 'sink', solid: true, event: 'sink' },
    { id: 'sink2', x: 20, y: 2, sprite: 'sink', solid: true, event: 'sink' },
    { id: 'candle1', x: 2, y: 10, sprite: 'candle', light: { r: 38 } },
    { id: 'candle2', x: 11, y: 2, sprite: 'candle', light: { r: 30 } },
    { id: 'diary2', x: 19, y: 11, sprite: 'paper', event: 'diary', page: 2, hideIf: 'diary_2' },
  ],
  doors: [{ x: 3, y: 1, to: 'corridor', spawn: 'stairs' }],
  spawns: { stairs: { x: 3, y: 2, dir: 'down' }, pool: { x: 16, y: 7, dir: 'down' } },
};

// --- 7. Theatre ---------------------------------------------------------------
const thRows = grid(26, 16);
put(thRows, 1, 1, 'C'.repeat(24)); put(thRows, 22, 1, '+');
for (let y = 2; y <= 6; y++) put(thRows, 1, y, 'S'.repeat(24));
put(thRows, 1, 7, '='.repeat(24)); put(thRows, 12, 7, 'SS');
put(thRows, 12, 15, 'DD');

const seats = [];
for (const y of [9, 10, 11, 12]) {
  for (let x = 3; x <= 22; x++) {
    if (x >= 11 && x <= 14) continue;
    seats.push({ id: `seat_${x}_${y}`, x, y, sprite: 'seat', solid: true, event: 'seat' });
  }
}

const theatre = {
  id: 'theatre', name: 'Theatre', rows: thRows, ambient: 0.1, music: 'drone_school',
  tileEvents: { C: 'curtain' },
  objects: [
    { id: 'moon', x: 12, y: 2, w: 2, h: 2, sprite: 'moon', solid: true, event: 'paper_moon', light: { r: 54, color: '#a9bcd3' } },
    { id: 'swan_prop', x: 19, y: 4, sprite: 'swan', event: 'swan_prop' },
    { id: 'musicbox', x: 6, y: 4, sprite: 'musicbox', solid: true, event: 'musicbox' },
    { id: 'lamp1', x: 2, y: 6, sprite: 'candelabra', solid: true, light: { r: 50 } },
    { id: 'lamp2', x: 23, y: 6, sprite: 'candelabra', solid: true, light: { r: 50 } },
    ...seats,
    { id: 'playbill', x: 5, y: 10, sprite: 'playbill', event: 'playbill', lift: 4 },
  ],
  doors: [
    { x: 12, y: 15, to: 'corridor', spawn: 'theatre' },
    { x: 13, y: 15, to: 'corridor', spawn: 'theatre' },
    { x: 22, y: 1, to: 'lake', spawn: 'shore', lock: 'to_lake' },
  ],
  spawns: { door: { x: 12, y: 14, dir: 'up' }, stage: { x: 12, y: 5, dir: 'down' } },
};

// --- 8. The lake --------------------------------------------------------------
const lakeRows = [];
lakeRows.push('#'.repeat(40));
lakeRows.push(`#${' '.repeat(38)}#`);
for (let y = 2; y < 23; y++) {
  let row = '#:';
  for (let x = 2; x < 38; x++) row += y >= 19 ? ':' : '*';
  row += ':#';
  lakeRows.push(row);
}
lakeRows.push('#'.repeat(40));
put(lakeRows, 19, 7, 'OOO'); put(lakeRows, 19, 8, 'OOO');
put(lakeRows, 20, 23, 'D');

const lake = {
  id: 'lake', name: 'The lake', rows: lakeRows, ambient: 0.32, music: 'drone_lake',
  tileEvents: { O: 'ice_hole' },
  objects: [
    { id: 'feather1', x: 14, y: 12, sprite: 'feather' },
    { id: 'feather2', x: 25, y: 10, sprite: 'feather' },
    { id: 'feather3', x: 21, y: 15, sprite: 'feather' },
  ],
  doors: [{ x: 20, y: 23, to: 'theatre', spawn: 'stage', lock: 'never' }],
  spawns: { shore: { x: 20, y: 21, dir: 'up' }, edge: { x: 20, y: 10, dir: 'up' } },
};

export const ROOMS = { dorm, corridor, rehearsal, costume, office, bath, theatre, lake };
