import { edits } from '../pixels'
import type { Skin } from '../pixels'

// ---- Huhu: a brown owl facing the viewer, perched on a branch ---------------

const OWL = [
  '....DD............DD....',
  '....DDBBBBBBBBBBBBDD....',
  '...BBYYYYBBBBBBYYYYBB...',
  '..BBYYWKYYBBBBYYWKYYBB..',
  '..BBYYKKYYAAAAYYKKYYBB..',
  '..BBBYYYYBBAABBYYYYBBB..',
  '..DDDDLLLLLLLLLLLLDDDD..',
  '.DDDDLLDLDLLLLDLDLLDDDD.',
  '.DDDDLLLDLLLLLLDLLLDDDD.',
  '..DDDLLLLLLLLLLLLLLDDD..',
  '....DDLAALLLLLLAALDD....',
  '.GGGGGGGGGGGGGGGGGGGGGG.',
]

// Eyes shut: brown lids with a dark lash line.
const SHUT: [number, number, string][] = [
  [2, 5, 'BBBB'], [2, 15, 'BBBB'],
  [3, 4, 'BBBBBB'], [3, 14, 'BBBBBB'],
  [4, 4, 'OOOOOO'], [4, 14, 'OOOOOO'],
]

export const BAGOLY: Skin = {
  id: 'bagoly',
  label: 'Huhu, a barna bagoly',
  labelEn: 'Huhu, the brown owl',
  aliases: ['bagoly', 'owl'],
  palette: {
    B: [0x9a, 0x66, 0x3c], // brown head
    D: [0x6c, 0x44, 0x26], // darker wings, tufts, belly marks
    L: [0xee, 0xdc, 0xb8], // light belly
    Y: [0xf6, 0xc8, 0x32], // eye rings
    K: [0x1a, 0x12, 0x0c], // pupils
    W: [0xff, 0xff, 0xff], // eye highlight
    A: [0xec, 0x8c, 0x2c], // beak, talons
    G: [0x7a, 0x8a, 0x3a], // mossy branch
    O: [0x3a, 0x24, 0x14], // outline
  },
  poses: {
    awake: OWL,
    blink: edits(OWL, ...SHUT),
    // Beak open: "Huhú!"
    bark: edits(OWL, [5, 10, 'KKKK'], [6, 11, 'AA']),
    yawn: edits(OWL, ...SHUT, [5, 10, 'KKKK'], [6, 10, 'KKKK'], [7, 11, 'AA']),
    // Tufts flat, lids sagging outward, looking down.
    droop: edits(
      OWL,
      [0, 0, '........................'],
      [1, 2, 'DDBBBBBBBBBBBBBBBBDD'],
      [2, 5, 'BBBB'], [2, 15, 'BBBB'],
      [3, 4, 'OOYYYY'], [3, 14, 'YYYYOO'],
      [5, 5, 'YKKY'], [5, 15, 'YKKY'],
    ),
    // A little hop off the branch, talons dangling.
    wag: [...OWL.slice(1, 11), '.......AA......AA.......', OWL[11] ?? ''],
    // Looks to the left.
    sniff: edits(OWL, [3, 4, 'WKYYYY'], [4, 4, 'KKYYYY'], [3, 14, 'WKYYYY'], [4, 14, 'KKYYYY']),
    // Angry brows slanting to the beak, tufts up, beak snapping.
    growl: edits(
      OWL,
      [0, 3, 'DD'], [0, 19, 'DD'],
      [2, 4, 'OO'], [3, 6, 'OOOO'],
      [2, 18, 'OO'], [3, 14, 'OOOO'],
      [5, 10, 'KKKK'],
    ),
    // Heavy half-closed lids, tufts sagging.
    tired: edits(
      OWL,
      [0, 4, '..'], [0, 18, '..'],
      [1, 3, 'D'], [1, 20, 'D'],
      [2, 5, 'BBBB'], [2, 15, 'BBBB'],
      [3, 4, 'OOOOOO'], [3, 14, 'OOOOOO'],
    ),
  },
  nightOwl: true,
  voice: {
    name: 'Huhu',
    bark: 'Huhú!',
    growl: 'Kssss!',
    happy: 'Zöld a teszt, csapkodok!',
    pet: 'Puha tollak, köszi!',
    sniff: 'Huhú, látom ám!',
    snore: 'Huhú... zzz',
    sound: 'sounds/chime.wav',
    alt: 'Huhu, a barna bagoly egy ágon',
    night: 'Elmúlt 22 óra. Ideje lezárni a napot: mentsd a Folytatás innen blokkot, és pihenj.',
  },
  voiceEn: {
    name: 'Huhu',
    bark: 'Hoot!',
    growl: 'Hsss!',
    happy: 'Tests are green, flapping!',
    pet: 'Soft feathers, thanks!',
    sniff: 'Hoo, I see it!',
    snore: 'Hoo... zzz',
    sound: 'sounds/chime.wav',
    alt: 'Huhu, the brown owl on a branch',
    night: 'It is past 10 pm. Time to close the day: save the Continue from here block and get some rest.',
  },
}
