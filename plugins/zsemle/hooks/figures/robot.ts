import { edits } from '../pixels'
import type { Skin } from '../pixels'

// ---- Robi: a friendly retro robot with a screen face and an antenna ---------

const BOT = [
  '..........RRRR..........',
  '..........RRRR..........',
  '...........DD...........',
  '....GGGGGGGGGGGGGGGG....',
  '....GGSSSSSSSSSSSSGG....',
  '..DDGGSEESSSSSSEESGGDD..',
  '..DDGGSEESSSSSSEESGGDD..',
  '....GGSSSSEEEESSSSGG....',
  '....GGGGGGGGGGGGGGGG....',
  '....DD.CYYCCEECCC.DD....',
  '....GG.CYYCCEECCC.GG....',
  '.......DDDD..DDDD.......',
]

const EYES_SHUT: [number, number, string][] = [[5, 7, 'SS'], [5, 15, 'SS'], [6, 6, 'EEE'], [6, 15, 'EEE']]

const BALL_DIM: [number, number, string][] = [[0, 10, 'BBBB'], [1, 10, 'BBBB']]

// Arms lifted up next to the head.
const ARMS_UP: [number, number, string][] = [
  [9, 4, '..'], [9, 18, '..'], [10, 4, '..'], [10, 18, '..'],
  [8, 2, 'DD'], [8, 20, 'DD'], [7, 1, 'GG'], [7, 21, 'GG'],
]

// Eyes to the right, on the work.
const WORKING: [number, number, string][] = [[5, 7, 'SEE'], [6, 7, 'SEE'], [5, 15, 'SEE'], [6, 15, 'SEE']]

export const ROBOT: Skin = {
  id: 'robot',
  label: 'Robi, a barátságos retró robot',
  labelEn: 'Robi, the friendly retro robot',
  aliases: ['robot', 'robi', 'bot', 'droid'],
  palette: {
    G: [0xb4, 0xc2, 0xd0], // head metal
    C: [0x8f, 0xa9, 0xc9], // body, a bluer steel
    D: [0x6e, 0x7e, 0x92], // dark metal: arms, feet, bolts, antenna stick
    S: [0x1c, 0x28, 0x34], // screen
    E: [0x6e, 0xf0, 0xf4], // glowing eyes and mouth
    F: [0x2e, 0x86, 0x92], // dimmed eyes
    R: [0xff, 0x52, 0x2e], // lit antenna ball, angry eyes
    B: [0x7e, 0x3c, 0x34], // dim antenna ball
    Y: [0xff, 0xc8, 0x3c], // chest light
    O: [0x34, 0x3e, 0x4c], // outline
  },
  poses: {
    awake: BOT,
    // Eyes shut: also the sleeping face.
    blink: edits(BOT, ...EYES_SHUT),
    // The mouth glows open: beep!
    bark: edits(BOT, [6, 10, 'EEEE']),
    yawn: edits(BOT, ...BALL_DIM, [5, 6, 'EEE'], [5, 15, 'EEE'], [6, 7, 'SS'], [6, 15, 'SS'], [6, 10, 'EEEE']),
    // Worried eyes, a frown, the antenna bent over and dim.
    droop: edits(
      BOT,
      [5, 7, 'SE'], [5, 15, 'ES'], [6, 11, 'EE'],
      [0, 10, '....'], [1, 10, '....'], [1, 14, 'BBBB'], [2, 13, 'DBBBB'],
    ),
    // Arms up, happy ^ ^ eyes, a happy open mouth.
    wag: edits(BOT, ...ARMS_UP, [5, 6, 'SEES'], [6, 6, 'ESSE'], [5, 14, 'SEES'], [6, 14, 'ESSE'], [6, 11, 'EE']),
    // Glances to the left.
    sniff: edits(BOT, [5, 6, 'EES'], [6, 6, 'EES'], [5, 14, 'EES'], [6, 14, 'EES']),
    // Red slanted eyes, a red scowl, fists up.
    growl: edits(BOT, ...ARMS_UP, [5, 7, 'RS'], [6, 7, 'RR'], [5, 15, 'SR'], [6, 15, 'RR'], [6, 10, 'SRRS'], [7, 10, 'RRRR']),
    // Low battery: dim half-closed eyes, dim mouth and antenna, red chest light.
    tired: edits(
      BOT,
      ...BALL_DIM,
      [5, 7, 'SS'], [5, 15, 'SS'], [6, 7, 'FF'], [6, 15, 'FF'],
      [7, 10, 'FFFF'], [9, 8, 'RR'], [10, 8, 'RR'],
    ),
  },
  // The antenna ball blinks while the model works, a scan line runs across the mouth.
  workFrames: [
    edits(BOT, ...WORKING, [7, 10, 'EESS']),
    edits(BOT, ...WORKING, ...BALL_DIM, [7, 10, 'SSEE']),
  ],
  voice: {
    name: 'Robi',
    bark: 'Bip-bup!',
    growl: 'Bzzz, hiba!',
    happy: 'Zöld a teszt, bip-bip-hurrá!',
    pet: 'Bip! Rendszer boldog.',
    sniff: 'Bip-bip, deploy észlelve!',
    snore: 'Bzz... alvó mód',
    sound: 'sounds/chime.wav',
    alt: 'Robi, a barátságos retró robot',
  },
  voiceEn: {
    name: 'Robi',
    bark: 'Beep-boop!',
    growl: 'Bzzt, error!',
    happy: 'Tests are green, beep-beep-hooray!',
    pet: 'Beep! System happy.',
    sniff: 'Beep-beep, deploy detected!',
    snore: 'Bzz... sleep mode',
    sound: 'sounds/chime.wav',
    alt: 'Robi, the friendly retro robot',
  },
}
