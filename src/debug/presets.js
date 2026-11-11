// Debug chapter starts: ?debug=1&start=<preset>. Flags and items as if earlier chapters were played.
const t = (...names) => Object.fromEntries(names.map((n) => [n, true]));
const base = { flags: t('woke', 'has_candle', 'read_note', 'corridor_seen'), inv: ['candle'], bond: 0 };
const afterRehearsal = { flags: { ...base.flags, ...t('rehearsal_talk', 'has_office_key', 'office_unlocked', 'costume_open', 'chase1_escaped', 'hush_done', 'chase1_done', 'vesna_left_piano') }, inv: ['candle', 'office_key', 'lighter'], bond: 0, devotion: 4 };
const afterOffice = { flags: { ...afterRehearsal.flags, ...t('office_seen', 'safe_open', 'stairs_open', 'read_ledger') }, inv: [...afterRehearsal.inv, 'musicbox_key', 'ribbon'], bond: 0, devotion: 5 };
const afterBath = { flags: { ...afterOffice.flags, ...t('bath_seen', 'bath_talk', 'chase2_done', 'theatre_open') }, inv: [...afterOffice.inv, 'chain_key'], bond: 0, devotion: 6 };

export const PRESETS = {
  dorm: { room: 'dorm', spawn: 'bed', flags: {}, inv: [], bond: 0 },
  rehearsal: { room: 'rehearsal', spawn: 'door', ...base },
  mirror: { room: 'rehearsal', spawn: 'mirror', ...base, flags: { ...base.flags, rehearsal_talk: true } },
  office: { room: 'office', spawn: 'door', ...afterRehearsal },
  bath: { room: 'bath', spawn: 'stairs', ...afterOffice },
  theatre: { room: 'theatre', spawn: 'door', ...afterBath, flags: { ...afterBath.flags } },
  lake: { room: 'lake', spawn: 'shore', ...afterBath, flags: { ...afterBath.flags, to_lake: true, truth_seen: true } },
};
