import { describe, expect, mock, test } from 'claude-code/testing'

import {
  briefNote,
  dailyBudget,
  errorSignature,
  fatigueLevel,
  findFeature,
  isCommitCommand,
  isSimpleTask,
  parseProjectTable,
  weekChart,
} from '../hooks/features'
import { setLang } from '../hooks/i18n'
import { MINI_COLUMNS, MINI_ROWS, miniRuns, spriteRuns } from '../hooks/logic'

const HU = { options: { language: 'hu', guardDashes: true } } as const
setLang('hu')

// 2026-10-03 12:00 Budapest (summer time, UTC+2).
const NOON = Date.parse('2026-10-03T10:00:00Z')
const HOUR = 3600 * 1000
const iso = (ms: number) => new Date(ms).toISOString()

const TABLE = [
  '| Projekt | Állapot | Frissítve | Stack-modulok | Blokkoló / határidő | Mi ez |',
  '|---|---|---|---|---|---|',
  '| [[Shop/INDEX\\|Bolt]] | deploy-var | 2026-10-01 | web | - | webshop |',
  '| [[Auto/HOME\\|Autó]] | blokkolt | 2026-09-28 | - | válaszok | levelek |',
  '| [[Kesz/HOME\\|Kész]] | el | 2026-10-01 | - | - | él |',
].join('\n')

const measure = (rateLimits: { kind: string; percentUsed: number; resetsAt?: string }[], percent?: number) =>
  ({ context: { window: 200000, percent }, rateLimits, changed: ['rateLimits', 'context'] }) as never

const BAND = {
  plugin: 'zsemle',
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: false, maxRows: 20, bodyColumns: 100 },
} as const

type Opts = { toolError?: boolean; errorText?: string; files?: Record<string, string>; answer?: string }

const stubEngine = (on: any, opts: Opts = {}) => {
  const clock = mock.clock(on, { now: NOON })
  mock.store(on)
  const toasts: string[] = []
  on('ui.render', () => null)
  on('session.measure', (_$: unknown, e: { changed: string[] }) => ({ changed: e.changed }))
  on('ui.toast', (_$: unknown, e: { text: string }) => {
    toasts.push(e.text)
    return { value: undefined } as never
  })
  on('ui.open', () => ({ value: { isPlaced: true } }) as never)
  on('tool.call', () =>
    opts.toolError ? { isError: true, result: opts.errorText ?? 'boom', text: opts.errorText ?? 'boom' } : { result: 'ran', text: 'ran' },
  )
  on('prompt.submit', (_$: unknown, e: { text: string; context?: string[] }) => ({ text: e.text, context: e.context }))
  on('turn.start', (_$: unknown, e: { turnId: string }) => ({ turnId: e.turnId }))
  on('turn.complete', (_$: unknown, e: { answer: string }) => ({ text: e.answer }))
  on('session.model', () => ({ value: 'claude-opus-5-5' }) as never)
  on('fs.read', (_$: unknown, e: { path: string }) => {
    const want = e.path.split(String.fromCharCode(92)).join('/')
    const text = Object.entries(opts.files ?? {}).find(([k]) => k === want)?.[1]
    return text === undefined ? { deny: 'missing' } : { value: text }
  })
  on('model.complete', () => ({ value: { isAnswered: true, text: opts.answer ?? 'Minden rendben.', usage: {} } }) as never)
  return { clock, toasts }
}

const contextOf = (r: unknown) => ((r as { context?: string[] }).context ?? []).join(' ')
const textOf = (r: unknown) => String((r as { text?: string }).text ?? '')
const bash = (command: string, id: string) => ({ tool: 'Bash', command, tool_use_id: id }) as never
const edit = (path: string, id: string) => ({ tool: 'Edit', file_path: path, old_string: 'a', new_string: 'b', tool_use_id: id }) as never

describe('feature logic', () => {
  test('fatigue follows the worst window', () => {
    expect(fatigueLevel([])).toBe(0)
    expect(fatigueLevel([{ kind: 'five_hour', percentUsed: 49 }])).toBe(0)
    expect(fatigueLevel([{ kind: 'five_hour', percentUsed: 10 }, { kind: 'seven_day', percentUsed: 80 }])).toBe(2)
    expect(fatigueLevel([{ kind: 'seven_day', percentUsed: 91 }])).toBe(3)
  })

  test('the weekly budget splits the rest over the days left', () => {
    // 40% used at the start of the day, 3 days left including today: 20% a day.
    const b = dailyBudget({ kind: 'seven_day', percentUsed: 52, resetsAt: iso(NOON + 2.5 * 24 * HOUR) }, 40, NOON - 12 * HOUR)
    expect(b?.daysLeft).toBe(3)
    expect(b?.allowance).toBe(20)
    expect(b?.usedToday).toBe(12)
  })

  test('simple tasks, commits, error signatures and feature names are recognised', () => {
    expect(isSimpleTask('nevezd át a foo változót barra')).toBe(true)
    expect(isSimpleTask('fix the typo in the README')).toBe(true)
    expect(isSimpleTask('tervezd meg az új fizetési rendszert')).toBe(false)
    expect(isCommitCommand('git add -A && git commit -m "x"')).toBe(true)
    expect(isCommitCommand('git -C repo commit -m x')).toBe(true)
    expect(isCommitCommand('git log --grep commit')).toBe(false)
    const a = errorSignature('Error: Cannot find module \'C:/x/a.ts\' at line 12')
    const b = errorSignature('Error: Cannot find module \'D:/y/b.ts\' at line 99')
    expect(a).toBe(b)
    expect(findFeature('commitor')).toBe('commitGuard')
    expect(findFeature('LoopWatch')).toBe('loopWatch')
    expect(findFeature('semmi')).toBeNull()
  })

  test('the project table and the brief list what waits', () => {
    const rows = parseProjectTable(TABLE)
    expect(rows.map(r => `${r.name}:${r.status}`)).toEqual(['Bolt:deploy-var', 'Autó:blokkolt', 'Kész:el'])
    const note = briefNote({ yesterday: 'Kész a 0.3.0.', projects: rows, budget: null, reflect: 2 })
    expect(note).toContain('Tegnapi napzáró: Kész a 0.3.0.')
    expect(note).toContain('Bolt (deploy-var)')
    expect(note).toContain('Autó (blokkolt: válaszok)')
    expect(note).not.toContain('Kész (el')
    expect(briefNote({ yesterday: null, projects: [], budget: null, reflect: 0 })).toBe('')
  })

  test('the weekly chart shades the hours and names the busiest one', () => {
    const hours = Array.from({ length: 24 }, (_, h) => (h === 10 ? 40 : h === 14 ? 5 : 0))
    const chart = weekChart([{ day: '2026-10-03', hours }])
    expect(chart).toContain('10-03')
    expect(chart).toContain('10:00 és 11:00 között')
    expect(chart).toContain('#')
  })
})

describe('feature engine', () => {
  test('the commit guard stops the first commit after an untested edit, lets the repeat through', HU, async ($, on) => {
    stubEngine(on)
    await $.tool.call(edit('C:/r/a.ts', 'e1'))
    const first = await $.tool.call(bash('git commit -m wip', 'c1'))
    expect(String(first.deny ?? first.text)).toContain('nem futott teszt')
    const again = await $.tool.call(bash('git commit -m wip', 'c2'))
    expect(again.deny).toBeUndefined()
    await $.tool.call(edit('C:/r/a.ts', 'e2'))
    await $.tool.call(bash('npm test', 't1'))
    const tested = await $.tool.call(bash('git commit -m next', 'c3'))
    expect(tested.deny).toBeUndefined()
  })

  test('a switched-off feature stays quiet', HU, async ($, on) => {
    stubEngine(on)
    const r = await $.command.run({ command: 'zsemle', args: 'kapcsolo commitor ki' } as never)
    expect(textOf(r)).toContain('kikapcsolva')
    await $.tool.call(edit('C:/r/a.ts', 'e1'))
    const commit = await $.tool.call(bash('git commit -m wip', 'c1'))
    expect(commit.deny).toBeUndefined()
    const list = await $.command.run({ command: 'zsemle', args: 'kapcsolok' } as never)
    expect(textOf(list)).toContain('ki  commitor')
  })

  test('the fifth edit of one file in a turn is called out', HU, async ($, on) => {
    stubEngine(on)
    await $.turn.start({ text: 'javítsd', turnId: 'T1' } as never)
    let last: unknown
    for (let i = 1; i <= 5; i++) last = await $.tool.call(edit('C:/r/loop.ts', `l${i}`))
    expect(contextOf(last)).toContain('ötödször'.slice(0, 0) + '5. alkalommal')
  })

  test('the same error in a third turn suggests recording a lesson', HU, async ($, on) => {
    stubEngine(on, { toolError: true, errorText: 'TypeError: x is not a function at foo.ts:12' })
    let r: unknown
    for (let i = 1; i <= 3; i++) {
      await $.turn.start({ text: 'próba', turnId: `T${i}` } as never)
      r = await $.tool.call(bash(`node run${i}.js`, `b${i}`))
    }
    expect(contextOf(r)).toContain('tanulság-szimat')
  })

  test('above 70% context the model is asked to work lean, once per climb', HU, async ($, on) => {
    stubEngine(on)
    await $.session.measure(measure([{ kind: 'five_hour', percentUsed: 10 }], 72))
    const first = await $.prompt.submit({ text: 'folytasd' } as never)
    expect(contextOf(first)).toContain('Dolgozz takarékosan')
    const second = await $.prompt.submit({ text: 'és még' } as never)
    expect(contextOf(second)).not.toContain('Dolgozz takarékosan')
  })

  test('the first prompt of the day brings the brief from the project table', { options: { ...HU.options, projectTable: 'C:/v/_CLAUDE.md' } }, async ($, on) => {
    stubEngine(on, { files: { 'C:/v/_CLAUDE.md': TABLE } })
    const first = await $.prompt.submit({ text: 'jó reggelt' } as never)
    expect(contextOf(first)).toContain('reggeli brief')
    expect(contextOf(first)).toContain('Bolt (deploy-var)')
    const second = await $.prompt.submit({ text: 'mehet' } as never)
    expect(contextOf(second)).not.toContain('reggeli brief')
  })

  test('a sign-off asks for a day summary and keeps it for the morning', HU, async ($, on) => {
    const { clock } = stubEngine(on)
    await $.prompt.submit({ text: 'jó reggelt' } as never)
    const bye = await $.prompt.submit({ text: 'köszi, mára ennyi' } as never)
    expect(contextOf(bye)).toContain('napzáró')
    await $.turn.start({ text: 'köszi, mára ennyi', turnId: 'T9' } as never)
    await $.turn.complete({ turnId: 'T9', reason: 'answer', answer: 'Ma: kész a 0.4.0.', durationMs: 1000, isAborted: false } as never)
    // The next morning the brief brings it back.
    await clock.advance(20 * HOUR)
    const morning = await $.prompt.submit({ text: 'szia' } as never)
    expect(contextOf(morning)).toContain('Tegnapi napzáró: Ma: kész a 0.4.0.')
  })

  test('a simple task on a big model at a high limit gets a model tip', HU, async ($, on) => {
    const { toasts } = stubEngine(on)
    await $.session.measure(measure([{ kind: 'seven_day', percentUsed: 80 }]))
    await $.prompt.submit({ text: 'nevezd át a foo változót barra' } as never)
    expect(toasts.join(' ')).toContain('kisebb modell')
  })

  test('at 80% of the week the figure rests with the tired face', HU, async ($, on) => {
    stubEngine(on)
    await $.session.measure(measure([{ kind: 'seven_day', percentUsed: 80 }]))
    await $.command.run({ command: 'zsemle', args: 'ok' } as never)
    const ui = await $.ui.mount({ ...BAND, surface: 'terminal' } as never)
    const props = JSON.stringify((await ui.find({ type: 'Client' }))?.props)
    expect(props).toContain(JSON.stringify(spriteRuns('tired', 'zsemle')).slice(1, 200))
    await ui.unmount()
  })

  test('/zsemle kerdes answers through a small model, /zsemle heti opens the chart', HU, async ($, on) => {
    stubEngine(on, { answer: 'A heti keretből 20% maradt.' })
    const r = await $.command.run({ command: 'zsemle', args: 'kerdes mennyi maradt?' } as never)
    expect(textOf(r)).toBe('Zsemle: A heti keretből 20% maradt.')
    await $.tool.call(bash('ls', 'a1'))
    const opened = await $.command.run({ command: 'zsemle', args: 'heti' } as never)
    expect(textOf(opened)).toContain('panelen')
    for (const surface of ['terminal', 'desktop'] as const) {
      const pane = await $.ui.mount({
        plugin: 'zsemle',
        surface,
        component: 'Pane',
        requestId: 'zsemle-week',
        props: { title: 'heti', isFocused: false, bodyColumns: 90, placement: 'inline' },
      } as never)
      expect(await pane.find({ type: 'Text', text: /legaktívabb órád: 12:00/ })).toBeDefined()
      await pane.unmount()
    }
  })
})

describe('subagent minis', () => {
  test('each running subagent adds a small figure, a finished one leaves', HU, async ($, on) => {
    stubEngine(on)
    on('classic.SubagentStart', () => ({}))
    on('classic.SubagentStop', () => ({}))
    for (const surface of ['terminal', 'desktop'] as const) {
      const leaf = surface === 'terminal' ? 'Client' : 'Svg'
      const count = async () => {
        const ui = await $.ui.mount({ ...BAND, surface } as never)
        const all = await ui.findAll({ type: leaf })
        await ui.unmount()
        return all.length
      }
      expect(await count()).toBe(1)
      await $.classic.SubagentStart({ agent_id: `a1-${surface}`, agent_type: 'general-purpose' } as never)
      await $.classic.SubagentStart({ agent_id: `a2-${surface}`, agent_type: 'general-purpose' } as never)
      expect(await count()).toBe(3)
      await $.classic.SubagentStop({ agent_id: `a1-${surface}`, agent_type: 'general-purpose', stop_hook_active: false, agent_transcript_path: '' } as never)
      expect(await count()).toBe(2)
      await $.classic.SubagentStop({ agent_id: `a2-${surface}`, agent_type: 'general-purpose', stop_hook_active: false, agent_transcript_path: '' } as never)
      expect(await count()).toBe(1)
    }
  })

  test('a mini figure is half the size of the figure', () => {
    const mini = miniRuns('awake', 'zsemle')
    expect(mini.length).toBe(MINI_ROWS)
    const width = mini[0]?.reduce((n, r) => n + [...r.text].length, 0)
    expect(width).toBe(MINI_COLUMNS)
  })
})
