import { edits } from '../pixels'
import type { Skin } from '../pixels'

// ---- Pufi: a round golden hamster, facing the viewer ------------------------

const HAMSTER = [
  '........................',
  '.....DPD..........DPD...',
  '.....GGGGGGGGGGGGGGGG...',
  '....GGGGEWGGGGGGEWGGGG..',
  '...GGGGGEEGGGGGGEEGGGGG.',
  '...GGWWWWWWWPPWWWWWWWGG.',
  '...GWWPPWWWOWWOWWWPPWWG.',
  '...GWWWWWWWWOOWWWWWWWWG.',
  '...GGWWWWWWWWWWWWWWWWGG.',
  '...GGWWWWWWWWWWWWWWWWGG.',
  '....GGGWWWWWWWWWWWWGGG..',
  '......PPPGGGGGGGGPPP....',
]

const EMPTY = '........................'

/** Sunk by n rows: the middle rows go, the bottom two stay (a slump). */
function squash(rows: readonly string[], n: number): string[] {
  return [...Array.from({ length: n }, () => EMPTY), ...rows.slice(0, 10 - n), rows[10] ?? '', rows[11] ?? '']
}

/** The sprite's letters written over the grid at (top, left); '.' keeps what is below. */
function stamp(rows: readonly string[], sprite: readonly string[], top: number, left: number): string[] {
  return rows.map((r, y) => {
    const line = sprite[y - top]
    if (line === undefined) return r
    return [...r].map((c, x) => (x >= left && line[x - left] !== undefined && line[x - left] !== '.' ? line[x - left] : c)).join('')
  })
}

// ---- The exercise wheel: a rim, a disk, spokes that turn, a stand ----------

const WHEEL = [
  '.......MMMMMMMMMM.......',
  '....MMMFFFFFFFFFFMMM....',
  '...MMFFFFFFFFFFFFFFMM...',
  '..MMFFFFFFFFFFFFFFFFMM..',
  '.MMFFFFFFFFFFFFFFFFFFMM.',
  '.MMFFFFFFFFMMFFFFFFFFMM.',
  '.MMFFFFFFFFFFFFFFFFFFMM.',
  '..MMFFFFFFFFFFFFFFFFMM..',
  '...MMFFFFFFFFFFFFFFMM...',
  '....MMMFFFFFFFFFFMMM....',
  '.......MMMMMMMMMM.......',
  '.....MMM........MMM.....',
]

// Spokes as a plus, then as a cross: alternating, the wheel turns.
const PLUS = edits(
  WHEEL,
  [1, 11, 'SS'],
  [2, 11, 'SS'],
  [3, 11, 'SS'],
  [4, 11, 'SS'],
  [5, 3, 'SSSSSSSS'],
  [5, 13, 'SSSSSSSS'],
  [6, 11, 'SS'],
  [7, 11, 'SS'],
  [8, 11, 'SS'],
  [9, 11, 'SS'],
)

const CROSS = edits(
  WHEEL,
  [1, 7, 'SS'],
  [1, 15, 'SS'],
  [2, 7, 'SS'],
  [2, 15, 'SS'],
  [3, 9, 'S'],
  [3, 14, 'S'],
  [4, 10, 'S'],
  [4, 13, 'S'],
  [6, 10, 'S'],
  [6, 13, 'S'],
  [7, 8, 'SS'],
  [7, 14, 'SS'],
  [8, 6, 'SS'],
  [8, 16, 'SS'],
)

// The hamster from the side, running to the left: legs stretched, then tucked.
const RUN_A = [
  '.....DD.......',
  '...GGGGGGGG...',
  '..GEGGGGGGGGG.',
  '.PGGGGGGGGGGGG',
  '..WWWWWGGGGGG.',
  '....WWWWWGG...',
  '.PP........PP.',
]

const RUN_B = [
  '.....DD.......',
  '...GGGGGGGG...',
  '..GEGGGGGGGGG.',
  '.PGGGGGGGGGGGG',
  '..WWWWWGGGGGG.',
  '....WWWWWGG...',
  '...PP..PP.....',
]

const WORK = [stamp(PLUS, RUN_A, 3, 5), stamp(CROSS, RUN_B, 3, 5)]

export const HORCSOG: Skin = {
  id: 'horcsog',
  label: 'Pufi, a pufók hörcsög',
  labelEn: 'Pufi, the chubby hamster',
  aliases: ['hörcsög', 'horcsog', 'pufi', 'hamster'],
  palette: {
    G: [0xf0, 0xa8, 0x4c], // golden fur
    D: [0xc8, 0x7a, 0x2c], // ear rim
    W: [0xff, 0xf6, 0xe8], // cheeks and belly
    P: [0xf4, 0x9a, 0xa8], // nose, inner ear, paws, blush
    E: [0x22, 0x16, 0x10], // eyes
    T: [0xd9, 0x4f, 0x5c], // open mouth
    A: [0x8c, 0xc8, 0xf0], // tear
    M: [0x70, 0x7c, 0x8c], // wheel rim and stand
    S: [0xa8, 0xb4, 0xc2], // spokes
    F: [0xe2, 0xe8, 0xef], // wheel disk
    O: [0x7a, 0x48, 0x1e], // outline
  },
  poses: {
    awake: HAMSTER,
    blink: edits(HAMSTER, [3, 8, 'GG'], [3, 16, 'GG']),
    bark: edits(HAMSTER, [7, 11, 'OTTO'], [8, 12, 'OO']),
    yawn: edits(HAMSTER, [3, 8, 'GG'], [3, 16, 'GG'], [6, 11, 'OTTO'], [7, 11, 'OTTO'], [8, 11, 'OOOO']),
    // Ears flat, a frown and a tear.
    droop: edits(HAMSTER, [1, 0, EMPTY], [2, 3, 'DD'], [2, 21, 'DD'], [3, 9, 'E'], [3, 17, 'E'], [5, 8, 'A'], [6, 11, 'WOOW'], [7, 11, 'OWWO']),
    // A happy hop, eyes squeezed shut.
    wag: [...edits(HAMSTER, [3, 8, 'EE'], [4, 8, 'GG'], [3, 16, 'EE'], [4, 16, 'GG']).slice(1), EMPTY],
    // Eyes to the left, whiskers twitch.
    sniff: edits(HAMSTER, [3, 8, 'EG'], [4, 8, 'EG'], [3, 16, 'EG'], [4, 16, 'EG'], [5, 1, 'OO'], [7, 1, 'OO']),
    // Slanted eyes, red cheeks, teeth bared.
    growl: edits(HAMSTER, [3, 8, 'EG'], [3, 16, 'GE'], [6, 6, 'TT'], [6, 18, 'TT'], [6, 11, 'OOOO'], [7, 11, 'OWWO']),
    // Slumped, heavy lids.
    tired: edits(squash(HAMSTER, 2), [5, 8, 'DD'], [5, 16, 'DD']),
  },
  workFrames: WORK,
  voice: {
    name: 'Pufi',
    bark: 'Cin-cin!',
    growl: 'Grr, ezt ne!',
    happy: 'Zöld a teszt, pörög a kerék!',
    pet: 'Puha köszi!',
    sniff: 'Mi ez az illat?',
    snore: 'Zzz',
    sound: 'sounds/chime.wav',
    alt: 'Pufi, a pufók hörcsög',
  },
  voiceEn: {
    name: 'Pufi',
    bark: 'Squeak!',
    growl: 'Grr, not that!',
    happy: 'Tests are green, the wheel is spinning!',
    pet: 'Fluffy thanks!',
    sniff: 'What is that smell?',
    snore: 'Zzz',
    sound: 'sounds/chime.wav',
    alt: 'Pufi, the chubby hamster',
  },
}
