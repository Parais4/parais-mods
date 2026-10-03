import { describe, expect, mock, test } from 'claude-code/testing'

import { parseOffset, setLang } from '../hooks/i18n'

import {
  apiErrorNote,
  costCrossed,
  crossings,
  forecast,
  paceNote,
  posesOf,
  resets,
  shortModel,
  SPRITE_COLUMNS,
  SPRITE_ROWS,
  spriteRuns,
  spriteSvg,
} from '../hooks/logic'
import { findSkin, HEIGHT, nextSkin, POSE_NAMES, SKIN_IDS, skinOf, WIDTH } from '../hooks/skins'

const HU = { options: { language: 'hu', guardDashes: true } } as const
setLang('hu')

// 2026-10-03 12:00 Budapest (summer time, UTC+2).
const NOON = Date.parse('2026-10-03T10:00:00Z')
const HOUR = 3600 * 1000

const five = (p: number, resetsAt?: string) => ({ kind: 'five_hour', percentUsed: p, resetsAt })
const week = (p: number, resetsAt?: string) => ({ kind: 'seven_day', percentUsed: p, resetsAt })
const iso = (ms: number) => new Date(ms).toISOString()

const measure = (
  rateLimits: { kind: string; percentUsed: number; resetsAt?: string }[],
  extra: { percent?: number; usd?: number; changed?: string[] } = {},
) =>
  ({
    context: { window: 200000, percent: extra.percent },
    rateLimits,
    cost: extra.usd === undefined ? undefined : { usd: extra.usd },
    changed: extra.changed ?? ['rateLimits', 'context'],
  }) as never

const BAND = {
  plugin: 'zsemle',
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: false, maxRows: 20, bodyColumns: 100 },
} as const

// The engine beneath the plugin; toasts are collected so a test can read them.
const stubEngine = (on: any) => {
  const clock = mock.clock(on, { now: NOON })
  mock.store(on)
  const toasts: string[] = []
  on('ui.render', () => null)
  on('session.measure', (_$: unknown, e: { changed: string[] }) => ({ changed: e.changed }))
  on('ui.toast', (_$: unknown, e: { text: string }) => {
    toasts.push(e.text)
    return { value: undefined } as never
  })
  on('classic.StopFailure', () => ({}))
  on('classic.PostModelSwitch', () => ({}))
  on('ui.open', () => ({ value: { isPlaced: true } }) as never)
  on('tool.call', () => ({ result: 'ran', text: 'ran' }))
  on('prompt.submit', (_$: unknown, e: { text: string }) => ({ text: e.text }))
  on('turn.complete', (_$: unknown, e: { answer: string }) => ({ text: e.answer }))
  return { clock, toasts }
}

const textOf = (r: unknown) => String((r as { text?: string }).text ?? '')

describe('skins', () => {
  test('every skin draws every pose on the same 24 x 12 grid, in its own colors', () => {
    expect(SKIN_IDS.slice(0, 4)).toEqual(['zsemle', 'cirmi', 'trutyi', 'kapocs'])
    for (const id of SKIN_IDS) {
      const skin = skinOf(id)
      expect(skin.palette.O).toBeDefined()
      for (const pose of POSE_NAMES) {
        const rows = skin.poses[pose]
        expect(rows.length).toBe(HEIGHT)
        for (const row of rows) {
          expect(row.length).toBe(WIDTH)
          for (const c of row) expect(c === '.' || c in skin.palette).toBe(true)
        }
      }
      // A pose that looks like another one would not move.
      const looks = new Set(POSE_NAMES.map(p => skin.poses[p].join('\n')))
      expect(looks.size).toBe(POSE_NAMES.length)
      // Outlined and padded: the size the band reserves.
      expect(posesOf(id).awake.length).toBe(SPRITE_ROWS * 2)
      expect(posesOf(id).awake[0]?.length).toBe(SPRITE_COLUMNS * 2)
      expect(spriteRuns('awake', id).length).toBe(SPRITE_ROWS)
    }
    const svgs = new Set(SKIN_IDS.map(id => spriteSvg('awake', id)))
    expect(svgs.size).toBe(SKIN_IDS.length)
  })

  test('a skin is found by its id, name or an alias, accents and case aside', () => {
    expect(findSkin('macska')).toBe('cirmi')
    expect(findSkin('Gémkapocs')).toBe('kapocs')
    expect(findSkin('SLIME')).toBe('trutyi')
    expect(findSkin('kutya')).toBe('zsemle')
    expect(findSkin('unikornis')).toBeNull()
    expect(nextSkin(SKIN_IDS[SKIN_IDS.length - 1]!)).toBe('zsemle')
    expect(nextSkin('zsemle')).toBe('cirmi')
  })
})

describe('limit logic', () => {
  test('a rise past a threshold names the highest one passed', () => {
    expect(crossings([five(40)], [five(80)])).toEqual([{ limit: five(80), threshold: 75 }])
    expect(crossings([five(49)], [five(50)])[0]?.threshold).toBe(50)
    expect(crossings([five(91)], [five(93)])).toEqual([])
    expect(crossings([], [week(96)])[0]?.threshold).toBe(95)
  })

  test('a big drop or a later reset time is a reset', () => {
    expect(resets([five(80)], [five(5)]).length).toBe(1)
    expect(resets([five(30)], [five(28)]).length).toBe(0)
    expect(resets([five(30, iso(NOON + HOUR))], [five(25, iso(NOON + 5 * HOUR))]).length).toBe(1)
    expect(resets([], [five(5)]).length).toBe(0)
  })

  test('the pace forecast speaks only when the window runs out before its reset', () => {
    // 60% used in the first hour of five: empty in 40 minutes, reset in 4 hours.
    const fast = forecast(five(60, iso(NOON + 4 * HOUR)), NOON)
    expect(fast).not.toBeNull()
    expect(paceNote(fast!, NOON)).toContain('kb. 12:40-kor elfogy')
    expect(paceNote(fast!, NOON)).toContain('csak 16:00-kor áll vissza')
    // 60% used in four and a half hours: lasts.
    expect(forecast(five(60, iso(NOON + HOUR / 2)), NOON)).toBeNull()
    // Too early in the window, or too little used, to say.
    expect(forecast(five(30, iso(NOON + 4.8 * HOUR)), NOON)).toBeNull()
    expect(forecast(five(20, iso(NOON + 3 * HOUR)), NOON)).toBeNull()
    // A window of unknown length has no forecast.
    expect(forecast({ kind: 'spend_limit', percentUsed: 80, resetsAt: iso(NOON + HOUR) }, NOON)).toBeNull()
  })

  test('API errors, model ids and cost steps read plainly', () => {
    expect(apiErrorNote('rate_limit').isSevere).toBe(true)
    expect(apiErrorNote('max_output_tokens').message).toContain('kimeneti token-limit')
    expect(apiErrorNote('overloaded').isSevere).toBe(false)
    expect(apiErrorNote('valami_uj').message).toContain('valami_uj')
    expect(shortModel('claude-opus-5-5-20260101')).toBe('opus-5-5')
    expect(shortModel('claude-sonnet-5-5[1m]')).toBe('sonnet-5-5')
    expect(costCrossed(4.5, 5.2)).toBe(5)
    expect(costCrossed(0.5, 12)).toBe(10)
    expect(costCrossed(5.2, 6)).toBeNull()
  })
})

describe('skin engine', () => {
  test('/zsemle skin switches the figure on the terminal and the desktop alike', HU, async ($, on) => {
    stubEngine(on)
    const r = await $.command.run({ command: 'zsemle', args: 'skin macska' } as never)
    expect(textOf(r)).toContain('Cirmi lett a társad')
    const desk = await $.ui.mount({ ...BAND, surface: 'desktop' } as never)
    expect((await desk.find({ type: 'Svg' }))?.props.alt).toBe('Cirmi, a szürke cirmos cica')
    await desk.unmount()
    const term = await $.ui.mount({ ...BAND, surface: 'terminal' } as never)
    const figure = await term.find({ type: 'Client' })
    expect(JSON.stringify(figure?.props)).toContain('#a7a9b0')
    await term.unmount()
    const bad = await $.command.run({ command: 'zsemle', args: 'skin unikornis' } as never)
    expect(textOf(bad)).toContain('Nincs ilyen figura')
  })

  test('the picker shows every figure and a press wears it, on both surfaces', HU, async ($, on) => {
    stubEngine(on)
    for (const surface of ['terminal', 'desktop'] as const) {
      const pane = await $.ui.mount({
        plugin: 'zsemle',
        surface,
        component: 'Pane',
        requestId: 'zsemle-skins',
        props: { title: 'Zsemle figurák', isFocused: true, bodyColumns: 90, placement: 'inline' },
      } as never)
      for (const id of SKIN_IDS) expect(await pane.find({ key: `skin-${id}` })).toBeDefined()
      await pane.press({ key: 'skin-kapocs' })
      expect((await pane.find({ key: 'skin-kapocs' }))?.props.label).toBe('[Kapocs]')
      await pane.press({ key: 'skin-zsemle' })
      await pane.unmount()
    }
  })

  test('the voice follows the figure: a pet on the slime says its own line', HU, async ($, on) => {
    stubEngine(on)
    await $.command.run({ command: 'zsemle', args: 'skin slime' } as never)
    const r = await $.command.run({ command: 'zsemle', args: 'simi' } as never)
    expect(textOf(r)).toContain('Trutyi: Ragacsos köszi!')
  })
})

describe('limit engine', () => {
  test('crossing 75% toasts, and the bubble says the window is three quarters gone', HU, async ($, on) => {
    const { toasts } = stubEngine(on)
    await $.session.measure(measure([five(40, iso(NOON + 30 * 60 * 1000)), week(20)]))
    await $.session.measure(measure([five(78, iso(NOON + 30 * 60 * 1000)), week(20)]))
    expect(toasts.join(' ')).toContain('Az 5 órás limit 75%-a elfogyott (78%, visszaáll 12:30-kor)')
    const ui = await $.ui.mount({ ...BAND, surface: 'terminal' } as never)
    expect(await ui.find({ type: 'Text', text: /75%-ánál tartunk \(78%\)/ })).toBeDefined()
    await ui.unmount()
  })

  test('at 90% the bubble turns red and warns of the stop', HU, async ($, on) => {
    stubEngine(on)
    await $.session.measure(measure([five(20), week(92)]))
    const ui = await $.ui.mount({ ...BAND, surface: 'desktop' } as never)
    const t = await ui.find({ type: 'Text', text: /Majdnem elfogyott a heti limit: 92%/ })
    expect(t?.props.color).toBe('red')
    await ui.unmount()
  })

  test('a fast pace is foretold once per window', HU, async ($, on) => {
    const { toasts } = stubEngine(on)
    const reset = iso(NOON + 4 * HOUR)
    await $.session.measure(measure([five(60, reset)]))
    await $.session.measure(measure([five(62, reset)]))
    expect(toasts.filter(t => t.includes('Ezzel a tempóval')).length).toBe(1)
    const ui = await $.ui.mount({ ...BAND, surface: 'terminal' } as never)
    expect(await ui.find({ type: 'Text', text: /Ezzel a tempóval az 5 órás limit/ })).toBeDefined()
    await ui.unmount()
  })

  test('a reset is celebrated', HU, async ($, on) => {
    const { toasts } = stubEngine(on)
    await $.session.measure(measure([five(88)]))
    await $.session.measure(measure([five(2)]))
    expect(toasts.join(' ')).toContain('Visszaállt az 5 órás limit (most 2%). Tele a tank!')
  })

  test('an API error that ended the turn is explained', HU, async ($, on) => {
    const { toasts } = stubEngine(on)
    await $.classic.StopFailure({ error: 'rate_limit' } as never)
    expect(toasts.join(' ')).toContain('elfogyott a használati keret')
    const ui = await $.ui.mount({ ...BAND, surface: 'terminal' } as never)
    const t = await ui.find({ type: 'Text', text: /rate limit/ })
    expect(t?.props.color).toBe('red')
    await ui.unmount()
  })

  test('an automatic model switch is told, a chosen one is not', HU, async ($, on) => {
    const { toasts } = stubEngine(on)
    await $.classic.PostModelSwitch({ source: 'command', from_model: 'claude-opus-5-5', to_model: 'claude-sonnet-5-5' } as never)
    expect(toasts.join(' ')).not.toContain('modellváltás')
    await $.classic.PostModelSwitch({ source: 'auto', from_model: 'claude-opus-5-5', to_model: 'claude-sonnet-5-5' } as never)
    expect(toasts.join(' ')).toContain('Automatikus modellváltás: opus-5-5 helyett most sonnet-5-5')
  })

  test('at 90% context a toast warns of the coming auto-compact, once', HU, async ($, on) => {
    const { toasts } = stubEngine(on)
    await $.session.measure(measure([five(10)], { percent: 91 }))
    await $.session.measure(measure([five(10)], { percent: 93 }))
    expect(toasts.filter(t => t.includes('hamarosan automatikus tömörítés')).length).toBe(1)
  })

  test('off a subscription the cost milestones speak up', HU, async ($, on) => {
    const { toasts } = stubEngine(on)
    await $.session.measure(measure([], { usd: 0.8, changed: ['cost'] }))
    await $.session.measure(measure([], { usd: 5.4, changed: ['cost'] }))
    expect(toasts.join(' ')).toContain('átlépte a 5 dollárt (most 5.40 $)')
    const r = await $.command.run({ command: 'zsemle', args: 'limit' } as never)
    expect(textOf(r)).toContain('költség:       5.40 $')
  })

  test('/zsemle limit lists every window with its pace', HU, async ($, on) => {
    stubEngine(on)
    await $.session.measure(measure([five(60, iso(NOON + 4 * HOUR)), week(30)], { percent: 40 }))
    const r = await $.command.run({ command: 'zsemle', args: 'limit' } as never)
    expect(textOf(r)).toContain('5ó 60%')
    expect(textOf(r)).toContain('hét 30%')
    expect(textOf(r)).toContain('Ezzel a tempóval')
    expect(textOf(r)).toContain('kontextus:     40%')
  })
})

describe('english', () => {
  const EN = { options: { language: 'en' } } as const

  test('offsets read from date and PowerShell', () => {
    expect(parseOffset('+0200')).toBe(2 * HOUR)
    expect(parseOffset('-05:00\r\n')).toBe(-5 * HOUR)
    expect(parseOffset('+05:30')).toBe(5.5 * HOUR)
    expect(parseOffset('garbage')).toBeNull()
  })

  test('messages, commands and voices speak English', EN, async ($, on) => {
    const { toasts } = stubEngine(on)
    on('process.run', () => ({ value: { exitCode: 0, stdout: '+0200', stderr: '' } }) as never)
    await $.session.measure(measure([five(40, iso(NOON + 30 * 60 * 1000)), week(20)]))
    await $.session.measure(measure([five(78, iso(NOON + 30 * 60 * 1000)), week(20)]))
    expect(toasts.join(' ')).toContain('The 5-hour limit passed 75% (78%')
    const ui = await $.ui.mount({ ...BAND, surface: 'desktop' } as never)
    expect(await ui.find({ type: 'Text', text: /We are past 75% of the 5-hour limit \(78%\)/ })).toBeDefined()
    await ui.unmount()
    const skin = await $.command.run({ command: 'zsemle', args: 'skin cat' } as never)
    expect(textOf(skin)).toContain('Cirmi is your companion now: Cirmi, the grey tabby cat.')
    const petted = await $.command.run({ command: 'zsemle', args: 'pet' } as never)
    expect(textOf(petted)).toBe('Cirmi: Purr, thanks!')
    const report = await $.command.run({ command: 'zsemle', args: 'limits' } as never)
    expect(textOf(report)).toContain("Cirmi's limit report:")
    expect(textOf(report)).toContain('5h 78%')
  })

  test('the dash rule is off unless guardDashes is set; secrets are caught in any language', EN, async ($, on) => {
    stubEngine(on)
    const dash = await $.tool.call({ tool: 'Write', file_path: 'C:/x/a.md', content: `a ${String.fromCharCode(0x2014)} b`, tool_use_id: 'en1' } as never)
    expect(dash.deny).toBeUndefined()
    const key = 'sk-ant-' + 'a'.repeat(30)
    const secret = await $.tool.call({ tool: 'Write', file_path: 'C:/x/a.ts', content: `const k = '${key}'`, tool_use_id: 'en2' } as never)
    expect(String(secret.deny ?? secret.text)).toContain('An Anthropic API key would go into the file')
  })
})

describe('sounds', () => {
  test('every figure has its own sound file', () => {
    const sounds = SKIN_IDS.map(id => skinOf(id).voice.sound).filter(s => s !== 'sounds/chime.wav')
    expect(new Set(sounds).size).toBe(sounds.length)
    for (const id of SKIN_IDS) expect(skinOf(id).voiceEn.sound).toBe(skinOf(id).voice.sound)
  })
})
