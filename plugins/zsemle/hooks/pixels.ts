// The pieces every skin is built from: poses, the grid, voices and the
// helpers that derive one pose from another. No `$` here.

export type Pose = 'awake' | 'blink' | 'bark' | 'yawn' | 'droop' | 'wag' | 'sniff' | 'growl'

export const POSE_NAMES: readonly Pose[] = ['awake', 'blink', 'bark', 'yawn', 'droop', 'wag', 'sniff', 'growl']

/** A skin's id: the built-in ones and any in extra-skins.ts. */
export type SkinId = string

export type Voice = {
  /** The figure's own name, as it signs its messages. */
  name: string
  /** A short call when a long turn finishes ("Vau!"). */
  bark: string
  /** The warning sound before a blocked write ("Grrr!"). */
  growl: string
  /** Shown while a green test run is celebrated. */
  happy: string
  /** Shown after a pet. */
  pet: string
  /** The deploy reminder's first word ("Szimat!"). */
  sniff: string
  /** Asleep. */
  snore: string
  /** The sound asset played on a bark, relative to the mod root. */
  sound: string
  /** Alt text for the desktop drawing. */
  alt: string
}

export type Skin = {
  id: SkinId
  /** What the picker and `/zsemle skin` list show, in Hungarian and in English. */
  label: string
  labelEn: string
  /** Other words `/zsemle skin <word>` accepts. */
  aliases: readonly string[]
  palette: Readonly<Record<string, readonly [number, number, number]>>
  poses: Readonly<Record<Pose, readonly string[]>>
  voice: Voice
  voiceEn: Voice
}

export const WIDTH = 24
export const HEIGHT = 12

function patch(rows: readonly string[], y: number, x: number, text: string): string[] {
  const out = [...rows]
  const row = out[y] ?? ''
  out[y] = row.slice(0, x) + text + row.slice(x + text.length)
  return out
}

/** The grid with each [row, column, text] written over it. */
export function edits(rows: readonly string[], ...changes: [number, number, string][]): string[] {
  return changes.reduce<string[]>((acc, [y, x, t]) => patch(acc, y, x, t), [...rows])
}

/** The grid moved down by `n` rows, the top filled with transparency (a squash or a crouch). */
export function lower(rows: readonly string[], n: number): string[] {
  return [...Array.from({ length: n }, () => '.'.repeat(WIDTH)), ...rows.slice(0, rows.length - n)]
}
