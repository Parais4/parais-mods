import { edits } from '../pixels'
import type { Skin } from '../pixels'

// ---- Cirmi: a grey tabby kitten, sitting, seen from the front ---------------

const CAT = [
  '..GG..........GG........',
  '..GPPGG....GGPPG........',
  '..GGGGGGSSGGGGGG........',
  '.GGEWKEGSSGEWKEGG.......',
  '.GGEKKEGGGGEKKEGG.......',
  '.SGGGGLLPPLLGGGGS...SS..',
  '.SGGGLLLLLLLLGGGS...GG..',
  '..GGGGGGLLGGGGGG....SS..',
  '....GGLLLLLLGG......GG..',
  '...SGGLLLLLLGGS.....SS..',
  '..GSGLLLLLLLLGSG...GG...',
  '..GGGLLLOOLLLGGGGGGG....',
]

// Eyes shut in a soft curve: blink, sleep and yawn.
const SHUT: [number, number, string][] = [[3, 3, 'GGGG'], [4, 3, 'OOOO'], [3, 11, 'GGGG'], [4, 11, 'OOOO']]

export const CIRMI: Skin = {
  id: 'cirmi',
  label: 'Cirmi, a szürke cirmos cica',
  aliases: ['macska', 'cica', 'cat', 'cirmos', 'kitty', 'tabby'],
  palette: {
    G: [0xa7, 0xa9, 0xb0], // grey coat
    S: [0x6e, 0x70, 0x78], // tabby stripes
    L: [0xf2, 0xf0, 0xea], // muzzle, chest, paws
    E: [0x86, 0xcc, 0x58], // green eyes
    K: [0x1c, 0x1c, 0x22], // pupils
    P: [0xf0, 0x9a, 0xa8], // nose, inner ear
    W: [0xff, 0xff, 0xff], // eye highlight, fangs
    T: [0xe8, 0x78, 0x87], // tongue
    O: [0x3c, 0x3e, 0x46], // outline, lids, mouth
  },
  poses: {
    awake: CAT,
    blink: edits(CAT, ...SHUT),
    // Mouth open: "Miau!"
    bark: edits(CAT, [6, 7, 'OTTO'], [7, 8, 'TT']),
    yawn: edits(CAT, ...SHUT, [6, 6, 'OTTTTO'], [7, 7, 'OTTO']),
    // Ears flat to the sides, looking down: sad after a failure.
    droop: edits(CAT, [0, 0, '........................'], [1, 0, '.GGGG........GGGG.......'], [2, 1, 'P'], [2, 16, 'P'], [3, 3, 'EEEE'], [4, 3, 'EKKE'], [3, 11, 'EEEE'], [4, 11, 'EKKE']),
    // Tail flicks up.
    wag: edits(CAT, [3, 20, 'SS'], [4, 20, 'GG']),
    // A glance to the left.
    sniff: edits(CAT, [3, 3, 'WKEE'], [4, 3, 'KKEE'], [3, 11, 'WKEE'], [4, 11, 'KKEE']),
    // Hiss: ears back, angry brows, fangs.
    growl: edits(CAT, [0, 0, '........................'], [1, 0, '.GPGG........GGPG.......'], [3, 3, 'EEOO'], [3, 11, 'OOEE'], [6, 6, 'OWTTWO'], [7, 8, 'OO']),
    // Heavy lids, ears lowered: the limit is running out.
    tired: edits(CAT, [0, 0, '........................'], [3, 3, 'SSSS'], [4, 3, 'EKKE'], [3, 11, 'SSSS'], [4, 11, 'EKKE']),
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
