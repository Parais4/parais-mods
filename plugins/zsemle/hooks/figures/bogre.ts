import { edits } from '../pixels'
import type { Skin } from '../pixels'

// ---- Bögre: a blue coffee mug with a face, seen slightly from above ---------

const MUG = [
  '........................',
  '........................',
  '........................',
  '....MMMMMMMMMMMM........',
  '..MMMCRRCCCCCCMMMM......',
  '..MMCCCCCCCCCCCCDD......',
  '..MLMMMMMMMMMMMMDDMMMM..',
  '..MLMMWKMMMMWKMMDDOOMM..',
  '..MLMMKKMMMMKKMMDDOOMM..',
  '..MLPPMMOMMOMMPPDDMMMM..',
  '..MMMMMMMOOMMMMMDD......',
  '...MMMMMMMMMMMMMD.......',
]

const EYES_SHUT: [number, number, string][] = [[7, 6, 'MM'], [8, 6, 'OO'], [7, 12, 'MM'], [8, 12, 'OO']]
const EYES_HEAVY: [number, number, string][] = [[7, 6, 'OO'], [8, 6, 'KK'], [7, 12, 'OO'], [8, 12, 'KK']]
const MOUTH_FLAT: [number, number, string][] = [[9, 8, 'MMMM'], [10, 8, 'MOOM']]

// The coffee by level: full, about 2/3, about 1/3, almost empty.
const LEVEL_2_3: [number, number, string][] = [[4, 5, 'IIIIIIIII'], [5, 4, 'ICRRCCCCCCCI']]
const LEVEL_1_3: [number, number, string][] = [[4, 5, 'IIIIIIIII'], [5, 4, 'IIICRRCCCIII']]
const LEVEL_EMPTY: [number, number, string][] = [[4, 5, 'IIIIIIIII'], [5, 4, 'IIIIICCIIIII']]

// Two steam curls of different heights rising out of the coffee; the wiggle
// moves up a row each frame.
const SWAY = [0, 1, 1]
function steam(frame: number): string[] {
  const changes: [number, number, string][] = []
  for (let y = 0; y <= 4; y++) {
    const a = SWAY[(y + frame) % 3] ?? 0
    changes.push([y, 7 + a, 'SS'])
    if (y >= 2) changes.push([y, 12 + a, 'SS'])
  }
  return edits(MUG, ...changes)
}

export const BOGRE: Skin = {
  id: 'bogre',
  label: 'Bögre, a kávés bögre',
  labelEn: 'Bögre, the coffee mug',
  aliases: ['bögre', 'bogre', 'kávé', 'kave', 'coffee', 'mug'],
  palette: {
    M: [0x5c, 0x9c, 0xd6], // mug
    D: [0x44, 0x7c, 0xb8], // mug shade (right side)
    L: [0x9c, 0xca, 0xf0], // mug highlight
    C: [0x5a, 0x34, 0x1e], // coffee
    R: [0xb8, 0x80, 0x50], // crema glint
    I: [0xf2, 0xe8, 0xd6], // inside of the mug
    K: [0x1c, 0x22, 0x30], // eyes
    W: [0xff, 0xff, 0xff], // eye highlight, teeth
    P: [0xf2, 0x98, 0xa8], // cheeks
    T: [0xe8, 0x60, 0x70], // tongue
    B: [0x9a, 0xd8, 0xff], // tear
    S: [0xf4, 0xf6, 0xfa], // steam
    O: [0x26, 0x34, 0x52], // outline
  },
  poses: {
    awake: MUG,
    blink: edits(MUG, ...EYES_SHUT),
    bark: edits(MUG, [9, 8, 'OOOO'], [10, 8, 'OTTO']),
    yawn: edits(MUG, ...EYES_SHUT, [9, 8, 'OOOO'], [10, 8, 'OTTO'], [11, 8, 'OOOO']),
    // Sad brows, eyes down, a frown and a tear.
    droop: edits(MUG, [6, 7, 'O'], [6, 12, 'O'], [7, 6, 'MM'], [8, 6, 'KK'], [7, 12, 'MM'], [8, 12, 'KK'], [9, 6, 'BMMOOM'], [10, 6, 'BMOMMO']),
    // A happy hop with a big open smile.
    wag: [...edits(MUG, [9, 8, 'OOOO'], [10, 8, 'MTTM']).slice(1), '........................'],
    // Looks to the left, one brow up.
    sniff: edits(MUG, [7, 4, 'WKMM'], [8, 4, 'KKMM'], [7, 10, 'WKMM'], [8, 10, 'KKMM'], [6, 10, 'OO']),
    // Angry brows and gritted teeth.
    growl: edits(MUG, [6, 5, 'OO'], [7, 6, 'KO'], [6, 13, 'OO'], [7, 12, 'OK'], [9, 8, 'OOOO'], [10, 8, 'OWWO']),
    tired: edits(MUG, ...EYES_HEAVY, ...MOUTH_FLAT),
  },
  levels: [
    MUG,
    edits(MUG, ...LEVEL_2_3, ...MOUTH_FLAT),
    edits(MUG, ...LEVEL_1_3, ...EYES_HEAVY, ...MOUTH_FLAT),
    edits(MUG, ...LEVEL_EMPTY, ...EYES_HEAVY, [9, 8, 'MOOM'], [10, 8, 'OMMO']),
  ],
  workFrames: [steam(0), steam(1), steam(2)],
  voice: {
    name: 'Bögre',
    bark: 'Kész a kávé!',
    growl: 'Forró vagyok, vigyázz!',
    happy: 'Zöld a teszt, kicsordulok!',
    pet: 'Ez jólesett, mint egy korty!',
    sniff: 'Friss deploy illata!',
    snore: 'Zzz... koffein kell',
    sound: 'sounds/chime.wav',
    alt: 'Bögre, a kávés bögre arccal',
  },
  voiceEn: {
    name: 'Bögre',
    bark: 'Coffee is ready!',
    growl: 'Careful, I am hot!',
    happy: 'Tests are green, I am brimming!',
    pet: 'That felt like a warm sip!',
    sniff: 'Smells like a fresh deploy!',
    snore: 'Zzz... need caffeine',
    sound: 'sounds/chime.wav',
    alt: 'Bögre, the coffee mug with a face',
  },
}
