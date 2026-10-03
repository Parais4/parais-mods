import { edits, lower } from '../pixels'
import type { Skin } from '../pixels'

// ---- Kacsa: the classic yellow rubber duck, side view facing left, afloat ----

const DUCK = [
  '......YYYYYY............',
  '....YYWKYYYYYY..........',
  '...YYYKKYYYYYYY.........',
  '.AAAAYYYYYYYYYY.........',
  '.AAAAYYYYYYYYYY......YY.',
  '....YYYYYYYYYYY.....YYY.',
  '...YYYYYYYYYYYYYYYYYYYY.',
  '..YYYYYYYDDDDDYYYYYYYYY.',
  '..YYYYYYYYDDDDDDDYYYYY..',
  '..YYYYYYYYYYYYYYYYYYYY..',
  '...YYYYYYYYYYYYYYYYYY...',
  '.UUUUUUUUUUUUUUUUUUUUUU.',
]

const WATER = DUCK[11] ?? ''

export const GUMIKACSA: Skin = {
  id: 'gumikacsa',
  label: 'Kacsa, a gumikacsa',
  labelEn: 'Kacsa, the rubber duck',
  aliases: ['gumikacsa', 'kacsa', 'duck', 'rubber duck'],
  palette: {
    Y: [0xff, 0xd6, 0x2e], // yellow rubber
    D: [0xf0, 0xa8, 0x14], // wing shading
    A: [0xff, 0x82, 0x1e], // orange beak
    K: [0x1c, 0x1a, 0x18], // eye, open beak
    W: [0xff, 0xff, 0xff], // eye highlight
    U: [0x58, 0xb4, 0xe8], // water
    O: [0x9a, 0x62, 0x0e], // outline
  },
  poses: {
    awake: DUCK,
    blink: edits(DUCK, [1, 6, 'YY'], [2, 6, 'OO']),
    // Beak open: "Háp!"
    bark: edits(DUCK, [4, 1, 'KKKA'], [5, 1, 'AAAA']),
    yawn: edits(DUCK, [1, 6, 'YY'], [2, 6, 'OO'], [2, 1, 'AAA'], [3, 1, 'KKKA'], [4, 1, 'KKKA'], [5, 1, 'AAAA']),
    // Head hung, eye down, a tear, tail flat.
    droop: edits(
      DUCK,
      [1, 6, 'YY'], [2, 6, 'KK'], [3, 6, 'KK'],
      [3, 1, '....'], [4, 1, 'AAAA'], [5, 1, 'AAAA'],
      [4, 7, 'U'],
      [4, 21, '..'], [5, 20, '...'], [6, 22, 'Y'],
    ),
    // Bobbing up on a wave.
    wag: [...DUCK.slice(1, 11), '..UU....UUUU......UU....', WATER],
    // Head up, listening: beak raised, eye wide.
    sniff: edits(DUCK, [1, 6, 'KW'], [2, 1, 'AAA'], [3, 1, 'AAAA'], [4, 1, '....']),
    // Angry brow slanting to the beak, quacking back.
    growl: edits(DUCK, [1, 6, 'YYOO'], [2, 6, 'OOYY'], [3, 6, 'KK'], [4, 1, 'KKKA'], [5, 1, 'AAAA']),
    // Sinking a little lower, heavy lid.
    tired: [...lower(edits(DUCK, [1, 6, 'OO'], [2, 6, 'KK']), 1).slice(0, 11), WATER],
  },
  voice: {
    name: 'Kacsa',
    bark: 'Háp!',
    growl: 'Háp-háp-háp!',
    happy: 'Zöld a teszt! Látod, csak el kellett mondanod.',
    pet: 'Nyikk! Figyelek, mesélj tovább.',
    sniff: 'Háp, figyelek!',
    snore: 'Háp... zzz',
    sound: 'sounds/chime.wav',
    alt: 'Kacsa, a sárga gumikacsa a vízen',
  },
  voiceEn: {
    name: 'Kacsa',
    bark: 'Quack!',
    growl: 'Quack-quack-quack!',
    happy: 'Tests are green! See, you just had to explain it.',
    pet: 'Squeak! I am listening, go on.',
    sniff: 'Quack, I am listening!',
    snore: 'Quack... zzz',
    sound: 'sounds/chime.wav',
    alt: 'Kacsa, the yellow rubber duck afloat',
  },
}
