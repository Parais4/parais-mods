import { describe, expect, mock, test } from 'claude-code/testing'

import { setLang } from '../hooks/i18n'

import {
  contextSaveNote,
  isClosingPrompt,
  isDeployCommand,
  isProjectCard,
  parseLsof,
  parseNetstat,
  porcelainCount,
  portClashes,
  queueCount,
} from '../hooks/logic'

const HU = { options: { language: 'hu', guardDashes: true } } as const
setLang('hu')

const NL = String.fromCharCode(10)
const NOON = Date.parse('2026-10-03T10:00:00Z')

const NETSTAT = [
  'Active Connections',
  '  Proto  Local Address          Foreign Address        State           PID',
  '  TCP    0.0.0.0:8787           0.0.0.0:0              LISTENING       1111',
  '  TCP    [::]:8787              [::]:0                 LISTENING       1111',
  '  TCP    127.0.0.1:8787         0.0.0.0:0              LISTENING       2222',
  '  TCP    0.0.0.0:135            0.0.0.0:0              LISTENING       900',
  '  TCP    [::]:135               [::]:0                 LISTENING       901',
  '  TCP    192.168.1.5:50000      1.2.3.4:443            ESTABLISHED     1111',
].join(NL)

const LSOF = [
  'COMMAND  PID  USER   FD   TYPE DEVICE SIZE/OFF NODE NAME',
  'node    3333 dev     20u  IPv4 0x1         0t0  TCP *:3000 (LISTEN)',
  'node    4444 dev     21u  IPv6 0x2         0t0  TCP [::1]:3000 (LISTEN)',
  'node    5555 dev     22u  IPv4 0x3         0t0  TCP 127.0.0.1:5173 (LISTEN)',
].join(NL)

const PORCELAIN = Array.from({ length: 12 }, (_, i) => ` M src/file${i}.ts`).join(NL)

const measure = (percent: number) =>
  ({ context: { window: 200000, percent }, rateLimits: [], changed: ['context'] }) as never

const BAND = {
  plugin: 'zsemle',
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: false, maxRows: 20, bodyColumns: 100 },
} as const

type Opts = { netstat?: string; porcelain?: string; queue?: string | null }

// The engine beneath the plugin, with the processes and files it reads.
const stubEngine = (on: any, opts: Opts = {}) => {
  const clock = mock.clock(on, { now: NOON })
  mock.store(on)
  on('ui.render', () => null)
  on('session.measure', (_$: unknown, e: { changed: string[] }) => ({ changed: e.changed }))
  on('ui.toast', () => ({}))
  on('tool.call', () => ({ result: 'ran', text: 'ran' }))
  on('prompt.submit', (_$: unknown, e: { text: string; context?: string[] }) => ({ text: e.text, context: e.context }))
  on('session.cwd', () => ({ value: 'C:/work/repo' }))
  on('process.run', (_$: unknown, e: { argv: string[] }) => {
    const stdout = e.argv[0] === 'netstat' ? (opts.netstat ?? '') : e.argv[0] === 'git' ? (opts.porcelain ?? '') : ''
    return { value: { exitCode: 0, stdout, stderr: '' } }
  })
  on('fs.read', () => {
    if (opts.queue === null || opts.queue === undefined) return { deny: 'missing' }
    return { value: opts.queue }
  })
  return clock
}

const bash = (command: string, id: string) => ({ tool: 'Bash', command, tool_use_id: id }) as never
const contextOf = (r: unknown) => ((r as { context?: string[] }).context ?? []).join(' ')

describe('housekeeping logic', () => {
  test('netstat and lsof show which dev ports have more than one listener', async () => {
    expect(portClashes(parseNetstat(NETSTAT))).toEqual([{ port: 8787, pids: [1111, 2222] }])
    expect(portClashes(parseLsof(LSOF))).toEqual([{ port: 3000, pids: [3333, 4444] }])
    // The same process on IPv4 and IPv6 is one listener, and port 135 is not a dev port.
    expect(portClashes(parseNetstat(NETSTAT)).some(c => c.port === 135)).toBe(false)
  })

  test('counts, cards and closing prompts', async () => {
    expect(porcelainCount(PORCELAIN)).toBe(12)
    expect(porcelainCount('')).toBe(0)
    expect(queueCount(['2026-10-01', '', '2026-10-02'].join(NL))).toBe(2)
    expect(isProjectCard('C:/vault/Shop/INDEX.md')).toBe(true)
    expect(isProjectCard('C:/vault/Ékezetes Projekt/HOME.md')).toBe(true)
    expect(isProjectCard('C:/repo/README.md')).toBe(false)
    expect(isClosingPrompt('köszi, mára ennyi')).toBe(true)
    expect(isClosingPrompt('kész vagyunk')).toBe(true)
    expect(isClosingPrompt('készíts egy új komponenst')).toBe(false)
    expect(contextSaveNote(82, false)).toContain('előbb frissítsd')
    expect(contextSaveNote(82, true)).toContain('mehet a /compact')
  })

  test('only a real deploy command counts, not a script that mentions one', async () => {
    expect(isDeployCommand('npx vercel --prod')).toBe(true)
    expect(isDeployCommand('cd app && vercel')).toBe(true)
    expect(isDeployCommand('npx wrangler deploy')).toBe(true)
    expect(isDeployCommand(['python - <<EOF', "x = 'vercel dev and wrangler dev'", 'EOF'].join(NL))).toBe(false)
    expect(isDeployCommand('grep -n "vercel" notes.md')).toBe(false)
  })
})

describe('housekeeping engine', () => {
  test('at 80% context the next prompt asks for a "Folytatás innen" save, once', HU, async ($, on) => {
    stubEngine(on)
    await $.session.measure(measure(85))
    const first = await $.prompt.submit({ text: 'menjünk tovább' } as never)
    expect(contextOf(first)).toContain('Folytatás innen')
    const second = await $.prompt.submit({ text: 'és még ezt' } as never)
    expect(contextOf(second)).not.toContain('Folytatás innen')

    const asking = await $.ui.mount({ ...BAND, surface: 'terminal' } as never)
    expect(await asking.find({ type: 'Text', text: /előbb frissítsd/ })).toBeDefined()
    await asking.unmount()

    await $.tool.call({ tool: 'Edit', file_path: 'C:/vault/Shop/INDEX.md', old_string: 'a', new_string: 'b', tool_use_id: 'e1' } as never)
    const saved = await $.ui.mount({ ...BAND, surface: 'terminal' } as never)
    expect(await saved.find({ type: 'Text', text: /mehet a \/compact/ })).toBeDefined()
    await saved.unmount()
  })

  test('a closing prompt with a waiting SIL queue reminds about /reflect', { options: { ...HU.options, reflectQueue: 'C:/vault/_reflect-queue.log' } }, async ($, on) => {
    stubEngine(on, { queue: ['2026-10-01T21:16', '2026-10-01T21:19'].join(NL) })
    const r = await $.prompt.submit({ text: 'köszi, mára ennyi' } as never)
    expect(contextOf(r)).toContain('2 feldolgozatlan reflexió')
    const ui = await $.ui.mount({ ...BAND, surface: 'terminal' } as never)
    expect(await ui.find({ type: 'Text', text: /\/reflect/ })).toBeDefined()
    await ui.unmount()
  })

  test('no reminder when the queue is empty or missing', { options: { ...HU.options, reflectQueue: 'C:/vault/_reflect-queue.log' } }, async ($, on) => {
    stubEngine(on, { queue: null })
    const r = await $.prompt.submit({ text: 'köszi, mára ennyi' } as never)
    expect(contextOf(r)).not.toContain('reflexió')
  })

  test('starting a dev server with another one on the port wakes the port guard', HU, async ($, on) => {
    stubEngine(on, { netstat: NETSTAT })
    const r = await $.tool.call(bash('npx wrangler dev', 'p1'))
    expect(contextOf(r)).toContain('8787-es porton 2 folyamat')
    const ui = await $.ui.mount({ ...BAND, surface: 'terminal' } as never)
    expect(await ui.find({ type: 'Text', text: /Portőr: a 8787-es porton/ })).toBeDefined()
    await ui.unmount()
  })

  test('the background scan sniffs uncommitted files', HU, async ($, on) => {
    const clock = stubEngine(on, { porcelain: PORCELAIN })
    on('command.register', () => ({ value: undefined }) as never)
    on('session.usage', () => ({ value: { startedAt: NOON, context: { window: 200000, percent: 10 }, rateLimits: [] } }))
    on('session.start', (_$: unknown, e: { cwd?: string }) => ({ cwd: e.cwd ?? 'C:/work/repo' }))
    await $.session.start({ source: 'startup', cwd: 'C:/work/repo' } as never)
    await clock.advance(300)
    await clock.settle()
    const ui = await $.ui.mount({ ...BAND, surface: 'terminal' } as never)
    expect(await ui.find({ type: 'Text', text: /12 módosított fájl vár commitra/ })).toBeDefined()
    await ui.unmount()
  })
})
