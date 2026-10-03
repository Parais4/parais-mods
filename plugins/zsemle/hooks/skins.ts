import { lang } from './i18n'
import { EXTRA_SKINS } from './extra-skins'
import { CIRMI } from './figures/cirmi'
import { KAPOCS } from './figures/kapocs'
import { PINGVIN } from './figures/pingvin'
import { TEKNOS } from './figures/teknos'
import { HORCSOG } from './figures/horcsog'
import { BAGOLY } from './figures/bagoly'
import { RUBIK } from './figures/rubik'
import { GUMIKACSA } from './figures/gumikacsa'
import { BOGRE } from './figures/bogre'
import { KAKTUSZ } from './figures/kaktusz'
import { SARKANY } from './figures/sarkany'
import { SZELLEM } from './figures/szellem'
import { ROBOT } from './figures/robot'
import { edits, lower } from './pixels'
import type { Skin, SkinId, Voice } from './pixels'

export { edits, HEIGHT, POSE_NAMES, WIDTH } from './pixels'
export type { Pose, Skin, SkinId, Voice } from './pixels'

// The figures Zsemle can wear. Each skin is pixel art on a 24 x 12 grid (a
// pixel is a quarter of a terminal cell, half as wide as it is tall), one
// grid per pose, its own palette and its own voice. Letters are colors, '.'
// is transparent, 'O' is the outline color every skin defines. No `$` here.

// ---- Zsemle: a cream golden retriever puppy, sitting, facing left ------------

const DOG = [
  '......CCCCCCDD..........',
  '...CCCCCCCCCODDD........',
  '..CCCWKKCCCCODDDDD......',
  'LLLLCCCCCCCCODDDDD......',
  'KKLLLLCCCCCCCODDD.......',
  '..LLTTLLCCCCCCCC........',
  '....LLLLCCCCCCCCCC......',
  '....LLLLCCCCCCCCCCCC..DD',
  '....LLOLLCCCCCCCCCCCDDDD',
  '....LLOLLCCCCCCCCCCDDD..',
  '....LLOLLOCCCCCCCC......',
  '..LLLLLLLL.LLLLLL.......',
]

const ZSEMLE: Skin = {
  id: 'zsemle',
  label: 'Zsemle, a golden retriever kölyök',
  aliases: ['kutya', 'dog', 'golden', 'retriever'],
  palette: {
    C: [0xe9, 0xc5, 0x8f], // cream coat ("zsemle")
    D: [0xc8, 0x98, 0x5c], // darker ear and tail
    L: [0xf8, 0xe7, 0xc6], // light muzzle, chest, paws
    K: [0x28, 0x1a, 0x12], // eye, nose
    T: [0xe8, 0x78, 0x87], // tongue
    W: [0xff, 0xff, 0xff], // eye highlight, teeth
    O: [0x78, 0x50, 0x28], // outline
  },
  poses: {
    awake: DOG,
    // Eye closed: also the sleeping face.
    blink: edits(DOG, [2, 5, 'COO']),
    bark: edits(DOG, [4, 3, 'OOO'], [5, 2, 'TTTT']),
    yawn: edits(DOG, [4, 2, 'OOOO'], [5, 2, 'TTTTT']),
    // Ear hangs lower: sad after a failure.
    droop: edits(DOG, [0, 12, 'CC'], [1, 12, 'CCCC'], [2, 12, 'ODDDDD'], [3, 12, 'ODDDDD'], [4, 13, 'ODDD'], [5, 12, 'ODDD'], [6, 12, 'ODDD']),
    // Tail raised: alternates with awake while wagging.
    wag: edits(DOG, [7, 22, '..'], [8, 20, 'CC..'], [6, 20, 'DD'], [5, 21, 'DD']),
    // Nose twitch: alternates with awake while sniffing.
    sniff: edits(DOG, [4, 0, 'DD']),
    // Teeth shown, ear pinned back.
    growl: edits(DOG, [5, 2, 'OOWWWW'], [1, 12, 'CCODDD']),
    // Heavy lid, ear hanging low: the limit is running out.
    tired: edits(DOG, [2, 5, 'COK'], [0, 12, 'CC'], [1, 12, 'CCCC'], [2, 12, 'ODDDDD'], [3, 12, 'ODDDDD'], [4, 13, 'ODDD'], [5, 12, 'ODDD'], [6, 12, 'ODDD']),
  },
  voice: {
    name: 'Zsemle',
    bark: 'Vau!',
    growl: 'Grrr!',
    happy: 'Zöld a teszt, csóválok!',
    pet: 'Köszi a simit!',
    sniff: 'Szimat!',
    snore: 'Zzz',
    sound: 'sounds/bark.wav',
    alt: 'Zsemle, a golden retriever kölyök',
  },
  labelEn: 'Zsemle, the golden retriever puppy',
  voiceEn: {
    name: 'Zsemle',
    bark: 'Woof!',
    growl: 'Grrr!',
    happy: 'Tests are green, wagging!',
    pet: 'Thanks for the pat!',
    sniff: 'Sniff!',
    snore: 'Zzz',
    sound: 'sounds/bark.wav',
    alt: 'Zsemle, the golden retriever puppy',
  },
}

// ---- Trutyi: a jelly slime with big eyes -------------------------------------

const SLIME = [
  '........SSSSSSS.........',
  '......SSSSSSSSSSS.......',
  '....SSSHHSSSSSSSSSS.....',
  '...SSSHHSSSSSSSSSSSS....',
  '..SSSSSSSSSSSSSSSSSSS...',
  '..SSWKSSSSWKSSSSSSSSSS..',
  '.SSSKKSSSSKKSSSSSSSSSSS.',
  '.SSSKKSSSSKKSSSSSSSSSSS.',
  'SSSSSSSMMSSSSSSSSSSSSSSS',
  'SSSSSSSSSSSSSSSSSSSSSSSS',
  'DSSSSSSSSSSSSSSSSSSSSSSD',
  '.DDDDDDDDDDDDDDDDDDDDDD.',
]

// Squashed one row lower and wider at the top: the wobble.
const SLIME_SQUASH = lower(
  [
    '......SSSSSSSSSSS.......',
    '...SSSHHSSSSSSSSSSSS....',
    '..SSSHHSSSSSSSSSSSSSSS..',
    '.SSSWKSSSSWKSSSSSSSSSSS.',
    '.SSSKKSSSSKKSSSSSSSSSSS.',
    'SSSSKKSSSSKKSSSSSSSSSSSS',
    'SSSSSSSMMSSSSSSSSSSSSSSS',
    'SSSSSSSSSSSSSSSSSSSSSSSS',
    'SSSSSSSSSSSSSSSSSSSSSSSS',
    'DSSSSSSSSSSSSSSSSSSSSSSD',
    '.DDDDDDDDDDDDDDDDDDDDDD.',
    '........................',
  ],
  1,
)

const TRUTYI: Skin = {
  id: 'trutyi',
  label: 'Trutyi, a zselés slime',
  aliases: ['slime', 'zselé', 'zsele', 'nyalka', 'nyálka'],
  palette: {
    S: [0x6f, 0xd6, 0xa0], // jelly
    D: [0x3f, 0xa4, 0x74], // darker base
    H: [0xd8, 0xfb, 0xe8], // gloss
    K: [0x14, 0x2a, 0x22], // eyes
    W: [0xff, 0xff, 0xff], // eye highlight
    M: [0x2a, 0x5c, 0x46], // mouth
    T: [0xe8, 0x78, 0x87], // tongue
    O: [0x24, 0x6c, 0x4c], // outline
  },
  poses: {
    awake: SLIME,
    blink: edits(SLIME, [5, 4, 'SS'], [5, 10, 'SS'], [6, 4, 'SS'], [6, 10, 'SS']),
    bark: edits(SLIME, [8, 6, 'MTTM']),
    yawn: edits(SLIME, [5, 4, 'SS'], [5, 10, 'SS'], [6, 4, 'SS'], [6, 10, 'SS'], [8, 6, 'MTTM'], [9, 6, 'MMMM']),
    // Melted a little: lower and flat.
    droop: lower(edits(SLIME, [5, 4, 'SS'], [5, 10, 'SS'], [8, 7, 'SS'], [9, 6, 'MMMM']), 1),
    wag: SLIME_SQUASH,
    // Looks to the left.
    sniff: edits(SLIME, [5, 3, 'WKS'], [6, 3, 'KKS'], [7, 3, 'KKS'], [5, 9, 'WKS'], [6, 9, 'KKS'], [7, 9, 'KKS']),
    // Eyes narrowed, a frown.
    growl: edits(SLIME, [5, 4, 'KK'], [5, 10, 'KK'], [6, 4, 'SK'], [6, 10, 'KS'], [8, 6, 'MMMM']),
    // Heavy lids over the eyes, a flat mouth.
    tired: edits(SLIME, [5, 4, 'OO'], [5, 10, 'OO'], [8, 7, 'MM']),
  },
  voice: {
    name: 'Trutyi',
    bark: 'Blub!',
    growl: 'Bugyborr!',
    happy: 'Zöld a teszt, rezgek!',
    pet: 'Ragacsos köszi!',
    sniff: 'Bugyog valami!',
    snore: 'Blub... blub',
    sound: 'sounds/chime.wav',
    alt: 'Trutyi, a zselés slime',
  },
  labelEn: 'Trutyi, the jelly slime',
  voiceEn: {
    name: 'Trutyi',
    bark: 'Blub!',
    growl: 'Bubble-grr!',
    happy: 'Tests are green, wobbling!',
    pet: 'Sticky thanks!',
    sniff: 'Something is bubbling!',
    snore: 'Blub... blub',
    sound: 'sounds/chime.wav',
    alt: 'Trutyi, the jelly slime',
  },
}

// Each figure's own sound, relative to the mod root (sounds/CREDITS.md).
const SOUNDS: Record<string, string> = {
  zsemle: 'sounds/bark.wav',
  cirmi: 'sounds/meow.wav',
  trutyi: 'sounds/blub.wav',
  kapocs: 'sounds/ding.wav',
  pingvin: 'sounds/penguin.wav',
  teknos: 'sounds/hum.wav',
  horcsog: 'sounds/squeak.wav',
  bagoly: 'sounds/hoot.wav',
  rubik: 'sounds/click.wav',
  gumikacsa: 'sounds/quack.wav',
  bogre: 'sounds/clink.wav',
  kaktusz: 'sounds/boing.wav',
  sarkany: 'sounds/roar.wav',
  szellem: 'sounds/ooo.wav',
  robot: 'sounds/beep.wav',
}

const withSound = (skin: Skin): Skin => {
  const sound = SOUNDS[skin.id]
  return sound === undefined ? skin : { ...skin, voice: { ...skin.voice, sound }, voiceEn: { ...skin.voiceEn, sound } }
}

export const SKINS: Readonly<Record<SkinId, Skin>> = Object.fromEntries(
  [ZSEMLE, CIRMI, TRUTYI, KAPOCS, PINGVIN, TEKNOS, HORCSOG, BAGOLY, RUBIK, GUMIKACSA, BOGRE, KAKTUSZ, SARKANY, SZELLEM, ROBOT, ...EXTRA_SKINS]
    .map(withSound)
    .map(skin => [skin.id, skin]),
)

export const SKIN_IDS: readonly SkinId[] = Object.keys(SKINS)

export const DEFAULT_SKIN: SkinId = 'zsemle'

/** The skin by id, the default one for an unknown id. */
export function skinOf(id: SkinId): Skin {
  return SKINS[id] ?? ZSEMLE
}

/** The skin's voice in the current language. */
export function voiceOf(id: SkinId): Voice {
  return lang() === 'en' ? skinOf(id).voiceEn : skinOf(id).voice
}

/** The skin's label in the current language. */
export function labelOf(id: SkinId): string {
  return lang() === 'en' ? skinOf(id).labelEn : skinOf(id).label
}

const fold = (s: string) => s.trim().toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')

/** The skin a word names (id, alias or label start), accents and case ignored; null when none. */
export function findSkin(word: string): SkinId | null {
  const w = fold(word)
  if (w === '') return null
  for (const id of SKIN_IDS) {
    const skin = skinOf(id)
    if (fold(id) === w || skin.aliases.some(a => fold(a) === w) || fold(skin.voice.name) === w) return id
    if (fold(skin.labelEn.split(',')[0] ?? '') === w) return id
  }
  return null
}

/** A stored value as a skin id, falling back to the default. */
export function asSkin(value: unknown): SkinId {
  return typeof value === 'string' && (SKIN_IDS as string[]).includes(value) ? (value as SkinId) : DEFAULT_SKIN
}

/** The skin after `id` in the list, wrapping around. */
export function nextSkin(id: SkinId): SkinId {
  const i = SKIN_IDS.indexOf(id)
  return SKIN_IDS[(i + 1) % SKIN_IDS.length] ?? DEFAULT_SKIN
}
