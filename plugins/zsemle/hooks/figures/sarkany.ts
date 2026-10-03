import { edits, lower } from '../pixels'
import type { Skin } from '../pixels'

// ---- Füstös: a chunky baby dragon, side view, facing left ------------------

const DRAGON = [
  '........HH..HH..........',
  '.......GGGGGGGG.........',
  '......GGGGGGGGGG........',
  '.....GGGWKGGGGGGDD......',
  '...GGOGGKKGGGGGDMMD.....',
  '...GGGGGGGGPPGDMMMMD.DD.',
  '....GGGGGGGGGGDMDMMD.GG.',
  '........GBBBBGDMDMDD.GG.',
  '........BBBBBGGDDDDGGG..',
  '........BBBBBGGGGGGGG...',
  '.........BBBBGGGGGGG....',
  '.........GGG....GGG.....',
]

// Sad: the wing lies flat on the back, the tail rests on the ground.
const DROOPED = [
  '........HH..HH..........',
  '.......GGGGGGGG.........',
  '......GGGGGGGGGG........',
  '.....GGGGOGGGGGG........',
  '...GGOGGKKGGGGGG........',
  '...GGGGGGGGPPGGGDDD.....',
  '....GGOOGGGGGGGDMMMD....',
  '........GBBBBGDMDMDD....',
  '........BBBBBGGDDDDGG...',
  '........BBBBBGGGGGGGGGD.',
  '.........BBBBGGGGGGG....',
  '.........GGG....GGG.....',
]

const EYE_SHUT: [number, number, string][] = [[3, 8, 'GG'], [4, 8, 'OO']]
const EYE_HEAVY: [number, number, string][] = [[3, 8, 'OO'], [4, 8, 'KK']]

// Fire: a flame cone out of the open mouth, in front of the snout.
const FIRE: [number, number, string][] = [
  [3, 2, 'RF'],
  [4, 1, 'RFF'],
  [5, 1, 'FYYYYO'],
  [6, 1, 'RFFF'],
  [7, 2, 'RF'],
  [3, 8, 'OK'],
]

export const SARKANY: Skin = {
  id: 'sarkany',
  label: 'Füstös, a kis sárkány',
  labelEn: 'Füstös, the little dragon',
  aliases: ['sárkány', 'sarkany', 'dragon', 'füstös', 'fustos'],
  palette: {
    G: [0x6c, 0xc4, 0x5c], // green scales
    D: [0x3e, 0x92, 0x48], // darker green: wing ridges, tail tip
    M: [0xf6, 0xb4, 0x68], // wing membrane
    B: [0xf6, 0xe8, 0xb0], // belly, horns
    H: [0xf6, 0xea, 0xc8], // horns
    K: [0x1a, 0x22, 0x1a], // eye
    W: [0xff, 0xff, 0xff], // eye highlight, teeth
    P: [0xf2, 0x98, 0xa8], // cheek
    T: [0xd8, 0x48, 0x5a], // mouth inside
    F: [0xff, 0x8a, 0x1c], // flame
    Y: [0xff, 0xe2, 0x4a], // flame core
    R: [0xe8, 0x40, 0x22], // flame edge
    S: [0xc8, 0xc8, 0xcc], // smoke
    O: [0x24, 0x4a, 0x2c], // outline
  },
  poses: {
    awake: DRAGON,
    blink: edits(DRAGON, ...EYE_SHUT),
    // Rawr: the mouth opens.
    bark: edits(DRAGON, [5, 3, '.TTO'], [6, 4, 'TT']),
    yawn: edits(DRAGON, ...EYE_SHUT, [4, 3, '.'], [5, 3, '.TTTO'], [6, 4, 'TTTO']),
    droop: DROOPED,
    // Happy: the wing lifts, the tail tip rises.
    wag: edits(DRAGON, [2, 16, 'DD'], [3, 15, 'DMMD'], [4, 14, 'DMMMMD'], [5, 14, 'DMDMMD'], [6, 14, 'DMDMDD'], [7, 14, 'GDDDDG'], [8, 15, 'GGGG'], [4, 21, 'DD'], [5, 21, 'GG']),
    // Fire breath after a deploy.
    sniff: edits(DRAGON, ...FIRE),
    // Angry brow, teeth, a puff of smoke from the nostril.
    growl: edits(DRAGON, [3, 8, 'OK'], [2, 8, 'OO'], [5, 3, '.WWO'], [0, 3, 'SS'], [1, 2, 'SSSS'], [2, 2, 'SS']),
    // Heavy lids, slumped down to the ground.
    tired: lower(edits(DRAGON, ...EYE_HEAVY), 1),
  },
  voice: {
    name: 'Füstös',
    bark: 'Rawr!',
    growl: 'Grrr, füstölök!',
    happy: 'Zöld a teszt, csapkodok!',
    pet: 'Puha pikkely, köszi!',
    sniff: 'Fúúú, deploy! Tűzzel kísérem!',
    snore: 'Zzz... pff',
    sound: 'sounds/chime.wav',
    alt: 'Füstös, a kis zöld sárkány',
  },
  voiceEn: {
    name: 'Füstös',
    bark: 'Rawr!',
    growl: 'Grrr, I am smoking!',
    happy: 'Tests are green, flapping!',
    pet: 'Soft scales, thanks!',
    sniff: 'Whoosh, a deploy! Fire salute!',
    snore: 'Zzz... pff',
    sound: 'sounds/chime.wav',
    alt: 'Füstös, the little green dragon',
  },
}
