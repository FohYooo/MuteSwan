// Every line of in-game dialogue. A string is Mira's narration; [speaker, text] is a spoken line.
// Notebook choices are {text, tag}: 'dev' (caring / possessive), 'mid', 'dist' (cold / blank).
// Vesna never answers what Mira writes. Read her lines again once you know why.

export const L = {
  // ---- dormitory -----------------------------------------------------------
  wake: [
    'I wake up cold. I always wake up cold now.',
    'The dormitory is empty. Everyone went home before the storm. Everyone but me.',
    'And her. I can always tell when she is in the building.',
  ],
  candle_take: ['My candle, on the stool where I left it.', 'The wax is still warm. I am not.'],
  candle_none: ['Just the stool.'],
  mira_bed: ['My bed. The sheets are damp. They are always damp.'],
  vesna_bed: [
    "Vesna's bed. They never stripped it.",
    'Under the pillow: her cigarettes, and a lock of black hair tied with red thread.',
    'My hair. I never gave it to her.',
    'I have one of hers, sewn into my pillow. So we are even.',
  ],
  vesna_bed_again: ['Her bed. Some nights I could swear the sheets are warm.'],
  empty_beds: [
    ["Someone's bed. Made tight, the way Madame liked them."],
    ['A suitcase, packed and left behind. Nobody comes back for things here.'],
    ['A pair of pointe shoes hung on the bedpost by their ribbons, like something hanged.'],
  ],
  lists_first: ['My wardrobe. Rehearsal clothes, white and black.', 'And under them, the notebooks from before.'],
  lists_after: [
    'Page after page. What she ate. Who she smiled at. How many times a day she said my name.',
    'I underlined the days it was more than eleven.',
  ],
  lists_again: ['My lists. I know them by heart. I know her by heart.'],
  mirror_fog: ['The mirror is fogged over. I never wipe it anymore.'],
  mirror_wipe: [
    'The glass shows the dormitory. The beds. The window.',
    'And my candle, floating in the air by itself.',
    'Bad glass. It is an old school.',
  ],
  mirror_leave: ['I leave it fogged.'],
  dorm_window: ['Snow on the lake. The ice is thick this year. It was thick last year too.'],
  note: [
    'A note, slid under the door. I know the handwriting before I can read it.',
    ['Vesna', "Mira — I know it's stupid. I know. Rehearsal hall, the piano. I need to tell you something before the ice goes out. You'll come. You always come when I call. — V"],
    'Vesna is dead. Vesna is dead, and she is still calling me.',
    'And I am still coming.',
  ],
  too_dark: ['It is too dark out there without my candle.'],

  // ---- corridor --------------------------------------------------------------
  corridor_first: ['The east corridor. Every prima since the school opened, in oil, in gold frames.', 'Their eyes follow the candle. All of their eyes do.'],
  portrait_tpl: 'NAME. Prima. Lost to the lake, YEAR.',
  corridor_shelf: [
    'Programmes from a hundred winter recitals. Swan Lake, Swan Lake, Swan Lake.',
    "In last year's, every name has been inked out except two. V. KRAL. M. SØLV.",
    'I do not remember doing it. I do not remember not doing it.',
  ],
  window_3_warn: ["Don't look again. Don't."],
  chain_locked: ['The theatre doors are chained shut. A padlock, and under it a little brass lock shaped like a music box.'],
  chain_open: ['The padlock falls. The little brass lock plays three notes of the waltz and opens.'],
  locked_costume: ['Locked. The costume mistress always kept it locked.'],
  locked_office: ["The headmistress's office. Locked."],
  locked_stairs: ['The stairs to the bath house are roped off. A sign: CLOSED SINCE 1957.'],
  locked_never: ['The door back is gone. There is only forward.'],

  // ---- Vesna's diary pages (three, found apart) ------------------------------------
  diary_found: ['A torn page, in handwriting I know better than my own.'],
  diary: [
    [['Vesna', "Oct 3. She counts under her breath on the sixes. I've started counting with her, from across the room. She doesn't know I can hear it. I can hear everything she does."]],
    [['Vesna', "Nov 20. Madame wants to give Mira's Odile to Inès. Over my dead body. Over somebody's."], 'Inès broke her ankle on the stairs that week.', 'I remember being glad.'],
    [['Vesna', "Dec 10. Tomorrow I'll take her out on the ice, where nobody can watch us. Nobody else gets to see her dance it. Just me. Just me forever."], 'The tenth of December. The night before the lake.'],
  ],

  // ---- rehearsal hall ---------------------------------------------------------
  rehearsal_first: ['Someone is playing.', 'The swan theme, the way only one person ever played it. Too slow. Like it hurt.'],
  v1_a: [['Vesna', 'You came. Of course you came. You always come when I call.']],
  v1_choice: [
    { text: 'Only me. Promise you only ever played it for me.', tag: 'dev' },
    { text: 'I missed you.', tag: 'mid' },
    { text: '(write nothing)', tag: 'dist' },
  ],
  v1_b: [
    ['Vesna', "I still sleep in your bed sometimes. Is that disgusting? You'd let me anyway."],
    ['Vesna', "Everyone says I should stop. Madame. My mother. The therapist with the nice shoes. They don't get a vote."],
    ['Vesna', "It's a year tonight. You knew that. You always know."],
  ],
  v1_choice2: [
    { text: 'I counted your breaths every night while you slept.', tag: 'dev' },
    { text: "I'm sorry. I froze.", tag: 'mid' },
    { text: "Stop. You're frightening me.", tag: 'dist' },
  ],
  v1_c: [
    ['Vesna', "I'm going out to the ice later. I want to be near where you are. Nobody else gets to be."],
    ['Vesna', "Stay with me a while. Then I'll go."],
    'She starts playing again. She never once looks at me.',
    'I never once look away.',
  ],
  piano_after: [['Vesna', 'You counted the sixes out loud. I used to count them with you, from across the room. You never noticed. I noticed everything.']],
  piano_empty: ['The piano stool is empty. The lid is still warm.'],
  barre: ['The barre. A thousand pliés. My hands knew it before I did.'],
  mirror_room: [
    'In the mirrors: the piano, the candles, Vesna.',
    'Not me. Bad glass.',
    'There is something on the floor in the reflection. Something brass, near the third mirror. On the floor itself, nothing.',
  ],
  mirror_room_after: ['Just the room in the glass. Just her.'],
  mirror_key: ['I kneel where the mirror says it is.', 'My fingers close on cold metal that is not there, and then is.', "A key. The headmistress's office."],
  scare1_a: [['Vesna', '...Did you hear that? Pointe shoes. Someone is—'], 'In the mirror, something is standing right behind me.'],
  scare1_b: ['Its neck is too long.'],
  hide: ['The wardrobe. Get in. Get in.'],
  hush_won: ['The clicking goes away.', 'After a long time, so do I.'],

  // ---- costume room -----------------------------------------------------------
  wardrobe_again: ['I am not getting back in there.'],
  shrine_first: ['The other wardrobe. Behind the coats, something has been built.'],
  shrine_after: [
    "My pointe shoes, the ribbons cut off. A hundred photographs of me. In every one, the other girls' faces are scratched out.",
    'Candle stubs, burned down to nothing. Dozens. She has been coming here every night.',
    'I would have done the same.',
    'I did do the same.',
  ],
  shrine_again: ['Her shrine. I cannot stop looking at it. It cannot stop looking at me.'],
  rack_white: ["White tutus. Odette's. Dozens of them, all a little grey at the hem, as if they had been dragged through water."],
  rack_black_first: ["Black tutus. Odile's. Mine.", 'Something is in the pocket of the end one. Vesna always stole my costume to smoke in. She said black hides the ash.'],
  rack_black_after: ['Just feathers. They come off in my hands.'],
  lighter: ['Her lighter. Silver, a red stone. She stole it from her father. I am stealing it from her.'],
  mannequin: ['It is looking at me.', 'It was not looking at me before.'],
  fabric_shelf: ['Bolts of tulle, white and black. Moth-eaten swans.'],

  // ---- office ---------------------------------------------------------------------
  office_first: ["Madame Cygne's office. It smells of lilies and wet wool."],
  ledger: [
    "Madame's ledger. A list of girls going back a hundred years.",
    'Some names have a little swan drawn beside them. Beside each swan, in the same hand: returned to the lake.',
    'The last swan is drawn in fresh ink. The name beside it is too wet to read.',
    "In the margin, beside two names, in red: 'Unhealthy attachment. Separate them.' Under it, in a different hand: 'Try.'",
    "A card is tucked into the binding, in Madame's hand: 'The safe remembers the girls in the corridor. The last of each year they were lost, in the order they were lost.'",
  ],
  clipping: [
    'A newspaper clipping, pressed under glass.',
    "'DANCER DROWNS IN CONSERVATORY LAKE. A nineteen-year-old student died after falling through the ice on the night of December 11th. A second student was pulled from the water's edge by—'",
    'The name of the girl who drowned is under a water stain.',
    'Of course it is Vesna. I know it is Vesna.',
  ],
  madame: ['Madame Cygne. She said a dancer who speaks has already lost the role.', 'She tried to separate us. She liked me best.'],
  office_books: ['A whole shelf of Swan Lake scores, all annotated in red.'],
  safe_wrong: ['The dial will not turn past it.'],
  safe_open: [
    'The safe opens.',
    'Inside: a little brass key shaped like a music box. And a ribbon.',
    "Vesna's ribbon. Madame took it from me. I stole it from Vesna the week before the lake.",
    'Somewhere under me, water moves in the pipes. The bath house is open.',
  ],
  safe_empty: ['Empty now.'],

  // ---- bath house -------------------------------------------------------------------
  bath_first: [
    'The old bath house under the school. They closed it after a girl drowned here in 1957.',
    'Steam. In a building with no power, there is steam.',
  ],
  tub_plain: ['Black water. Something soft moves when I lean close. I do not lean closer.'],
  tub_bubble: ['Bubbles rise in this one. Something down there is still breathing.'],
  tub_bubble_q: ['Reach into the water', 'Step back'],
  tub_bubble_back: ['I step back. The bubbles stop, as if it is listening.'],
  corpse: [
    'There is a girl in the bath.',
    'Her neck is stretched over the rim, long, far too long, as if someone pulled it to make her a swan.',
    'Her mouth is full of white feathers.',
    'Her hand is closed around something.',
  ],
  corpse_q: ['Close her eyes, then open her hand', 'Open her hand', 'Leave her'],
  corpse_gentle: ['Somebody should be gentle with her. Nobody was.'],
  corpse_key: ['Her fingers are softer than they should be.', 'A small iron key. A padlock key.'],
  corpse_leave: ['I leave her. I am sorry. I leave her.'],
  corpse_after: ['She is still there. She will always be there.'],
  v3_a: [
    ['Vesna', 'Do you know what I did, after? I slept in your bed. I wore your clothes until they stopped smelling like you. Then I wore them anyway.'],
    ['Vesna', "I kept everything. Your hair from the brush. Your shoes. I'm not giving any of it back."],
  ],
  v3_choice: [
    { text: 'Keep it. Keep all of me.', tag: 'dev' },
    { text: 'Look at me. Please, just once.', tag: 'mid' },
    { text: 'Let me go.', tag: 'dist' },
  ],
  v3_b: [
    ['Vesna', "When I close my eyes I can still feel your hand. I'm never letting go of it. Not even now."],
    ['Vesna', "I'm going to the lake soon. You'll be there. You promised you'd never be anywhere I wasn't."],
    'Her shape leaves the glass.',
  ],
  glass_after: ['Fogged glass. My breath does not fog it. Hers did.'],
  sink: ['The tap runs black. Then clear. Then black.'],
  pool: ['The drain in the pool is open. It is breathing.'],
  scare2: ['The water in the pool stands up.'],

  // ---- theatre ------------------------------------------------------------------------
  theatre_first: ['The theatre. The set for Act Two is still up. The lake. The paper moon.', 'And on the stage, dancing alone, Vesna.'],
  playbill: [
    "A programme on a seat. 'WINTER RECITAL — CANCELLED.'",
    "At the bottom, in a black box: 'In memoriam. Mira Sølv.'",
    'They spelled it wrong. They put my name.',
    'It is a misprint. It is a misprint.',
  ],
  seat: ['Red velvet, damp all the way through.'],
  paper_moon: ['A paper moon on a wire. When I was small I thought the real one was paper too.'],
  swan_prop: ['A plywood swan. Its neck was snapped once and glued back crooked.'],
  musicbox: ['The music box from Act Two. The little dancer inside turns and turns and never gets anywhere.'],
  curtain: ['Velvet. It smells of dust and old applause.'],
  v4_a: [
    ['Vesna', 'Nobody came. Good. Nobody else gets to see it.'],
    ['Vesna', "They gave your part to Inès. Inès fell down the stairs. I don't know how. I really don't."],
  ],
  v4_choice: [
    { text: 'Step into the light with her, and never step out.', tag: 'dev' },
    { text: 'Step into the light with her.', tag: 'mid' },
    { text: 'Stay in the dark and watch.', tag: 'dist' },
  ],
  v4_watch: ['I watched her dance both parts alone. I have always watched her. She has always known.'],
  v4_b: [['Vesna', 'Okay. Okay.'], ['Vesna', "It's time. We promised. Nobody else, ever."], 'She walks off the stage, through the back door, toward the lake.'],
  follow: ['The back door is open. Cold comes through it like water.'],

  // ---- the lake --------------------------------------------------------------------------
  lake_a: ['The lake. The hole is where it always is. It has never frozen over, not completely.', 'The Prima is waiting beside it.'],
  lake_b: [
    ['Vesna', "I'm here. I'm here, Mira. I came back. I always come back."],
    ['Vesna', "I can't dance both parts for another year. I'm not sharing you with the ice anymore."],
    ['Vesna', "I'm coming down. Nobody else gets you."],
  ],
  lake_choice: ['Stop her.', 'Come with me.'],
  noo_won: ['She stops.', 'She turns her head, very slowly, toward a sound nobody else could have heard.'],
  ice_breaks: ['The ice is breaking under her.'],
  hollow_page: ['I try to write. The pen will not move.', 'I cannot remember the shape of her name.', 'I cannot remember the shape of mine.'],

  // ---- the Ledger: what the world shows instead of a meter ---------------------------------
  tier_dev: [
    null,
    'The mirrors have started keeping her.',
    'She is in every doorway now. Or I am looking for her in every doorway.',
    null,
  ],
  tier_dist: [
    null,
    'My candle burns lower. Even the flame keeps its distance.',
    'My voice feels further away, like it belongs to someone underwater.',
    'She is standing at the end of every hall. The quiet ones are easy to find.',
  ],
  performing: 'The mirror shows a white mask where my face should be.',
  performing_vesna: [['Vesna', 'Stop it. Stop saying what you think I want.']],
  keepsakes_taken: ['My pockets are lighter.', 'Her lighter is gone. Her ribbon is gone. In their place, a folded note.', ['Vesna', 'Mine. —V']],
};

export const ITEMS = {
  candle: { name: 'Candle', desc: 'Her own, from the stool by the bed. The wax is warm. She is not.', sprite: 'candle' },
  office_key: { name: 'Office key', desc: 'Found where the mirror said it was. Cold enough to burn.', sprite: 'key' },
  lighter: { name: "Vesna's lighter", desc: 'Silver, with a red stone. It still smells of her. She will want it back.', sprite: 'lighter' },
  musicbox_key: { name: 'Music-box key', desc: 'A brass key shaped like a tiny music box.', sprite: 'key' },
  ribbon: { name: "Vesna's ribbon", desc: 'A pointe-shoe ribbon. Stolen, then confiscated, then stolen back.', sprite: 'ribbon' },
  chain_key: { name: 'Iron key', desc: "Taken from a dead girl's hand. Softer than it should be.", sprite: 'key' },
};
