import { edits } from '../pixels'
import type { Skin } from '../pixels'

// ---- Szellemke: a cute classic sheet ghost, floating, facing the viewer -----

const GHOST = [
  '........................',
  '........WWWWWWWW........',
  '......WWWWWWWWWWWW......',
  '....WWWWWWWWWWWWWWWS....',
  '...WWWKKWWWWWWKKWWWSS...',
  '...WWWKKWWWWWWKKWWWWS...',
  '.WWWWWKKWWWWWWKKWWWWSWS.',
  '.WWWPPWWWWWWWWWWPPWSSSS.',
  '...WWWWWWKWWKWWWWWWSS...',
  '...WWWWWWWKKWWWWWWWSS...',
  '...WWWWWWWWWWWWWWWSSS...',
  '...WWS..WWS..WWS..WSS...',
]

/** The grid moved up by one row, the bottom left empty: floating higher. */
function up(rows: readonly string[]): string[] {
  return [...rows.slice(1), '.'.repeat(24)]
}

// Arms moved from the sides of the face down to the hips.
const ARMS_DOWN: [number, number, string][] = [
  [6, 1, '..'], [6, 21, '..'], [7, 1, '..'], [7, 21, '..'],
  [8, 1, 'WW'], [8, 21, 'WS'], [9, 1, 'WW'], [9, 21, 'SS'],
]

// Arms raised next to the top of the head.
const ARMS_UP: [number, number, string][] = [
  [6, 1, '..'], [6, 21, '..'], [7, 1, '..'], [7, 21, '..'],
  [4, 1, 'WW'], [4, 21, 'WS'], [5, 1, 'WW'], [5, 21, 'SS'],
]

const EYES_SHUT: [number, number, string][] = [
  [4, 6, 'WW'], [4, 14, 'WW'], [5, 6, 'WW'], [5, 14, 'WW'], [6, 5, 'KKK'], [6, 14, 'KKK'],
]

const NO_SMILE: [number, number, string][] = [[8, 9, 'W'], [8, 12, 'W'], [9, 10, 'WW']]

export const SZELLEM: Skin = {
  id: 'szellem',
  label: 'Szellemke, a cuki kísértet',
  labelEn: 'Szellemke, the cute little ghost',
  aliases: ['szellem', 'kísértet', 'kisertet', 'ghost', 'boo', 'spook'],
  palette: {
    W: [0xfa, 0xf9, 0xff], // white sheet
    S: [0xd4, 0xd0, 0xea], // pale lavender shading
    K: [0x2a, 0x26, 0x3c], // eyes, mouth
    P: [0xf5, 0xb0, 0xc4], // blush
    T: [0xe8, 0x78, 0x87], // tongue
    B: [0x7c, 0xc4, 0xf0], // tear
    O: [0x5c, 0x57, 0x7a], // outline
  },
  poses: {
    awake: GHOST,
    // Eyes shut: also the sleeping face.
    blink: edits(GHOST, ...EYES_SHUT),
    // A round "Boo!" mouth.
    bark: edits(GHOST, ...NO_SMILE, [7, 9, 'WKKW'], [8, 9, 'KTTK'], [9, 9, 'WKKW']),
    yawn: edits(GHOST, ...EYES_SHUT, ...NO_SMILE, [7, 9, 'WKKW'], [8, 9, 'KTTK'], [9, 9, 'KTTK'], [10, 9, 'WKKW']),
    // Eyes down, a frown, a tear, arms hanging.
    droop: edits(
      GHOST,
      ...ARMS_DOWN,
      ...NO_SMILE,
      [4, 6, 'WW'], [4, 14, 'WW'], [7, 3, 'WWWKKWWWWWWKKWWW'],
      [8, 10, 'KK'], [9, 9, 'K'], [9, 12, 'K'], [9, 6, 'B'],
    ),
    // Floats one row higher, arms up, the hem waves the other way.
    wag: edits(up(edits(GHOST, ...ARMS_UP)), [10, 0, '....WWS..WWS..WWS..WS...']),
    // Glances to the left.
    sniff: edits(GHOST, [4, 5, 'KKW'], [5, 5, 'KKW'], [6, 5, 'KKW'], [4, 13, 'KKW'], [5, 13, 'KKW'], [6, 13, 'KKW']),
    // Angry brows, a zigzag scowl, arms up.
    growl: edits(
      GHOST,
      ...ARMS_UP,
      ...NO_SMILE,
      [3, 6, 'KK'], [3, 14, 'KK'], [4, 6, 'WWKK'], [4, 12, 'KKWW'],
      [7, 8, 'KWKKWK'], [8, 8, 'WKWWKW'],
    ),
    // Heavy lids, a flat mouth, the dome sagging, arms hanging.
    tired: edits(
      GHOST,
      ...ARMS_DOWN,
      ...NO_SMILE,
      [1, 8, '........'], [2, 6, '..WWWWWWWWWW..'],
      [4, 6, 'WW'], [4, 14, 'WW'], [5, 4, 'OOOO'], [5, 14, 'OOOO'],
      [8, 10, 'KK'],
    ),
  },
  voice: {
    name: 'Szellemke',
    bark: 'Búúú!',
    growl: 'Huhú, ezt ne!',
    happy: 'Zöld a teszt, lebegek!',
    pet: 'Hihi, átment rajtam a kezed!',
    sniff: 'Huhú, deploy!',
    snore: 'Búúú... zzz',
    sound: 'sounds/chime.wav',
    alt: 'Szellemke, a cuki kísértet',
  },
  voiceEn: {
    name: 'Szellemke',
    bark: 'Boo!',
    growl: 'Boo, not that!',
    happy: 'Tests are green, floating!',
    pet: 'Hehe, your hand went right through!',
    sniff: 'Ooh, a deploy!',
    snore: 'Boo... zzz',
    sound: 'sounds/chime.wav',
    alt: 'Szellemke, the cute little ghost',
  },
  fadesWhenIdle: true,
}
