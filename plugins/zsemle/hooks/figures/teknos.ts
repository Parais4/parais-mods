import { edits, lower } from '../pixels'
import type { Skin } from '../pixels'

// ---- Teki: a friendly turtle, seen from the side, facing left ---------------

const TURTLE = [
  '........................',
  '........................',
  '..GGGGG.................',
  '.GGGEWGG....HHLLHHH.....',
  '.GGGEEGGG.HHDHLLHDHHH...',
  '.GOOPPGG.HHHDHLLHDHHHH..',
  '..GGGGG.DDDDDDDDDDDDDDD.',
  '.....GGGHHDHHHDHHHDHHHH.',
  '......GBBBBBBBBBBBBBBBB.',
  '........GGGG....GGGG.GG.',
  '........GGGG....GGGG....',
  '.......GGGGG....GGGGG...',
]

const EMPTY = '........................'

/** The sprite's letters written over the grid with its top-left corner at (top, left); '.' keeps what is below. */
function stamp(rows: readonly string[], sprite: readonly string[], top: number, left: number): string[] {
  return rows.map((r, y) => {
    const line = sprite[y - top]
    if (line === undefined) return r
    return [...r].map((c, x) => (x >= left && line[x - left] !== undefined && line[x - left] !== '.' ? line[x - left] : c)).join('')
  })
}

/** Only the given letters kept, everything else transparent. */
function keep(rows: readonly string[], letters: string): string[] {
  return rows.map(r => [...r].map(c => (letters.includes(c) ? c : '.')).join(''))
}

// The body with the head taken off (the neck stays), to put a head back at another height.
const BODY = edits(TURTLE, [2, 0, '.........'], [3, 0, '.........'], [4, 0, '.........'], [5, 0, '.........'], [6, 0, '........'])

// Heads, 5 rows by 9 columns; the base drawing has its head at row 2, column 0.
const HEAD_SAD = [
  '..GGGGG..',
  '.GGGGGGG.',
  '.GGGEEGGG',
  '.GGGAGGG.',
  '..GGGGG..',
]

// Head hung low, eye cast down, a tear.
const DROOP = stamp(BODY, HEAD_SAD, 4, 0)

const HEAD_TIRED = [
  '..GGGGGG',
  '.GGGKKGG',
  '.GGGEEGG',
  '..GGGGG.',
]

// Chin on the ground, heavy lids, the front leg pushed aside.
const TIRED = stamp(edits(BODY, [9, 8, '.GGGG'], [10, 8, '.GGGG'], [11, 7, '..GGGGG']), HEAD_TIRED, 8, 0)

const HEAD_LOOK = [
  '..GGGGG..',
  '.GGGEGGG.',
  '.GGGEGGGG',
  '.GOOPPGG.',
  '..GGGGG..',
]

// Head raised a little, eye forward: curious.
const SNIFF = edits(stamp(BODY, HEAD_LOOK, 1, 0), [6, 4, 'GGG'])

// Pulled in: the shell alone rests on the ground, a dark opening in front.
const HIDDEN = edits(lower(keep(TURTLE, 'HLDB'), 3), [9, 8, 'OO'], [10, 8, 'OW'])

export const TEKNOS: Skin = {
  id: 'teknos',
  label: 'Teki, a barátságos teknős',
  labelEn: 'Teki, the friendly turtle',
  aliases: ['teknős', 'teknos', 'teki', 'turtle', 'tortoise'],
  palette: {
    G: [0x8c, 0xcc, 0x5a], // head and legs
    H: [0xc9, 0x8a, 0x3c], // shell plates
    L: [0xe6, 0xb4, 0x62], // plate shine
    D: [0x6e, 0x46, 0x1e], // shell lines
    B: [0xee, 0xd8, 0x96], // shell rim
    E: [0x16, 0x18, 0x12], // eye
    W: [0xff, 0xff, 0xff], // eye highlight
    K: [0x5a, 0x96, 0x3a], // heavy lid
    A: [0x8c, 0xc8, 0xf0], // tear
    P: [0xf2, 0x9a, 0xa0], // cheek
    T: [0xd9, 0x4f, 0x5c], // open mouth
    O: [0x3a, 0x2a, 0x16], // outline
  },
  poses: {
    awake: TURTLE,
    blink: edits(TURTLE, [3, 4, 'GG']),
    bark: edits(TURTLE, [5, 1, 'TTO'], [6, 1, 'G']),
    yawn: edits(TURTLE, [3, 4, 'GG'], [5, 1, 'TTT'], [6, 1, 'TTO'], [7, 2, 'GGG']),
    droop: DROOP,
    // A happy hop.
    wag: [...TURTLE.slice(1), EMPTY],
    sniff: SNIFF,
    // Brow down to the eye, mouth open.
    growl: edits(TURTLE, [2, 5, 'OO'], [3, 4, 'GE'], [5, 1, 'TTO'], [6, 1, 'G']),
    tired: TIRED,
  },
  longTurn: HIDDEN,
  voice: {
    name: 'Teki',
    bark: 'Megjöttem!',
    growl: 'Lassan a testtel!',
    happy: 'Zöld a teszt: lassan, de biztosan!',
    pet: 'Köszi, jólesett!',
    sniff: 'Csak óvatosan!',
    snore: 'Zzz',
    sound: 'sounds/chime.wav',
    alt: 'Teki, a barátságos teknős',
  },
  voiceEn: {
    name: 'Teki',
    bark: 'Made it!',
    growl: 'Easy there!',
    happy: 'Tests are green: slow and steady!',
    pet: 'Thanks, that was nice!',
    sniff: 'Careful now!',
    snore: 'Zzz',
    sound: 'sounds/chime.wav',
    alt: 'Teki, the friendly turtle',
  },
}
