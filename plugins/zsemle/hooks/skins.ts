import { lang } from './i18n'
import { EXTRA_SKINS } from './extra-skins'
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

// ---- Cirmi: a grey tabby cat, front-facing head, sitting --------------------

const CAT = [
  '.G.........G............',
  '.GG.......GG............',
  '.GPG.....GPG............',
  'GGGGSGGGSGGGG...........',
  'GGWEGGGGGWEGG.........SS',
  'GGEKGGGGGEKGG.........GG',
  'LGGGGGPGGGGGL.GGGGG...GG',
  '.LLLLKLKLLLL.GGSGGGGGGG.',
  '..LLLLLLLLL.GGGGSGGGGG..',
  '...LLLLLLLGGGGGGGSGGGG..',
  '...LLLLLLLGGGGGGGGGGGG..',
  '...LL..LL.GGGGGGGGGGG...',
]

const CIRMI: Skin = {
  id: 'cirmi',
  label: 'Cirmi, a szürke cirmos cica',
  aliases: ['macska', 'cica', 'cat', 'cirmos', 'kitty', 'tabby'],
  palette: {
    G: [0xa7, 0xa9, 0xb0], // grey coat
    S: [0x6e, 0x70, 0x78], // tabby stripes
    L: [0xee, 0xec, 0xe6], // muzzle, chest, paws
    E: [0x7c, 0xc0, 0x5c], // green eyes
    K: [0x1c, 0x1c, 0x22], // pupils, mouth
    P: [0xf0, 0x9a, 0xa8], // nose, inner ear
    W: [0xff, 0xff, 0xff], // eye highlight, teeth
    T: [0xe8, 0x78, 0x87], // tongue
    O: [0x3c, 0x3e, 0x46], // outline
  },
  poses: {
    awake: CAT,
    blink: edits(CAT, [4, 2, 'GG'], [5, 2, 'KK'], [4, 9, 'GG'], [5, 9, 'KK']),
    // Mouth open: "Miau!"
    bark: edits(CAT, [7, 5, 'KTK']),
    yawn: edits(CAT, [4, 2, 'GG'], [5, 2, 'KK'], [4, 9, 'GG'], [5, 9, 'KK'], [7, 4, 'KTTK']),
    // Ears flat to the sides.
    droop: edits(CAT, [0, 0, '............'], [1, 0, '............'], [2, 0, 'GG........GG'], [3, 0, 'PGGGSGGGSGGP']),
    // Tail tip curls the other way.
    wag: edits(CAT, [4, 22, '..'], [5, 22, '..'], [4, 20, 'SS'], [5, 20, 'GG'], [6, 20, 'GG.']),
    // Whiskers twitch.
    sniff: edits(CAT, [6, 0, 'K'], [6, 12, 'K']),
    // Hiss: fangs, narrowed eyes.
    growl: edits(CAT, [4, 2, 'KE'], [4, 9, 'EK'], [7, 4, 'KWKWK']),
  },
  voice: {
    name: 'Cirmi',
    bark: 'Miau!',
    growl: 'Fffff!',
    happy: 'Zöld a teszt, dorombolok!',
    pet: 'Dorombolok, köszi!',
    sniff: 'Hmm, gyanús!',
    snore: 'Zzz',
    sound: 'sounds/chime.wav',
    alt: 'Cirmi, a szürke cirmos cica',
  },
  labelEn: 'Cirmi, the grey tabby cat',
  voiceEn: {
    name: 'Cirmi',
    bark: 'Meow!',
    growl: 'Hiss!',
    happy: 'Tests are green, purring!',
    pet: 'Purr, thanks!',
    sniff: 'Hmm, suspicious!',
    snore: 'Zzz',
    sound: 'sounds/chime.wav',
    alt: 'Cirmi, the grey tabby cat',
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

// ---- Kapocs: a paperclip with big eyes (an original drawing) ---------------

const CLIP = [
  '.........MMMMMM.........',
  '........M......M........',
  '..WWWWW.MWWWWW.M........',
  '..WKKWW.MWKKWW.M........',
  '.MWWWWW.MWWWWW.M........',
  '.M......M......M........',
  '.M......M......M........',
  '.M......M......M........',
  '.M......M......M........',
  '.M.............M........',
  '..M...........M.........',
  '...MMMMMMMMMMM..........',
]

const KAPOCS: Skin = {
  id: 'kapocs',
  label: 'Kapocs, a segítőkész gemkapocs',
  aliases: ['gemkapocs', 'gémkapocs', 'paperclip', 'clip', 'paper clip'],
  palette: {
    M: [0xb8, 0xc0, 0xcc], // steel wire
    W: [0xff, 0xff, 0xff], // eye whites
    K: [0x1c, 0x1e, 0x26], // pupils
    T: [0xe8, 0x78, 0x87], // mouth
    O: [0x48, 0x50, 0x5c], // outline
  },
  poses: {
    awake: CLIP,
    blink: edits(CLIP, [2, 2, '.....'], [2, 9, '.....'], [3, 2, 'OOOOO'], [3, 9, 'OOOOO'], [4, 2, '.....'], [4, 9, '.....']),
    bark: edits(CLIP, [6, 6, 'OTTTO']),
    yawn: edits(CLIP, [2, 2, '.....'], [2, 9, '.....'], [3, 2, 'OOOOO'], [3, 9, 'OOOOO'], [4, 2, '.....'], [4, 9, '.....'], [6, 6, 'OTTTO'], [7, 6, 'OTTTO']),
    // Heavy lids, looking down.
    droop: edits(CLIP, [2, 2, 'OOOOO'], [2, 9, 'OOOOO'], [3, 2, 'WWWWW'], [3, 9, 'WWWWW'], [4, 2, 'WKKWW'], [4, 9, 'WKKWW']),
    // A hop: one row up.
    wag: [...CLIP.slice(1), '........................'],
    // Looks to the left.
    sniff: edits(CLIP, [3, 2, 'KKWWW'], [3, 9, 'KKWWW']),
    // Frown: eyebrows tilted down to the middle.
    growl: edits(CLIP, [1, 2, 'OOO'], [2, 5, 'OO'], [1, 11, 'OOO'], [2, 9, 'OO']),
  },
  voice: {
    name: 'Kapocs',
    bark: 'Kling!',
    growl: 'Hé, ezt ne!',
    happy: 'Zöld a teszt, ugrálok!',
    pet: 'Hihi, csiklandoz!',
    sniff: 'Úgy látom, deployoltál!',
    snore: 'Zzz',
    sound: 'sounds/chime.wav',
    alt: 'Kapocs, a gemkapocs',
  },
  labelEn: 'Kapocs, the helpful paperclip',
  voiceEn: {
    name: 'Kapocs',
    bark: 'Ding!',
    growl: 'Hey, not that!',
    happy: 'Tests are green, hopping!',
    pet: 'Hehe, that tickles!',
    sniff: 'Looks like you deployed!',
    snore: 'Zzz',
    sound: 'sounds/chime.wav',
    alt: 'Kapocs, the helpful paperclip',
  },
}

export const SKINS: Readonly<Record<SkinId, Skin>> = Object.fromEntries(
  [ZSEMLE, CIRMI, TRUTYI, KAPOCS, ...EXTRA_SKINS].map(skin => [skin.id, skin]),
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
