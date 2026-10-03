import { edits } from '../pixels'
import type { Skin } from '../pixels'

// ---- Kapocs: a silver paperclip with a little face in its top loop ----------

// The wire: the outer run on the left, the inner run that ends halfway down,
// the long run on the right whose top end is free. A round cream face peeks
// out of the upper loop.
const CLIP = [
  '...HHHHHHHHHH...........',
  '..HM........HM..........',
  '..HM.FFFFFF.HM...HM.....',
  '..HMFFKFFKFFHM...HM.....',
  '..HMFFKFFKFFHM...HM.....',
  '..HMFPFOOFPFHM...HM.....',
  '..HM.FFFFFF.HM...HM.....',
  '..HM........HM...HM.....',
  '..HM.............HM.....',
  '..HM.............HM.....',
  '..HM.............HM.....',
  '...MMMMMMMMMMMMMMM......',
]

/**
 * The upper loop and the face (columns 0 to 15, rows 0 to 6) moved `left`
 * columns to the left and `down` rows lower: a lean or a slump. The long
 * right-hand run stays where it is.
 */
function bend(rows: readonly string[], left: number, down: number): string[] {
  const out = [...rows]
  for (let y = 0; y <= 6 + down; y++) {
    const src = rows[y - down]
    const head = src === undefined ? '.'.repeat(16) : src.slice(left, 16) + '.'.repeat(left)
    out[y] = head + (rows[y] ?? '').slice(16)
  }
  return out
}

const SHUT: [number, number, string][] = [[3, 6, 'F'], [3, 9, 'F'], [4, 5, 'OO'], [4, 9, 'OO']]
const SMALL_MOUTH: [number, number, string][] = [[6, 7, 'TT']]
const BIG_MOUTH: [number, number, string][] = [[5, 6, 'OTTO'], [6, 7, 'TT']]

export const KAPOCS: Skin = {
  id: 'kapocs',
  label: 'Kapocs, a segítőkész gemkapocs',
  aliases: ['gemkapocs', 'gémkapocs', 'paperclip', 'clip', 'paper clip'],
  palette: {
    H: [0xe6, 0xea, 0xf0], // wire, lit side
    M: [0xa8, 0xb0, 0xbe], // wire, shaded side
    F: [0xff, 0xf6, 0xe8], // face
    K: [0x1c, 0x1e, 0x26], // eyes
    W: [0xff, 0xff, 0xff], // teeth
    P: [0xf4, 0xa6, 0xb4], // blush
    T: [0xe8, 0x78, 0x87], // tongue
    O: [0x48, 0x50, 0x5e], // outline, mouth, lids
  },
  poses: {
    awake: CLIP,
    blink: edits(CLIP, ...SHUT),
    // Mouth open: "Kling!"
    bark: edits(CLIP, ...SMALL_MOUTH),
    yawn: edits(CLIP, ...SHUT, ...BIG_MOUTH),
    // The top bends over and sags, eyes cast down.
    droop: bend(edits(CLIP, [3, 6, 'F'], [3, 9, 'F']), 1, 1),
    // A happy sway to the left, mouth open.
    wag: bend(edits(CLIP, ...SMALL_MOUTH), 1, 0),
    // Eyes dart to the left.
    sniff: edits(CLIP, [3, 5, 'KF'], [4, 5, 'KF'], [3, 8, 'KF'], [4, 8, 'KF']),
    // Slanted cross eyes, a tight mouth.
    growl: edits(CLIP, [3, 5, 'KF'], [4, 5, 'FK'], [3, 9, 'FK'], [4, 9, 'KF'], [5, 6, 'OOOO']),
    // Heavy lids, a flat mouth, slumped a row lower.
    tired: bend(edits(CLIP, [3, 5, 'OO'], [3, 9, 'OO']), 0, 1),
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
