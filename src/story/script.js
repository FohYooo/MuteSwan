// The story of one night, as room events. Each event is async (S, ctx) => void; S is the
// script context built by story/runner.js (or a stub in tests).
import { L } from './lines.js';
import { chooseEnding } from './ledger.js';

const once = (S, flag) => { if (S.flag(flag)) return false; S.flag(flag, true); return true; };
const SAFE_CODE = '1478';

export const EVENTS = {
  // ---- dormitory -----------------------------------------------------------
  async mira_bed(S) { await S.lines(L.mira_bed); },
  async dorm_candle(S) {
    if (S.has('candle')) return S.lines(L.candle_none);
    S.give('candle'); S.flag('has_candle', true); S.sfx('pickup');
    await S.lines(L.candle_take);
  },
  async vesna_bed(S) {
    if (!once(S, 'read_vesna_bed')) return S.lines(L.vesna_bed_again);
    await S.lines(L.vesna_bed);
    S.care('dev', 1); // reading her things
  },
  async empty_bed(S) {
    const n = (S.state.emptyBeds = ((S.state.emptyBeds ?? -1) + 1) % L.empty_beds.length);
    await S.lines(L.empty_beds[n]);
  },
  async dorm_wardrobe(S) {
    if (!once(S, 'read_lists')) return S.lines(L.lists_again);
    await S.lines(L.lists_first);
    await S.play('watching');
    await S.lines(L.lists_after);
    S.care('dev', 1);
  },
  async diary(S, ctx = {}) {
    const page = ctx.obj?.page ?? 0;
    S.flag(`diary_${page}`, true);
    S.sfx('page');
    await S.lines(L.diary_found);
    await S.lines(L.diary[page]);
    S.care('dev', 1);
  },
  async dorm_note(S) {
    S.sfx('page');
    await S.lines(L.note);
    S.flag('read_note', true);
  },
  async dorm_mirror(S) {
    await S.lines(L.mirror_fog);
    const c = await S.choose(['Wipe the glass', 'Leave it']);
    await S.lines(c === 0 ? L.mirror_wipe : L.mirror_leave);
  },
  async dorm_window(S) { await S.lines(L.dorm_window); },

  // ---- corridor --------------------------------------------------------------
  async portrait(S, ctx = {}) {
    const o = ctx.obj || {};
    await S.lines([L.portrait_tpl.replace('NAME', o.name || 'A prima').replace('YEAR', String(o.year || '????'))]);
  },
  async corridor_window(S) {
    S.state.windowLooks = (S.state.windowLooks || 0) + 1;
    if (S.state.windowLooks === 1) return S.play('window1');
    if (S.state.windowLooks === 2) { await S.play('window2'); return S.lines(L.window_3_warn); }
    return S.wrong('look_away');
  },
  async corridor_shelf(S) { await S.lines(L.corridor_shelf); },
  async theatre_chain(S) {
    if (S.has('chain_key') && S.has('musicbox_key')) { S.flag('theatre_open', true); S.sfx('locked'); return S.lines(L.chain_open); }
    await S.lines(L.chain_locked);
  },

  // ---- rehearsal hall ---------------------------------------------------------
  async rehearsal_talk(S) {
    S.flag('rehearsal_talk', true);
    await S.lines(L.v1_a);
    await S.write(L.v1_choice, { prompt: 'She is looking at the keys, not at me.' });
    await S.lines(L.v1_b);
    await S.write(L.v1_choice2, { seed: 11 });
    await S.lines(L.v1_c);
  },
  async piano(S) { await S.lines(S.flag('vesna_left_piano') ? L.piano_empty : L.piano_after); },
  async barre(S) { await S.lines(L.barre); },
  async rehearsal_mirror(S) { await S.lines(S.has('office_key') ? L.mirror_room_after : L.mirror_room); },
  async mirror_key(S) {
    S.give('office_key'); S.flag('has_office_key', true); S.flag('office_unlocked', true); S.sfx('pickup');
    await S.lines(L.mirror_key);
    S.checkpoint();
    await EVENTS.scare1(S);
  },
  async scare1(S) {
    S.placePlayer?.(7, 4, 'up');
    S.addActor({ id: 'prima', sprite: 'prima', x: 7, y: 7, dir: 'up', mirrorOnly: true });
    S.sfx('sting');
    await S.wait(600);
    await S.lines(L.scare1_a);
    S.remove('vesna');
    S.flag('vesna_left_piano', true);
    S.music(null);
    S.actorSet?.('prima', { mirrorOnly: false });
    await S.lines(L.scare1_b);
    const won = await S.freeze({ windowMs: 7000, approach: { id: 'prima', from: [7, 7], to: [7, 5] } });
    if (!won) return S.wrong('still_life');
    S.flag('costume_open', true);
    const out = await S.chase('costume', { x: 3, y: 2 }); // she lunges out of the mirror
    if (out === 'caught') return S.wrong('caught');
    if (out !== 'escaped') return; // the chase was cancelled (a Wrong End elsewhere)
    S.flag('chase1_escaped', true);
    S.checkpoint();
    await S.fadeIn?.();
    await EVENTS.costume_hush(S);
  },

  // ---- costume room -----------------------------------------------------------
  async costume_hush(S) {
    await S.lines(L.hide);
    await S.walkPlayer(2, 4);
    S.hidePlayer(true);
    S.sfx('creak');
    S.addActor({ id: 'prima', sprite: 'prima', x: 8, y: 10, dir: 'up' });
    const route = [[8, 10], [9, 7], [9, 3], [5, 3], [9, 3], [9, 7], [8, 10]];
    const ok = await S.hush({ windowMs: 8000, route: { id: 'prima', points: route } });
    if (!ok) { S.hidePlayer(false); return S.wrong('breath'); }
    S.remove('prima');
    S.hidePlayer(false);
    S.flag('hush_done', true);
    S.flag('chase1_done', true);
    await S.lines(L.hush_won);
    S.checkpoint();
  },
  async wardrobe(S) { await S.lines(L.wardrobe_again); },
  async shrine(S) {
    if (!once(S, 'shrine_seen')) return S.lines(L.shrine_again);
    await S.lines(L.shrine_first);
    await S.play('shrine');
    await S.lines(L.shrine_after);
    S.care('dev', 1);
  },
  async rack_white(S) { await S.lines(L.rack_white); },
  async rack_black(S) {
    if (S.has('lighter')) return S.lines(L.rack_black_after);
    await S.lines(L.rack_black_first);
    S.give('lighter'); S.care('dev', 1); S.sfx('pickup');
    await S.lines(L.lighter);
    await S.play('roof');
  },
  async mannequin(S) { await S.lines(L.mannequin); },
  async fabric_shelf(S) { await S.lines(L.fabric_shelf); },

  // ---- office ---------------------------------------------------------------------
  async desk(S) { S.sfx('page'); await S.lines(L.ledger); S.flag('read_ledger', true); },
  async clipping(S) { await S.lines(L.clipping); S.flag('read_clipping', true); },
  async madame_portrait(S) { await S.lines(L.madame); },
  async office_books(S) { await S.lines(L.office_books); },
  async safe(S) {
    if (S.flag('safe_open')) return S.lines(L.safe_empty);
    const code = await S.codepad(4);
    if (code !== SAFE_CODE) { if (code !== null) await S.lines(L.safe_wrong); return; }
    S.flag('safe_open', true); S.sfx('door');
    S.give('musicbox_key'); S.give('ribbon'); S.care('dev', 1);
    S.flag('stairs_open', true);
    await S.lines(L.safe_open);
  },

  // ---- bath house -------------------------------------------------------------------
  async tub_plain(S) { await S.lines(L.tub_plain); },
  async tub_bubble(S) {
    await S.lines(L.tub_bubble);
    const c = await S.choose(L.tub_bubble_q);
    if (c === 0) return S.wrong('black_water');
    await S.lines(L.tub_bubble_back);
  },
  async tub_corpse(S) {
    if (S.has('chain_key')) return S.lines(L.corpse_after);
    S.sfx('gore');
    await S.lines(L.corpse);
    const c = await S.choose(L.corpse_q);
    if (c === 2) return S.lines(L.corpse_leave);
    if (c === 0) { S.care('dev', 1); await S.lines(L.corpse_gentle); }
    S.give('chain_key'); S.sfx('pickup');
    await S.lines(L.corpse_key);
    S.addActor({ id: 'vesna', sprite: 'vesna', x: 15, y: 3, dir: 'down', alpha: 0.6, light: { r: 40 } });
  },
  async glass(S) {
    if (!S.has('chain_key') || S.flag('bath_talk')) return S.lines(L.glass_after);
    S.flag('bath_talk', true);
    await S.lines(L.v3_a);
    await S.write(L.v3_choice, { seed: 23 });
    await S.lines(L.v3_b);
    S.remove('vesna');
    S.checkpoint();
    await EVENTS.scare2(S);
  },
  async scare2(S) {
    S.music(null);
    S.sfx('splash');
    S.addActor({ id: 'prima', sprite: 'prima', x: 16, y: 7, dir: 'up' });
    await S.lines(L.scare2);
    const won = await S.freeze({ windowMs: 5000, approach: { id: 'prima', from: [16, 7], to: [S.playerTile?.()[0] ?? 15, (S.playerTile?.()[1] ?? 6) + 1] } });
    if (!won) return S.wrong('still_life');
    const out = await S.chase('theatre', { x: 19, y: 7 });
    if (out === 'caught') return S.wrong('caught');
    if (out !== 'escaped') return;
    S.flag('chase2_done', true);
    S.checkpoint();
    await S.fadeIn?.();
    await EVENTS.theatre_intro(S);
  },
  async sink(S) { await S.lines(L.sink); },
  async bath_pool(S) { await S.lines(L.pool); },

  // ---- theatre ------------------------------------------------------------------------
  async theatre_intro(S) {
    S.music('musicbox');
    S.addActor({ id: 'vesna', sprite: 'vesna', x: 12, y: 5, dir: 'down', light: { r: 60 }, event: 'vesna_stage' });
    await S.lines(L.theatre_first);
  },
  async vesna_stage(S) {
    await S.lines(L.v4_a);
    const c = await S.write(L.v4_choice, { seed: 31 });
    if (c < 2) await S.play('duet'); else await S.lines(L.v4_watch);
    await S.lines(L.v4_b);
    await S.walk('vesna', 22, 2, 0.8);
    S.remove('vesna');
    S.flag('to_lake', true);
    S.checkpoint();
  },
  async playbill(S) { await S.lines(L.playbill); S.flag('read_playbill', true); },
  async seat(S) { await S.lines(L.seat); },
  async paper_moon(S) { await S.lines(L.paper_moon); },
  async swan_prop(S) { await S.lines(L.swan_prop); },
  async musicbox(S) { S.sfx('box_note'); await S.lines(L.musicbox); },
  async curtain(S) { await S.lines(L.curtain); },

  // ---- the lake ----------------------------------------------------------------------------
  async ice_hole(S) { await S.lines(L.lake_a); },
  async finale(S) {
    S.checkpoint();
    S.music('drone_lake');
    S.addActor({ id: 'prima', sprite: 'prima', x: 20, y: 9, dir: 'down' });
    S.addActor({ id: 'vesna', sprite: 'vesna', x: 20, y: 18, dir: 'up', light: { r: 50 } });
    await S.lines(L.lake_a);
    await S.walk('vesna', 20, 13, 0.45);
    await S.lines(L.lake_b);
    await S.walk('vesna', 20, 11, 0.35);
    const tiers = S.tiers();
    if (tiers.dist >= 4) {
      // too far gone to care: the page stays blank
      await S.write([{ text: ' ', blank: true }], { prompt: 'She is at the edge of the hole.', seed: 41 });
      await S.lines(L.hollow_page);
      return S.ending('hollow');
    }
    // too far gone the other way: only one line is still hers to write
    const options = tiers.dev >= 4 ? [{ text: L.lake_choice[0], struck: true }, { text: L.lake_choice[1] }] : L.lake_choice;
    const come = (await S.write(options, { prompt: 'She is at the edge of the hole.', seed: 41 })) === 1;
    let finaleWon = false;
    if (!come) {
      const screamed = await S.noo({ windowMs: 14000, sink: { id: 'vesna', from: [20, 11], to: [20, 10] } });
      if (screamed) {
        await S.lines(L.noo_won);
        S.sfx('ice_crack');
        await S.lines(L.ice_breaks);
        finaleWon = await S.runFor({ windowMs: 6000 });
      }
    }
    await S.ending(chooseEnding({ finaleWon, choseComeWithMe: come, ledger: S.state.ledger }));
  },
};

export const ON_ENTER = {
  async dorm(S) { if (once(S, 'woke')) await S.lines(L.wake); },
  async corridor(S) { if (once(S, 'corridor_seen')) await S.lines(L.corridor_first); },
  async rehearsal(S) {
    if (S.flag('has_office_key') && !S.flag('chase1_escaped')) return EVENTS.scare1(S);
    if (!S.flag('rehearsal_talk')) {
      S.music('piano');
      S.addActor({ id: 'vesna', sprite: 'vesna', x: 17, y: 10, dir: 'up', light: { r: 50 } });
      await S.lines(L.rehearsal_first);
      await S.walkPlayer(16, 11);
      return EVENTS.rehearsal_talk(S);
    }
    if (!S.flag('vesna_left_piano')) {
      S.music('piano');
      S.addActor({ id: 'vesna', sprite: 'vesna', x: 17, y: 10, dir: 'up', light: { r: 50 } });
    }
  },
  async costume(S) { if (S.flag('chase1_escaped') && !S.flag('hush_done')) await EVENTS.costume_hush(S); },
  async office(S) { if (once(S, 'office_seen')) await S.lines(L.office_first); },
  async bath(S) {
    if (once(S, 'bath_seen')) await S.lines(L.bath_first);
    if (S.flag('bath_talk') && !S.flag('chase2_done')) return EVENTS.scare2(S);
    if (S.has('chain_key') && !S.flag('bath_talk')) S.addActor({ id: 'vesna', sprite: 'vesna', x: 15, y: 3, dir: 'down', alpha: 0.6, light: { r: 40 } });
  },
  async theatre(S) { if (S.flag('chase2_done') && !S.flag('to_lake')) await EVENTS.theatre_intro(S); },
  async lake(S) { await EVENTS.finale(S); },
};

// Door rules: returns true to go through.
export async function onDoor(S, door, { chasing = false } = {}) {
  if (door.lock === 'theatre_open' && !S.flag('theatre_open') && S.has('chain_key') && S.has('musicbox_key')) {
    S.flag('theatre_open', true);
    if (chasing) { S.toast?.('The chain falls.'); return true; }
    await S.lines(L.chain_open);
    return true;
  }
  if (door.to === 'corridor' && S.state.room === 'dorm' && !S.has('candle')) { await S.lines(L.too_dark); return false; }
  if (door.lock && !S.flag(door.lock)) {
    const msg = { costume_open: L.locked_costume, office_unlocked: L.locked_office, stairs_open: L.locked_stairs, theatre_open: L.chain_locked, never: L.locked_never }[door.lock];
    if (chasing) { S.sfx('locked'); S.toast?.('Locked!'); return false; }
    if (msg) await S.lines(msg);
    return false;
  }
  if (door.to === 'lake' && once(S, 'truth_seen')) { await S.lines(L.follow); await S.play('truth'); }
  return true;
}

// New game: the prologue, the RUN that would not come, then the dormitory.
export async function prologue(S) {
  await S.play('prologue');
  await S.freeze({ windowMs: 6000, crackAt: 2 });
  await S.play('prologue_after');
}
