import type { Skin } from '../pixels'

// ---- Kocka: a scrambled Rubik's cube with big googly eyes, seen slightly from above
//
// The bare cube first: a top face in perspective, then the 3 x 3 front face.
// The face is stamped over it: two big ringed eyes over the middle row of
// stickers and a mouth on the bottom-middle sticker. Every eye shape
// is cell-aligned (even columns, odd rows) so it survives the terminal.

const CUBE = [
  '...OBBBBBOWWWWORRRRRO...',
  '..OGGGGGOYYYYYYOBBBBBO..',
  '.OGGGGGGOYYYYYYOBBBBBBO.',
  '.OOOOOOOOOOOOOOOOOOOOOO.',
  '.ORRRRRROGGGGGGOYYYYYYO.',
  '.ORRRRRROGGGGGGOYYYYYYO.',
  '.OOOOOOOOOOOOOOOOOOOOOO.',
  '.OBBBBBBONNNNNNOGGGGGGO.',
  '.OBBBBBBONNNNNNOGGGGGGO.',
  '.OOOOOOOOOOOOOOOOOOOOOO.',
  '.OBBBBBBOYYYYYYORRRRRRO.',
  '.OBBBBBBOYYYYYYORRRRRRO.',
]

/** The grid with `text` written over it at row y, column x; '.' in `text` keeps what is there. */
function over(rows: readonly string[], y: number, x: number, text: string): string[] {
  const out = [...rows]
  const row = out[y] ?? ''
  out[y] = [...row].map((c, i) => (i >= x && i < x + text.length && text[i - x] !== '.' ? text[i - x] : c)).join('')
  return out
}

/** An eye drawn left to right, mirrored for the other side. */
const mirror = (eye: readonly string[]) => eye.map(r => [...r].reverse().join(''))

// Eyes: 8 x 6 pixels, rows 5 to 10, the left one at column 1, the right one at
// 15. Inside an eye there are only white and dark pixels, so every terminal
// cell keeps both; the outer cells pair the dark ring with one sticker.
const OPEN = ['.OOOOOO.', '.OWWWWO.', 'OWWWWWWO', 'OWWOOWWO', '.OWWWWO.', '.OOOOOO.']
const SHUT = ['.OOOOOO.', '.OOOOOO.', 'OOOOOOOO', 'OWOOOOWO', '.OWWWWO.', '.OOOOOO.']
const LEFT = ['.OOOOOO.', '.OWWWWO.', 'OWWWWWWO', 'OWOOWWWO', '.OWWWWO.', '.OOOOOO.']
const DOWN = ['.OOOOOO.', '.OOOWWO.', 'OOWWWWWO', 'OWWOOWWO', '.OWWWWO.', '.OOOOOO.']
const ANGRY = ['.OOOOOO.', '.OWOOOO.', 'OWWWOOOO', 'OWWOOWWO', '.OWWWWO.', '.OOOOOO.']
const HEAVY = ['.OOOOOO.', '.OOOOOO.', 'OOOOOOOO', 'OWWOOWWO', '.OWWWWO.', '.OOOOOO.']

// Mouths: 6 x 2 pixels on the bottom-middle (yellow) sticker, rows 10 and 11
// from column 9. The sticker is tight between dark lines, so the yellow itself
// makes the shape: carved into a U it grins, into an arch it frowns; an open
// mouth is red.
const SMILE = ['.OOOO.', '......']
const OPEN_MOUTH = ['.RRRR.', '..RR..']
const BIG_MOUTH = ['RRRRRR', '.RRRR.']
const FROWN = ['......', '.OOOO.']
const TEETH = ['.OWWO.', '......']
const SMALL = ['..OO..', '......']

function face(left: readonly string[], right: readonly string[], mouth: readonly string[]): string[] {
  let g = [...CUBE]
  left.forEach((r, i) => (g = over(g, 5 + i, 1, r)))
  right.forEach((r, i) => (g = over(g, 5 + i, 15, r)))
  mouth.forEach((r, i) => (g = over(g, 10 + i, 9, r)))
  return g
}

// Both eyes look the same way, so the open eyes are not mirrored.
const AWAKE = face(OPEN, OPEN, SMILE)

export const RUBIK: Skin = {
  id: 'rubik',
  label: 'Kocka, a bűvös kocka',
  labelEn: "Kocka, the Rubik's cube",
  aliases: ['rubik', 'kocka', 'cube'],
  palette: {
    W: [0xf6, 0xf6, 0xf2], // white stickers, eye whites
    Y: [0xf8, 0xd2, 0x24], // yellow
    R: [0xd8, 0x2e, 0x2e], // red, also the tongue
    N: [0xf2, 0x84, 0x1e], // orange
    B: [0x24, 0x5c, 0xd6], // blue
    G: [0x22, 0xa8, 0x4c], // green
    O: [0x1c, 0x1c, 0x22], // black plastic, eye rings, pupils, mouth, outline
  },
  poses: {
    awake: AWAKE,
    blink: face(SHUT, SHUT, SMILE),
    // Mouth open: "Klikk!"
    bark: face(OPEN, OPEN, OPEN_MOUTH),
    yawn: face(SHUT, SHUT, BIG_MOUTH),
    // Sad lids sagging outward, a frown.
    droop: face(DOWN, mirror(DOWN), FROWN),
    // A happy hop.
    wag: [...AWAKE.slice(1), '........................'],
    // Both eyes glance to the left.
    sniff: face(LEFT, LEFT, SMILE),
    // Angry lids slanting to the middle, gritted teeth.
    growl: face(ANGRY, mirror(ANGRY), TEETH),
    // Heavy half-closed lids, a small mouth.
    tired: face(HEAVY, HEAVY, SMALL),
  },
  voice: {
    name: 'Kocka',
    bark: 'Klikk!',
    growl: 'Krrakk!',
    happy: 'Zöld a teszt, minden oldal kirakva!',
    pet: 'Köszi, jólesett a tekerés!',
    sniff: 'Kattant valami!',
    snore: 'Klikk... zzz',
    sound: 'sounds/chime.wav',
    alt: 'Kocka, a nagy szemű bűvös kocka',
  },
  voiceEn: {
    name: 'Kocka',
    bark: 'Click!',
    growl: 'Krrack!',
    happy: 'Tests are green, every side solved!',
    pet: 'Thanks, that twist felt good!',
    sniff: 'Something clicked!',
    snore: 'Click... zzz',
    sound: 'sounds/chime.wav',
    alt: "Kocka, the Rubik's cube with big eyes",
  },
}
