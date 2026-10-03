import { edits } from '../pixels'
import type { Skin } from '../pixels'

// ---- Pingu: a cute penguin, standing, facing 3/4 left -----------------------

const PENGUIN = [
  '.......KKKKKKK..........',
  '.....KKKKKKKKKKK........',
  '....KWWWKKWWWKKKK.......',
  '...KWWEEWWEEWWKKKK......',
  '...KWWEEWWEEWWKKKKK.....',
  '..YYYYYYWWPPWKKKKKK.....',
  '...YYYWWWWWWWWKKKKKK....',
  '...KWWWWWWWWWWKKKOKKK...',
  '...KWWWWWWWWWWKKKKOKKK..',
  '...KWWWWWWWWWWKKKKKOKK..',
  '....KWWWWWWWWKKKKK......',
  '...YYYYY...YYYYY........',
]

/** Sunk by n rows: the head drops into the shoulders, belly rows go, feet stay. */
function squash(rows: readonly string[], n: number): string[] {
  return [...Array.from({ length: n }, () => '.'.repeat(24)), ...rows.slice(0, 10 - n), rows[10] ?? '', rows[11] ?? '']
}

/** Each row moved right by the given number of columns (a lean). */
function lean(rows: readonly string[], shifts: readonly number[]): string[] {
  return rows.map((r, i) => {
    const n = shifts[i] ?? 0
    return n > 0 ? ('.'.repeat(n) + r).slice(0, 24) : r
  })
}

// Totter: the body leans right, the left foot lifts off the ground.
const WADDLE = edits(
  lean(PENGUIN, [2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 0]),
  [11, 0, '............YYYYY.......'],
  [10, 2, 'YYY'],
)

export const PINGVIN: Skin = {
  id: 'pingvin',
  label: 'Pingu, a totyogó pingvin',
  labelEn: 'Pingu, the waddling penguin',
  aliases: ['pingvin', 'penguin', 'pingu', 'tux'],
  palette: {
    K: [0x34, 0x40, 0x5c], // back and head
    W: [0xf6, 0xf8, 0xfc], // face and belly
    Y: [0xf8, 0x9a, 0x1c], // beak and feet
    E: [0x10, 0x12, 0x18], // eyes
    P: [0xf2, 0x9a, 0xa8], // blush
    T: [0xd9, 0x4f, 0x5c], // open beak
    G: [0x9a, 0xa4, 0xb8], // heavy lids
    B: [0x8c, 0xc8, 0xf0], // tear
    O: [0x1a, 0x1f, 0x2c], // outline
  },
  poses: {
    awake: PENGUIN,
    blink: edits(PENGUIN, [3, 6, 'WW'], [3, 10, 'WW']),
    bark: edits(PENGUIN, [6, 3, 'TTT'], [7, 3, 'YYY']),
    yawn: edits(PENGUIN, [3, 6, 'WW'], [3, 10, 'WW'], [6, 3, 'TTTT'], [7, 3, 'TTTT'], [8, 4, 'YYY']),
    // Beak and eyes down, a tear, the flipper hangs limp.
    droop: edits(PENGUIN, [3, 6, 'WW'], [3, 10, 'WW'], [5, 2, '.YYYYY'], [6, 3, 'YYYY'], [5, 10, 'BW'], [6, 10, 'B'],
      [7, 14, 'KKKKOKK.'], [8, 14, 'KKKKOKK.'], [9, 14, 'KKKKOKK.'], [10, 18, 'OKK']),
    wag: WADDLE,
    // Eyes dart to the left.
    sniff: edits(PENGUIN, [3, 6, 'EW'], [4, 6, 'EW'], [3, 10, 'EW'], [4, 10, 'EW']),
    // Angry brows, beak open, flipper raised.
    growl: edits(PENGUIN, [2, 5, 'OO'], [3, 7, 'W'], [2, 11, 'OO'], [3, 10, 'W'], [6, 3, 'TTT'], [7, 3, 'YYY'],
      [5, 19, 'KK'], [6, 20, 'KK'], [7, 17, 'KK...'], [8, 18, 'K....'], [9, 19, 'K...']),
    // Heavy lids, sunk into the shoulders.
    tired: edits(squash(PENGUIN, 2), [5, 6, 'GG'], [5, 10, 'GG']),
  },
  voice: {
    name: 'Pingu',
    bark: 'Kvá-kvá!',
    growl: 'Hé, ezt ne!',
    happy: 'Zöld a teszt, totyogok!',
    pet: 'Hűs köszi!',
    sniff: 'Csúszik a jég!',
    snore: 'Zzz',
    sound: 'sounds/chime.wav',
    alt: 'Pingu, a totyogó pingvin',
  },
  voiceEn: {
    name: 'Pingu',
    bark: 'Squawk!',
    growl: 'Hey, not that!',
    happy: 'Tests are green, waddling!',
    pet: 'Cool, thanks!',
    sniff: 'Slippery ice ahead!',
    snore: 'Zzz',
    sound: 'sounds/chime.wav',
    alt: 'Pingu, the waddling penguin',
  },
}
