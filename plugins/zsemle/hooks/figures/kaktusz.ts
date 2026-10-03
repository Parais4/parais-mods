import { edits } from '../pixels'
import type { Skin } from '../pixels'

// ---- Szúrós: a saguaro cactus with a face in a clay pot --------------

const CACTUS = [
  '........................',
  '........GGGGGGGG.....GG.',
  '.......GGGYGGGGGD....GD.',
  '.GD....GWKGGGGWKD....GD.',
  '.GD....GKKGGGGKKDGGYGGD.',
  '.GD....GPPOGGOPPDGGGGGD.',
  '.GGGYGGGGGGOOGGGD.......',
  '.GGGGGGGGGGGGYGGD.......',
  '.......GGYGGGGGGD.......',
  '.....RRRRRRRRRRRRRR.....',
  '......TTTTTTTTTTTT......',
  '.......TTTTTTTTTT.......',
]

// Wilted: the top flops over, the arms hang down with dry tips, the green fades.
const WILTED = [
  '........................',
  '.....QQQQQQQQ...........',
  '.....QQQQQQQQQQQ........',
  '.QQQQQQQOQQQQOQQQQQQQQQ.',
  '.QQQQQQQKKQQQQKKQQQQQQQ.',
  '.QQ....QQQQOOQQQQ....QQ.',
  '.QQ....QQQOQQOQQQ....QQ.',
  '.QQ....QQQQQQQQQQ....QQ.',
  '.XX....QQQQQQQQQQ....XX.',
  '.....RRRRRRRRRRRRRR.....',
  '......TTTTTTTTTTTT......',
  '.......TTTTTTTTTT.......',
]

const EYES_SHUT: [number, number, string][] = [[3, 8, 'GG'], [4, 8, 'OO'], [3, 14, 'GG'], [4, 14, 'OO']]

export const KAKTUSZ: Skin = {
  id: 'kaktusz',
  label: 'Szúrós, a cserepes kaktusz',
  labelEn: 'Szúrós, the potted cactus',
  aliases: ['kaktusz', 'cactus', 'szúrós', 'szuros'],
  palette: {
    G: [0x5c, 0xb0, 0x4c], // cactus green
    D: [0x3c, 0x88, 0x38], // ribs
    Y: [0xf4, 0xf0, 0xc8], // spines
    R: [0xe2, 0x8c, 0x5c], // pot rim
    T: [0xc8, 0x66, 0x3c], // clay pot
    K: [0x1c, 0x22, 0x18], // eyes
    W: [0xff, 0xff, 0xff], // eye highlight, teeth
    P: [0xf2, 0x98, 0xa8], // cheeks
    F: [0xf0, 0x5c, 0x96], // flower petals
    U: [0xff, 0xd8, 0x40], // flower centre
    Q: [0x9a, 0xa4, 0x48], // wilted green
    X: [0xa8, 0x7a, 0x44], // dry tips
    O: [0x2c, 0x3a, 0x24], // outline
  },
  poses: {
    awake: CACTUS,
    blink: edits(CACTUS, ...EYES_SHUT),
    bark: edits(CACTUS, [5, 10, 'OOOO'], [6, 10, 'OTTO']),
    yawn: edits(CACTUS, ...EYES_SHUT, [5, 10, 'OOOO'], [6, 10, 'OTTO'], [7, 10, 'OOOO']),
    droop: WILTED,
    // A flower opens on top.
    wag: edits(CACTUS, [0, 10, 'FFFF'], [1, 9, 'FFUUFF'], [2, 10, 'FFFF']),
    // A glance to the left.
    sniff: edits(CACTUS, [3, 8, 'KG'], [4, 8, 'KG'], [3, 14, 'KG'], [4, 14, 'KG']),
    // Angry brows, teeth, spines bristling.
    growl: edits(CACTUS, [2, 8, 'O'], [3, 9, 'O'], [2, 15, 'O'], [3, 14, 'OK'], [5, 10, 'OOOO'], [6, 10, 'OWWO'], [0, 9, 'Y'], [0, 14, 'Y'], [1, 6, 'Y'], [2, 19, 'Y']),
    // Heavy lids, a flat mouth.
    tired: edits(CACTUS, [3, 8, 'OO'], [4, 8, 'KK'], [3, 14, 'OO'], [4, 14, 'KK'], [5, 10, 'GOOG'], [6, 10, 'GGGG']),
  },
  voice: {
    name: 'Szúrós',
    bark: 'Tüske!',
    growl: 'Vigyázz, szúrok!',
    happy: 'Zöld a teszt, kivirágoztam!',
    pet: 'Óvatosan, de jólesett!',
    sniff: 'Mi ez, deploy volt?',
    snore: 'Zzz... fotoszintézis',
    sound: 'sounds/chime.wav',
    alt: 'Szúrós, a cserepes kaktusz arccal',
  },
  voiceEn: {
    name: 'Szúrós',
    bark: 'Prickle!',
    growl: 'Careful, I prick!',
    happy: 'Tests are green, I am blooming!',
    pet: 'Careful, but that was nice!',
    sniff: 'What is that, a deploy?',
    snore: 'Zzz... photosynthesis',
    sound: 'sounds/chime.wav',
    alt: 'Szúrós, the potted cactus with a face',
  },
}
