import { describe, expect, mock, test } from 'claude-code/testing'

import { setLang } from '../hooks/i18n'

import {
  article,
  budapest,
  formatDuration,
  guardReason,
  isDeployCommand,
  isTestCommand,
  judge,
  POSES,
  resetPhrase,
  shouldBark,
  SPRITE_COLUMNS,
  SPRITE_ROWS,
  spriteSvg,
  writeParts,
} from '../hooks/logic'

const HU = { options: { language: 'hu', guardDashes: true } } as const
setLang('hu')

const five = (p: number, resetsAt?: string) => ({ kind: 'five_hour', percentUsed: p, resetsAt })
const week = (p: number) => ({ kind: 'seven_day', percentUsed: p })

// 2026-10-03 12:00 Budapest (summer time, UTC+2).
const NOON = Date.parse('2026-10-03T10:00:00Z')

const EM = String.fromCharCode(0x2014)
const EN = String.fromCharCode(0x2013)
const HU_OPEN = String.fromCharCode(0x201e)
const HU_CLOSE = String.fromCharCode(0x201d)
const ROCKET = String.fromCodePoint(0x1f680)

// session.measure needs a context; the mod reads its percent and rateLimits.
const measure = (rateLimits: { kind: string; percentUsed: number; resetsAt?: string }[], percent?: number) =>
  ({ context: { window: 200000, percent }, rateLimits, changed: ['rateLimits', 'context'] }) as never

// What the engine would answer beneath the plugin.
const stubEngine = (on: any, opts: { toolError?: boolean } = {}) => {
  const clock = mock.clock(on, { now: NOON })
  mock.store(on)
  on('ui.render', () => null)
  on('session.measure', (_$: unknown, e: { changed: string[] }) => ({ changed: e.changed }))
  on('ui.toast', () => ({}))
  on('tool.call', () => (opts.toolError ? { isError: true, result: 'boom', text: 'boom' } : { result: 'ran', text: 'ran' }))
  on('prompt.submit', (_$: unknown, e: { text: string }) => ({ text: e.text }))
  return clock
}

const BAND = {
  plugin: 'zsemle',
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: false, maxRows: 20, bodyColumns: 100 },
} as const

const bash = (command: string, id: string) => ({ tool: 'Bash', command, tool_use_id: id }) as never

describe('logic', () => {
  test('verdict levels follow the 50, 75, 90 and 95 thresholds', async () => {
    expect(judge([], NOON).level).toBe('none')
    expect(judge([five(49.9), week(10)], NOON).level).toBe('ok')
    expect(judge([five(50), week(10)], NOON).level).toBe('warn')
    expect(judge([five(20), week(74.9)], NOON).level).toBe('warn')
    expect(judge([five(20), week(75)], NOON).level).toBe('high')
    expect(judge([five(90), week(10)], NOON).level).toBe('critical')
    expect(judge([five(20), week(94.9)], NOON).level).toBe('critical')
    expect(judge([five(20), week(95)], NOON).level).toBe('stop')
    expect(judge([{ kind: 'spend_limit', percentUsed: 103 }], NOON).message).toContain('Túllépted a költési limitet (103%)')
  })

  test('messages name the worst window, the right article and the reset time', async () => {
    expect(judge([five(62, '2026-10-03T12:20:00Z'), week(40)], NOON).message).toBe(
      'Figyelem: elérted az 5 órás limit 50%-át (62%). Visszaáll 14:20-kor.',
    )
    expect(judge([five(10), week(51)], NOON).message).toBe('Figyelem: elérted a heti limit 50%-át (51%).')
    expect(judge([five(96)], NOON).message).toContain('95%-át (96%). Leállítottam')
    expect(judge([five(62), week(40)], NOON).status).toBe('5ó 62% · hét 40%')
    expect(article('5 órás')).toBe('az')
    expect(article('heti')).toBe('a')
  })

  test('Budapest time handles summer and winter time', async () => {
    expect(budapest(Date.parse('2026-07-01T10:00:00Z')).hm).toBe('12:00')
    expect(budapest(Date.parse('2026-12-01T10:00:00Z')).hm).toBe('11:00')
    // DST ends on the last Sunday of October 2026, the 25th, at 01:00 UTC.
    expect(budapest(Date.parse('2026-10-25T00:30:00Z')).hm).toBe('02:30')
    expect(budapest(Date.parse('2026-10-25T01:30:00Z')).hm).toBe('02:30')
    expect(resetPhrase('2026-10-04T07:05:00Z', NOON)).toBe('holnap 09:05-kor')
    expect(resetPhrase('2026-10-05T12:20:00Z', NOON)).toBe('hétfőn 14:20-kor')
    expect(resetPhrase(undefined, NOON)).toBeNull()
  })

  test('the guard catches dashes, JS quote delimiters, emoji in code and secrets', async () => {
    expect(guardReason('a.md', `szia ${EM} hello`)).toContain('gondolatjel')
    expect(guardReason('a.md', `100${EN}900`)).toContain('gondolatjel')
    expect(guardReason('a.html', 'x &mdash; y')).toContain('gondolatjel')
    expect(guardReason('a.md', 'sima - kötőjel')).toBeNull()
    // Keeping an existing dash while editing around it is fine.
    expect(guardReason('a.md', `uj ${EM} sor`, `regi ${EM} sor`)).toBeNull()
    expect(guardReason('a.ts', `const t = ${HU_OPEN}szia${HU_CLOSE}`)).toContain('idézőjel')
    expect(guardReason('a.ts', `const t = 'Ez ${HU_OPEN}idézet${HU_CLOSE} a szövegben'`)).toBeNull()
    expect(guardReason('a.ts', `// launch ${ROCKET}`)).toContain('emoji')
    expect(guardReason('notes.md', `launch ${ROCKET}`)).toBeNull()
    expect(guardReason('a.ts', 'const k = "sk-ant-abcdefghijklmnopqrstuvwx"')).toContain('Anthropic')
    expect(guardReason('.env.local', 'ANTHROPIC_API_KEY=sk-ant-abcdefghijklmnopqrstuvwx')).toBeNull()
    expect(guardReason('a.ts', 'const ok = "♥ ◀"')).toBeNull()
  })

  test('writeParts reads every file-writing tool', async () => {
    expect(writeParts('Write', { file_path: 'a', content: 'x' })).toEqual({ path: 'a', added: 'x', removed: '' })
    expect(writeParts('Edit', { file_path: 'a', new_string: 'n', old_string: 'o' })?.removed).toBe('o')
    expect(writeParts('MultiEdit', { file_path: 'a', edits: [{ new_string: 'n1' }, { new_string: 'n2' }] })?.added).toBe('n1\nn2')
    expect(writeParts('Bash', { command: 'ls' })).toBeNull()
  })

  test('commands are recognised as tests or deploys', async () => {
    expect(isTestCommand('npm test')).toBe(true)
    expect(isTestCommand('npx vitest run')).toBe(true)
    expect(isTestCommand('claude plugin test ./zsemle')).toBe(true)
    expect(isTestCommand('npm run build')).toBe(false)
    expect(isDeployCommand('npx wrangler deploy')).toBe(true)
    expect(isDeployCommand('wrangler pages deploy dist')).toBe(true)
    expect(isDeployCommand('vercel --prod')).toBe(true)
    expect(isDeployCommand('vercel env pull')).toBe(false)
    expect(isDeployCommand('wrangler dev')).toBe(false)
  })

  test('bark only after a finished answer of 3 minutes or more', async () => {
    expect(shouldBark(180000, 'answer')).toBe(true)
    expect(shouldBark(179999, 'answer')).toBe(false)
    expect(shouldBark(600000, 'aborted')).toBe(false)
    expect(formatDuration(221000)).toBe('3p 41mp')
  })

  test('the sprite is 40% smaller and every pose shares its size', async () => {
    expect(SPRITE_COLUMNS).toBe(14)
    expect(SPRITE_ROWS).toBe(7)
    for (const rows of Object.values(POSES)) {
      expect(rows.length).toBe(14)
      for (const row of rows) expect(row.length).toBe(SPRITE_COLUMNS * 2)
    }
    const all = new Set(Object.values(POSES).map(rows => rows.join('\n')))
    expect(all.size).toBe(Object.keys(POSES).length)
  })
})

describe('engine', () => {
  test('the bubble shows the warning with its reset time on every surface', HU, async ($, on) => {
    stubEngine(on)
    // Reset in half an hour: at this pace the window lasts, so the warning itself shows.
    await $.session.measure(measure([five(62, '2026-10-03T10:30:00Z'), week(40)]))
    for (const surface of ['terminal', 'desktop'] as const) {
      const ui = await $.ui.mount({ ...BAND, surface } as never)
      expect(await ui.find({ type: 'Text', text: /50%-át \(62%\)\. Visszaáll 12:30-kor/ })).toBeDefined()
      await ui.unmount()
    }
  })

  test('at 95% tool calls and prompts stop until /zsemle ebreszt', HU, async ($, on) => {
    stubEngine(on)
    await $.session.measure(measure([five(30), week(96)]))
    const denied = await $.tool.call(bash('ls', 't1'))
    expect(String(denied.deny ?? denied.text)).toContain('Zsemle leállította')
    const dropped = await $.prompt.submit({ text: 'folytasd' } as never)
    expect('drop' in dropped && String(dropped.drop)).toContain('Zsemle alszik')
    await $.command.run({ command: 'zsemle', args: 'ebreszt' } as never)
    const ran = await $.tool.call(bash('ls', 't2'))
    expect(ran.deny).toBeUndefined()
  })

  test('the guard growls at an em dash write and lets a clean one through', HU, async ($, on) => {
    stubEngine(on)
    const bad = await $.tool.call({ tool: 'Write', file_path: 'C:/x/a.md', content: `a ${EM} b`, tool_use_id: 'w1' } as never)
    expect(String(bad.deny ?? bad.text)).toContain('Zsemle morog')
    const ui = await $.ui.mount({ ...BAND, surface: 'terminal' } as never)
    expect(await ui.find({ type: 'Text', text: /Grrr!/ })).toBeDefined()
    await ui.unmount()
    const good = await $.tool.call({ tool: 'Write', file_path: 'C:/x/a.md', content: 'a - b', tool_use_id: 'w2' } as never)
    expect(good.deny).toBeUndefined()
    await $.command.run({ command: 'zsemle', args: 'or ki' } as never)
    const off = await $.tool.call({ tool: 'Write', file_path: 'C:/x/a.md', content: `a ${EM} b`, tool_use_id: 'w3' } as never)
    expect(off.deny).toBeUndefined()
  })

  test('a deploy makes Zsemle sniff and remind the model to check the live state', HU, async ($, on) => {
    stubEngine(on)
    const ran = await $.tool.call(bash('npx wrangler deploy', 'd1'))
    expect((ran as { context?: string[] }).context?.join(' ')).toContain('kérdezd vissza az élő állapotot')
    const ui = await $.ui.mount({ ...BAND, surface: 'terminal' } as never)
    expect(await ui.find({ type: 'Text', text: /Szimat!/ })).toBeDefined()
    await ui.unmount()
  })

  test('the same failing command three times in a row is called out', HU, async ($, on) => {
    stubEngine(on, { toolError: true })
    await $.tool.call(bash('npm run build', 'f1'))
    const second = await $.tool.call(bash('npm run build', 'f2'))
    expect((second as { context?: string[] }).context ?? []).toEqual([])
    const third = await $.tool.call(bash('npm run build', 'f3'))
    expect((third as { context?: string[] }).context?.join(' ')).toContain('gyökérokot')
  })

  test('quiet when all is well; a body click pets, a head double click hides the bubble', HU, async ($, on) => {
    stubEngine(on)
    const ui = await $.ui.mount({ plugin: 'zsemle', surface: 'terminal', component: 'AbovePrompt', props: BAND.props as never })
    // All is well: the dog sits there without a bubble.
    expect(await ui.find({ key: 'bubble' })).toBeUndefined()
    // A click on the body pets him: hearts and the bubble with its buttons.
    await ui.pointer({ type: 'down', x: 6, y: 5, button: 'left' })
    expect(await ui.find({ type: 'Text', text: /Köszi a simit/ })).toBeDefined()
    await ui.press({ key: 'mute' })
    expect((await ui.find({ key: 'mute' }))?.text).toBe('hang')
    // A double click on the head: "oké, értettem".
    await ui.pointer({ type: 'down', x: 3, y: 1, button: 'left' })
    await ui.pointer({ type: 'down', x: 3, y: 1, button: 'left' })
    expect(await ui.find({ key: 'bubble' })).toBeUndefined()
    await ui.unmount()
    const unmute = await $.command.run({ command: 'zsemle', args: 'hang' } as never)
    expect(String((unmute as { text?: string }).text)).toContain('újra hangosan')
    await $.tool.call(bash('ls', 's1'))
    const stat = await $.command.run({ command: 'zsemle', args: 'stat' } as never)
    expect(String((stat as { text?: string }).text)).toContain('simogatás:        1')
    expect(String((stat as { text?: string }).text)).toContain('tool-hívások:     1')
  })

  test('an acknowledged warning stays hidden until a new message comes', HU, async ($, on) => {
    stubEngine(on)
    await $.session.measure(measure([five(62), week(40)]))
    const ui = await $.ui.mount({ ...BAND, surface: 'terminal' } as never)
    expect(await ui.find({ key: 'bubble' })).toBeDefined()
    await ui.press({ key: 'ok' })
    expect(await ui.find({ key: 'bubble' })).toBeUndefined()
    await ui.unmount()
    // A higher reading of the same window stays quiet...
    await $.session.measure(measure([five(70), week(40)]))
    const same = await $.ui.mount({ ...BAND, surface: 'terminal' } as never)
    expect(await same.find({ key: 'bubble' })).toBeUndefined()
    await same.unmount()
    // ...a deploy is news again.
    await $.tool.call(bash('npx wrangler deploy', 'd2'))
    const news = await $.ui.mount({ ...BAND, surface: 'terminal' } as never)
    expect(await news.find({ type: 'Text', text: /Szimat!/ })).toBeDefined()
    await news.unmount()
  })

  test('after 20 idle minutes Zsemle sleeps, a prompt wakes it', HU, async ($, on) => {
    const clock = stubEngine(on)
    await $.prompt.submit({ text: 'hello' } as never)
    await clock.advance(21 * 60 * 1000)
    const sleeping = await $.ui.mount({ ...BAND, surface: 'terminal' } as never)
    expect(await sleeping.find({ type: 'Text', text: /Alszom/ })).toBeDefined()
    await sleeping.unmount()
    await $.prompt.submit({ text: 'ebren vagy?' } as never)
    const awake = await $.ui.mount({ ...BAND, surface: 'terminal' } as never)
    expect(await awake.find({ type: 'Text', text: /Alszom/ })).toBeUndefined()
    await awake.unmount()
  })

  test('high context makes Zsemle suggest /compact', HU, async ($, on) => {
    stubEngine(on)
    await $.session.measure(measure([five(10)], 84))
    const ui = await $.ui.mount({ ...BAND, surface: 'terminal' } as never)
    expect(await ui.find({ type: 'Text', text: /\/compact/ })).toBeDefined()
    await ui.unmount()
  })
})

describe('spriteSvg', () => {
  test('covers every opaque pixel at 1 x 2 units and nothing transparent', () => {
    for (const pose of Object.keys(POSES) as (keyof typeof POSES)[]) {
      const rows = POSES[pose]
      const svg = spriteSvg(pose)
      expect(svg).toContain(`viewBox="0 0 ${SPRITE_COLUMNS * 2} ${rows.length * 2}"`)
      const covered = new Set<string>()
      for (const m of svg.matchAll(/<rect x="(\d+)" y="(\d+)" width="(\d+)" height="2"/g)) {
        const [x, y, w] = [Number(m[1]), Number(m[2]) / 2, Number(m[3])]
        for (let i = x; i < x + w; i++) covered.add(`${i},${y}`)
      }
      const opaque = rows.flatMap((row, y) => [...row].flatMap((c, x) => (c === '.' ? [] : [`${x},${y}`])))
      expect(covered.size).toBe(opaque.length)
      for (const k of opaque) expect(covered.has(k)).toBe(true)
    }
  })
})
