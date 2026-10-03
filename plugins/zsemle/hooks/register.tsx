import { atom, read, update } from 'claude-code'
import type { EngineInterface, PluginOptions, Register, Timer } from 'claude-code'

import type { Limit } from '../types'
import { asLang, lang, parseOffset, setLang, setUtcOffset, tr } from './i18n'
import {
  apiErrorNote,
  autoCompactNote,
  chaseNote,
  CONTEXT_TIRED_AT,
  CONTEXT_COMPACT_AT,
  CONTEXT_CRITICAL_AT,
  contextCriticalNote,
  costCrossed,
  costNote,
  crossingNote,
  crossings,
  deployNote,
  EMPTY_STATS,
  FAIL_STREAK,
  formatDuration,
  guardReason,
  IDLE_AFTER_MS,
  isDeployCommand,
  isTestCommand,
  judge,
  localTime,
  modelSwitchNote,
  paceNote,
  resetNote,
  resets,
  REST_AFTER_MS,
  BREAK_GAP_MS,
  shouldBark,
  SPRITE_COLUMNS,
  SPRITE_ROWS,
  statsText,
  STOP_AT,
  worstForecast,
  writeParts,
  spriteRuns,
  spriteSvg,
  commitBucket,
  commitNote,
  COMMIT_SNIFF_AT,
  contextSaveNote,
  contextSavePromptNote,
  isClosingPrompt,
  isDevServerCommand,
  isProjectCard,
  parseLsof,
  parseNetstat,
  porcelainCount,
  portClashes,
  portModelNote,
  portNote,
  queueCount,
  reflectNote,
  reflectPromptNote,
  SAVE_RESET_BELOW,
  SCAN_EVERY_MS,
} from './logic'
import type { DayStats, PortClash, Pose, Verdict } from './logic'
import { asSkin, DEFAULT_SKIN, findSkin, labelOf, nextSkin, SKIN_IDS, voiceOf } from './skins'
import type { SkinId, Voice } from './skins'

const limits = atom({ plugin: 'zsemle', key: 'limits' } as const, [] as Limit[])
const isHidden = atom({ plugin: 'zsemle', key: 'isHidden' } as const, false)
const isWoken = atom({ plugin: 'zsemle', key: 'isWoken' } as const, false)
const isGuardOff = atom({ plugin: 'zsemle', key: 'isGuardOff' } as const, false)

const COAT = '#c8985c'
const HEART = '#e87887'
const SEC = 1000
const MIN = 60 * SEC
const SKIN_PANE = 'zsemle-skins'

function help(): string {
  if (lang() === 'en') {
    return [
      '/zsemle ok            got it (hides the bubble)',
      '/zsemle limit         every limit, the pace, the context and the cost right now',
      '/zsemle skin          figure picker pane (also in /config: zsemle.skin)',
      `/zsemle skin <name>   figure: ${SKIN_IDS.join(', ')}`,
      '/zsemle stats         stats for the day',
      '/zsemle mute          sound off (the button too)',
      '/zsemle sound         sound back on',
      '/zsemle pet           a pat',
      '/zsemle hide          hides the figure',
      '/zsemle show          shows it again',
      '/zsemle bar off|on    the limit line under the prompt off/on',
      '/zsemle wake          let work go on past 95% in this session',
      '/zsemle guard off|on  content guard (dashes, curly quotes, emoji, secrets) off/on',
      '/zsemle bark          test the sound',
    ].join('\n')
  }
  return [
    '/zsemle ok           oké, értettem (eltünteti a buborékot)',
    '/zsemle stat         napi statisztika',
    '/zsemle limit        az összes limit, tempó, kontextus és költség most',
    '/zsemle skin         figura-választó panel (a /config-ban is: zsemle.skin)',
    `/zsemle skin <név>   figura: ${SKIN_IDS.join(', ')}`,
    '/zsemle nemit        hang ki (a gombbal is)',
    '/zsemle hang         hang vissza',
    '/zsemle simi         simogatás',
    '/zsemle elrejt       elrejti a figurát',
    '/zsemle mutat        újra megjeleníti',
    '/zsemle sor ki|be    a limit-sor a prompt alatt ki/be',
    '/zsemle ebreszt      95% felett is továbbenged ebben a munkamenetben',
    '/zsemle or ki|be     tartalomőr (gondolatjel, idézőjel, emoji, titok) ki/be',
    '/zsemle ugass        próba-hang',
  ].join('\n')
}

// Every command word, Hungarian and English, mapped to one action.
const COMMANDS: Record<string, string> = {
  limit: 'limit',
  limitek: 'limit',
  limits: 'limit',
  stat: 'stat',
  stats: 'stat',
  nemit: 'mute',
  'némít': 'mute',
  mute: 'mute',
  hang: 'sound',
  sound: 'sound',
  unmute: 'sound',
  ok: 'ok',
  simi: 'pet',
  pet: 'pet',
  elrejt: 'hide',
  hide: 'hide',
  mutat: 'show',
  show: 'show',
  'sor ki': 'bar off',
  'bar off': 'bar off',
  'sor be': 'bar on',
  'bar on': 'bar on',
  ebreszt: 'wake',
  'ébreszt': 'wake',
  wake: 'wake',
  'or ki': 'guard off',
  'őr ki': 'guard off',
  'guard off': 'guard off',
  'or be': 'guard on',
  'őr be': 'guard on',
  'guard on': 'guard on',
  ugass: 'bark',
  bark: 'bark',
}

// Transient state of this load. A reload starts it over; limits and switches
// live in $.state; mute, skin and daily stats in $.store.
const S = {
  skin: DEFAULT_SKIN as SkinId,
  reflectQueue: '',
  guardDashes: false,
  startedAt: new Map<string, number>(),
  isWorking: false,
  lastActivity: 0,
  workStart: 0,
  restUntil: 0,
  restShownAt: 0,
  wagUntil: 0,
  droopUntil: 0,
  heartUntil: 0,
  sniffUntil: 0,
  growlUntil: 0,
  growlText: '',
  chaseUntil: 0,
  barkUntil: 0,
  barkPoseUntil: 0,
  barkText: '',
  // A limit-ish event worth a bubble of its own: an API error, an automatic
  // model switch or compaction, a window that reset, a cost milestone.
  alertUntil: 0,
  alertText: '',
  alertTone: 'yellow' as Tone,
  alertPose: 'droop' as Pose,
  contextPct: null as number | null,
  isContextCriticalSent: false,
  costUsd: 0,
  pacedWindows: new Set<string>(),
  lastFail: '',
  failCount: 0,
  isMuted: false,
  isStatusOff: false,
  lastStatus: '',
  statsDay: '',
  stats: { ...EMPTY_STATS } as DayStats,
  lastKey: '',
  ackedKey: '',
  tick: null as Timer | null,
  isSaveNeeded: false,
  isSaveNoteSent: false,
  isSaved: false,
  reflectCount: 0,
  reflectAskUntil: 0,
  dirtyCount: 0,
  portClash: null as PortClash | null,
  nextScanAt: 0,
  isScanning: false,
}

const voice = (): Voice => voiceOf(S.skin)

type Tone = 'red' | 'yellow' | 'coat' | 'heart' | 'dim' | 'plain'
// `key` names the message: once acknowledged it stays hidden until a message
// with another key comes. `quiet` messages never open the bubble.
type View = { pose: Pose; message: string; tone: Tone; key: string; quiet?: true }

const alternate = (now: number, a: Pose, b: Pose, ms = 250): Pose => (Math.floor(now / ms) % 2 === 0 ? a : b)

/** Shows `text` in the bubble for `ms`, with a pose and a tone, and as a toast. */
function alert($: EngineInterface, now: number, text: string, opts: { tone?: Tone; pose?: Pose; ms?: number; toast?: boolean } = {}): void {
  S.alertText = text
  S.alertTone = opts.tone ?? 'yellow'
  S.alertPose = opts.pose ?? 'droop'
  S.alertUntil = now + (opts.ms ?? 3 * MIN)
  if (opts.toast !== false) $.ui.toast(`${voice().name}: ${text}`, { timeoutMs: 8000 })
  $.ui.invalidate('ui.render')
}

/** What the figure shows right now: the most urgent message wins, the pose follows it. */
function view(now: number, verdict: Verdict, isStopped: boolean, all: readonly Limit[]): View {
  const v = voice()
  const tired = S.contextPct !== null && S.contextPct >= CONTEXT_TIRED_AT
  const idle = !S.isWorking && S.lastActivity > 0 && now - S.lastActivity >= IDLE_AFTER_MS

  let base: Pose = 'awake'
  if (now < S.wagUntil || now < S.heartUntil) base = alternate(now, 'awake', 'wag')
  else if (now < S.droopUntil) base = 'droop'
  else if (tired && now % 20000 < 1500) base = 'yawn'
  else if (now % 4700 < 300) base = 'blink'

  if (isStopped) return { pose: 'blink', message: `${verdict.message} ${v.snore}...`, tone: 'red', key: 'stop' }
  if (now < S.growlUntil) return { pose: 'growl', message: `${v.growl} ${S.growlText}`, tone: 'red', key: `growl:${S.growlUntil}` }
  if (now < S.alertUntil) {
    const pose = S.alertPose === 'wag' ? alternate(now, 'awake', 'wag') : S.alertPose
    return { pose, message: S.alertText, tone: S.alertTone, key: `alert:${S.alertUntil}` }
  }
  if (verdict.level === 'critical') {
    return { pose: alternate(now, 'droop', 'awake', 900), message: verdict.message, tone: 'red', key: `critical:${verdict.worst?.kind ?? ''}` }
  }
  if (now < S.chaseUntil) {
    return {
      pose: 'droop',
      message: tr(
        'Körbe-körbe járunk: ugyanaz a parancs többször elbukott. Állj meg, keresd a gyökérokot.',
        'We are going in circles: the same command failed several times. Stop and find the root cause.',
      ),
      tone: 'yellow',
      key: `chase:${S.chaseUntil}`,
    }
  }
  const pace = verdict.level === 'stop' ? null : worstForecast(all, now)
  if (pace !== null) {
    return {
      pose: alternate(now, 'sniff', 'awake', 600),
      message: paceNote(pace, now),
      tone: 'yellow',
      key: `pace:${pace.limit.kind}:${pace.limit.resetsAt ?? ''}`,
    }
  }
  if (S.portClash !== null) {
    return {
      pose: alternate(now, 'sniff', 'awake', 400),
      message: portNote(S.portClash),
      tone: 'yellow',
      key: `port:${S.portClash.port}:${S.portClash.pids.join(',')}`,
    }
  }
  if (now < S.heartUntil) return { pose: base, message: `♥ ♥ ♥  ${v.pet}`, tone: 'heart', key: `heart:${S.heartUntil}` }
  if (now < S.sniffUntil) {
    return {
      pose: alternate(now, 'sniff', 'awake', 400),
      message: `${v.sniff} ${tr('Deploy volt: kérdezd vissza az élő állapotot.', 'A deploy ran: check the live state.')}`,
      tone: 'yellow',
      key: `sniff:${S.sniffUntil}`,
    }
  }
  if (now < S.barkUntil) {
    return { pose: now < S.barkPoseUntil ? 'bark' : base, message: S.barkText, tone: 'coat', key: `bark:${S.barkUntil}` }
  }
  if (now < S.restUntil) {
    return {
      pose: base,
      message: tr('Már 90 perce dolgozol. Tarts 5 perc szünetet!', 'You have been at it for 90 minutes. Take a 5 minute break!'),
      tone: 'yellow',
      key: `rest:${S.restShownAt}`,
    }
  }
  if (now < S.reflectAskUntil && S.reflectCount > 0) {
    return { pose: base, message: reflectNote(S.reflectCount), tone: 'yellow', key: `reflect:${S.reflectAskUntil}` }
  }
  if (idle) {
    const tail = S.reflectCount > 0 ? ` ${reflectNote(S.reflectCount)}` : ''
    return {
      pose: 'blink',
      message: `${tr('Alszom... 20 perce nem dolgoztunk.', 'Sleeping... no work for 20 minutes.')} ${v.snore}${tail}`,
      tone: 'dim',
      key: `idle:${S.lastActivity}`,
    }
  }
  if (verdict.level === 'high' || verdict.level === 'warn') {
    return { pose: base, message: verdict.message, tone: 'yellow', key: `${verdict.level}:${verdict.worst?.kind ?? ''}` }
  }
  if (S.isSaveNeeded && S.contextPct !== null) {
    return {
      pose: base === 'awake' && now % 8000 < 1500 ? 'yawn' : base,
      message: contextSaveNote(S.contextPct, S.isSaved),
      tone: S.isSaved ? 'coat' : 'yellow',
      key: `context:${S.isSaved}`,
    }
  }
  if (S.dirtyCount >= COMMIT_SNIFF_AT) {
    return { pose: base, message: commitNote(S.dirtyCount), tone: 'yellow', key: `commit:${commitBucket(S.dirtyCount)}` }
  }
  if (now < S.wagUntil) return { pose: base, message: v.happy, tone: 'coat', key: `wag:${S.wagUntil}` }
  if (now < S.droopUntil) {
    return { pose: base, message: tr('Hoppá, elbukott egy parancs.', 'Oops, a command failed.'), tone: 'dim', key: `droop:${S.droopUntil}` }
  }
  return { pose: base, message: verdict.message, tone: 'plain', key: 'ok', quiet: true }
}

const showsBubble = (v: View) => v.quiet !== true && v.key !== S.ackedKey

function statusText(verdict: Verdict): string {
  const ctx = S.contextPct === null ? '' : `${tr('ktx', 'ctx')} ${Math.round(S.contextPct)}%`
  // Off a subscription there are no windows: the session's cost is the limit to watch.
  const cost = verdict.status === '' && S.costUsd > 0 ? tr(`${S.costUsd.toFixed(2)} $`, `$${S.costUsd.toFixed(2)}`) : ''
  return [verdict.status, ctx, cost].filter(s => s !== '').join(' · ')
}

function activity(now: number): void {
  if (S.lastActivity === 0 || now - S.lastActivity > BREAK_GAP_MS) {
    S.workStart = now
    S.restShownAt = 0
  }
  S.lastActivity = now
}

function toLimits(raw: readonly { kind: string; percentUsed: number; resetsAt?: string }[]): Limit[] {
  return raw.map(r => ({ kind: r.kind, percentUsed: r.percentUsed, resetsAt: r.resetsAt }))
}

async function currentView($: EngineInterface, now: number): Promise<{ v: View; verdict: Verdict }> {
  const all = await read($, limits)
  const verdict = judge(all, now)
  const isStopped = verdict.level === 'stop' && !(await read($, isWoken))
  return { v: view(now, verdict, isStopped, all), verdict }
}

async function bumpStats($: EngineInterface, change: (s: DayStats) => DayStats): Promise<void> {
  const day = localTime(await $.clock.now()).day
  if (S.statsDay !== day) {
    const saved = (await $.store.get(`stats:${day}`)) as Partial<DayStats> | undefined
    S.stats = { ...EMPTY_STATS, ...(saved ?? {}) }
    S.statsDay = day
  }
  S.stats = change(S.stats)
  await $.store.set(`stats:${day}`, S.stats)
}

async function playBark($: EngineInterface): Promise<void> {
  if (S.isMuted) return
  const asset = voice().sound
  const root = $.plugin.root
  if (/^[A-Za-z]:[\\/]/.test(root)) {
    // Windows terminals have no player for $.audio.play, so PowerShell plays it.
    const file = `${root.replace(/[\\/]+$/, '')}\\${asset.replace(/\//g, '\\')}`.replace(/'/g, "''")
    await $.process.run(
      ['powershell', '-NoProfile', '-NonInteractive', '-Command', `(New-Object Media.SoundPlayer '${file}').PlaySync()`],
      { timeoutMs: 10000 },
    )
    return
  }
  await $.audio.play({ asset })
}

async function pet($: EngineInterface): Promise<void> {
  S.heartUntil = (await $.clock.now()) + 3 * SEC
  $.ui.invalidate('ui.render')
  await bumpStats($, s => ({ ...s, pets: s.pets + 1 }))
}

async function setMuted($: EngineInterface, muted: boolean): Promise<void> {
  S.isMuted = muted
  await $.store.set('muted', muted)
  $.ui.invalidate('ui.render')
}

/** Wears another figure: kept across sessions, drawn at once on every surface. */
async function chooseSkin($: EngineInterface, id: SkinId): Promise<void> {
  S.skin = id
  await $.store.set('skin', id)
  S.lastKey = ''
  $.ui.invalidate('ui.render')
}

/**
 * The figure to wear: the one last chosen with /zsemle skin, unless the
 * /config row (zsemle.skin) changed since, which then wins.
 */
async function loadSkin($: EngineInterface, options: PluginOptions): Promise<SkinId> {
  const fromConfig = asSkin(options.skin)
  const seen = await $.store.get('skinConfigSeen')
  if (seen !== fromConfig) {
    await $.store.set('skinConfigSeen', fromConfig)
    await $.store.set('skin', fromConfig)
    return fromConfig
  }
  const stored = await $.store.get('skin')
  return stored === undefined ? fromConfig : asSkin(stored)
}

/** The machine's UTC offset for English times (Hungarian keeps Budapest's own rules). */
async function measureOffset($: EngineInterface): Promise<void> {
  try {
    const run = isWindowsRoot($.plugin.root)
      ? await $.process.run(['powershell', '-NoProfile', '-NonInteractive', '-Command', 'Get-Date -Format zzz'], { timeoutMs: 8000 })
      : await $.process.run(['date', '+%z'], { timeoutMs: 8000 })
    setUtcOffset(run.exitCode === 0 ? parseOffset(run.stdout) : null)
  } catch {
    setUtcOffset(null)
  }
}

/** "Oké, értettem": hides the message on show until another one comes. */
async function ack($: EngineInterface): Promise<void> {
  const { v } = await currentView($, await $.clock.now())
  S.ackedKey = v.key
  $.ui.invalidate('ui.render')
}

const isWindowsRoot = (root: string) => /^[A-Za-z]:[\\/]/.test(root)

async function scanCommits($: EngineInterface): Promise<void> {
  const cwd = await $.session.cwd()
  const run = await $.process.run(['git', 'status', '--porcelain'], { cwd, timeoutMs: 8000 })
  S.dirtyCount = run.exitCode === 0 ? porcelainCount(run.stdout) : 0
}

async function scanPorts($: EngineInterface): Promise<PortClash | null> {
  const isWindows = isWindowsRoot($.plugin.root)
  const run = isWindows
    ? await $.process.run(['netstat', '-ano'], { timeoutMs: 8000 })
    : await $.process.run(['lsof', '-nP', '-iTCP', '-sTCP:LISTEN'], { timeoutMs: 8000 })
  const use = isWindows ? parseNetstat(run.stdout) : parseLsof(run.stdout)
  S.portClash = portClashes(use)[0] ?? null
  return S.portClash
}

async function refreshReflect($: EngineInterface): Promise<number> {
  if (S.reflectQueue === '') {
    S.reflectCount = 0
    return 0
  }
  try {
    S.reflectCount = queueCount(await $.fs.read(S.reflectQueue))
  } catch {
    S.reflectCount = 0
  }
  return S.reflectCount
}

async function scanAll($: EngineInterface): Promise<void> {
  await Promise.all([scanCommits($).catch(() => undefined), scanPorts($).catch(() => undefined), refreshReflect($)])
}

/** The status line under the prompt: the figure's name and every limit at a glance. */
function pushStatus($: EngineInterface, verdict: Verdict): void {
  const body = statusText(verdict)
  const line = S.isStatusOff || body === '' ? '' : `${voice().name} · ${body}`
  if (line === S.lastStatus) return
  S.lastStatus = line
  $.ui.status(line === '' ? undefined : line)
}

async function onTick($: EngineInterface): Promise<void> {
  const now = await $.clock.now()
  const working = now - S.lastActivity < BREAK_GAP_MS
  if (working && S.workStart > 0 && now - S.workStart >= REST_AFTER_MS && now >= S.restUntil && now - S.restShownAt >= 30 * MIN) {
    S.restUntil = now + 5 * MIN
    S.restShownAt = now
    $.ui.toast(`${voice().name}: ${tr('már 90 perce dolgozol, tarts egy kis szünetet!', 'you have been at it for 90 minutes, take a short break!')}`)
  }
  if (working && !S.isScanning && now >= S.nextScanAt) {
    S.isScanning = true
    S.nextScanAt = now + SCAN_EVERY_MS
    void scanAll($).finally(() => {
      S.isScanning = false
    })
  }
  const { v, verdict } = await currentView($, now)
  pushStatus($, verdict)
  const key = `${S.skin}|${v.pose}|${v.message}|${v.tone}|${statusText(verdict)}|${S.isMuted}|${showsBubble(v)}`
  if (key !== S.lastKey) {
    S.lastKey = key
    $.ui.invalidate('ui.render')
  }
}

/** Every limit at once, for /zsemle limit. */
async function limitReport($: EngineInterface): Promise<string> {
  const now = await $.clock.now()
  const all = await read($, limits)
  const verdict = judge(all, now)
  const lines = [tr(`${voice().name} limit-jelentése:`, `${voice().name}'s limit report:`)]
  if (all.length === 0) {
    lines.push(
      tr(
        '  limitablak: nincs adat (nem előfizetéses használat, vagy még nem jött válasz)',
        '  limit windows: no reading (not a subscription, or no response yet)',
      ),
    )
  }
  for (const l of all) {
    const one = judge([l], now)
    lines.push(`  ${one.status.padEnd(14)} ${one.level === 'ok' ? tr('rendben', 'fine') : one.message}`)
    const f = worstForecast([l], now)
    if (f !== null) lines.push(`  ${''.padEnd(14)} ${paceNote(f, now)}`)
  }
  const ctx = S.contextPct === null ? tr('nincs adat', 'no reading') : `${Math.round(S.contextPct)}%`
  lines.push(`  ${tr('kontextus:', 'context:').padEnd(15)}${ctx}`)
  if (S.costUsd > 0) {
    lines.push(
      tr(`  költség:       ${S.costUsd.toFixed(2)} $ ebben a munkamenetben`, `  cost:          $${S.costUsd.toFixed(2)} this session`),
    )
  }
  if (verdict.level === 'stop' && (await read($, isWoken))) {
    lines.push(tr(`  (${STOP_AT}% felett is engedek: /zsemle ebreszt volt)`, `  (going on past ${STOP_AT}%: /zsemle wake was given)`))
  }
  return lines.join('\n')
}

export const register: Register = (on, options) => {
  setLang(asLang(options.language))
  S.reflectQueue = typeof options.reflectQueue === 'string' ? options.reflectQueue.trim() : ''
  S.guardDashes = options.guardDashes === true

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'zsemle',
      description: tr(
        'Zsemle, a társfigura: limit, skin, stat, nemit, hang, simi, elrejt, mutat, ebreszt, or ki|be, ugass',
        'Zsemle, the companion: limit, skin, stats, mute, sound, pet, hide, show, wake, guard off|on, bark',
      ),
    })
    const now = await $.clock.now()
    activity(now)
    S.isMuted = (await $.store.get('muted')) === true
    S.isStatusOff = (await $.store.get('statusOff')) === true
    S.skin = await loadSkin($, options)
    if (lang() === 'en') void measureOffset($)
    try {
      const usage = await $.session.usage()
      await update($, limits, () => toLimits(usage.rateLimits))
      S.contextPct = usage.context.percent ?? null
      S.costUsd = usage.cost?.usd ?? 0
    } catch {
      // No reading yet; session.measure fills it after the first response.
    }
    void refreshReflect($)
    S.tick?.cancel()
    S.tick = $.clock.every(250, () => void onTick($).catch(() => undefined))

    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    const now = await $.clock.now()
    if (e.changed.includes('context') && e.context.percent !== undefined) {
      S.contextPct = e.context.percent
      if (S.contextPct >= CONTEXT_COMPACT_AT && !S.isSaveNeeded) {
        S.isSaveNeeded = true
        S.isSaveNoteSent = false
        S.isSaved = false
      } else if (S.contextPct < SAVE_RESET_BELOW) {
        // After a /compact: the next climb asks again.
        S.isSaveNeeded = false
        S.isSaveNoteSent = false
        S.isSaved = false
        S.isContextCriticalSent = false
      }
      if (S.contextPct >= CONTEXT_CRITICAL_AT && !S.isContextCriticalSent) {
        S.isContextCriticalSent = true
        alert($, now, contextCriticalNote(S.contextPct), { pose: 'yawn', ms: MIN })
      }
    }
    if (e.changed.includes('rateLimits')) {
      const before = await read($, limits)
      const wasStopped = judge(before, now).level === 'stop'
      const fresh = toLimits(e.rateLimits)
      await update($, limits, () => fresh)
      const verdict = judge(fresh, now)

      const back = resets(before, fresh)
      if (back.length > 0) {
        S.wagUntil = now + 6 * SEC
        alert($, now, back.map(resetNote).join(' '), { tone: 'coat', pose: 'wag', ms: MIN })
      }
      for (const c of crossings(before, fresh)) {
        $.ui.toast(`${voice().name}: ${crossingNote(c, now)}`, { timeoutMs: 8000 })
      }
      const pace = worstForecast(fresh, now)
      const paceKey = pace === null ? '' : `${pace.limit.kind}:${pace.limit.resetsAt ?? ''}`
      if (pace !== null && !S.pacedWindows.has(paceKey)) {
        S.pacedWindows.add(paceKey)
        $.ui.toast(`${voice().name}: ${paceNote(pace, now)}`, { timeoutMs: 10000 })
      }
      if (verdict.level !== 'stop' && wasStopped) {
        // The window reset: wake up on our own and drop any override.
        await update($, isWoken, () => false)
      }
    }
    if (e.changed.includes('cost') && e.cost !== undefined) {
      const step = costCrossed(S.costUsd, e.cost.usd)
      S.costUsd = e.cost.usd
      // On a subscription the windows are the limit; the dollars are only notional.
      if (step !== null && (await read($, limits)).length === 0) {
        alert($, now, costNote(step, e.cost.usd), { tone: 'yellow', pose: 'sniff', ms: MIN })
      }
    }

    return next(e)
  })

  // An API error ended the turn: the rate limit, an overload, the output cap...
  on('classic.StopFailure', async ($, e, next) => {
    const now = await $.clock.now()
    const note = apiErrorNote(e.error)
    alert($, now, note.message, { tone: note.isSevere ? 'red' : 'yellow', pose: 'droop', ms: 5 * MIN })

    return next(e)
  })

  // The engine changed the model by itself (fallback after an overload or a limit).
  on('classic.PostModelSwitch', async ($, e, next) => {
    if (e.source === 'auto' && e.from_model !== e.to_model) {
      alert($, await $.clock.now(), modelSwitchNote(e.from_model, e.to_model), { pose: 'sniff', ms: 2 * MIN })
    }

    return next(e)
  })

  on('session.compact', async ($, e, next) => {
    const done = await next(e)
    if (e.trigger === 'auto' && e.agentId === undefined && !('skip' in done)) {
      alert($, await $.clock.now(), autoCompactNote(), { pose: 'yawn', ms: 2 * MIN })
    }
    return done
  })

  on('tool.call', async ($, e, next) => {
    const now = await $.clock.now()
    const verdict = judge(await read($, limits), now)
    if (verdict.level === 'stop' && !(await read($, isWoken))) {
      return {
        deny: tr(
          `Zsemle leállította a munkát: ${verdict.message} ` +
            'Ne próbáld újra és ne hívj több eszközt; zárd le a kört egy rövid összefoglalóval arról, hol tartasz.',
          `Zsemle stopped the work: ${verdict.message} ` +
            'Do not retry and call no more tools; close the turn with a short summary of where you are.',
        ),
      }
    }
    activity(now)
    await bumpStats($, s => ({ ...s, tools: s.tools + 1 }))

    const parts = writeParts(e.tool, e as unknown as Record<string, unknown>)
    if (parts !== null && !(await read($, isGuardOff))) {
      const reason = guardReason(parts.path, parts.added, parts.removed, { dashes: S.guardDashes })
      if (reason !== null) {
        S.growlUntil = now + 8 * SEC
        S.growlText = reason
        $.ui.invalidate('ui.render')
        await bumpStats($, s => ({ ...s, growls: s.growls + 1 }))
        return {
          deny: tr(
            `Zsemle morog és megállította az írást (${parts.path}): ${reason} Javítsd és írd újra. (Kikapcsolás: /zsemle or ki)`,
            `Zsemle growls and stopped the write (${parts.path}): ${reason} Fix it and write again. (Turn off: /zsemle guard off)`,
          ),
        }
      }
    }

    const ran = await next(e)
    if (parts !== null && ran.deny === undefined && ran.isError !== true && S.isSaveNeeded && isProjectCard(parts.path)) {
      S.isSaved = true
      $.ui.invalidate('ui.render')
    }
    if (e.tool !== 'Bash' || ran.deny !== undefined) return ran

    const cmd = String((e as unknown as { command?: unknown }).command ?? '').trim()
    const after = await $.clock.now()
    if (ran.isError === true) {
      S.droopUntil = after + 20 * SEC
      S.failCount = cmd === S.lastFail ? S.failCount + 1 : 1
      S.lastFail = cmd
      if (S.failCount >= FAIL_STREAK) {
        S.chaseUntil = after + MIN
        $.ui.invalidate('ui.render')
        return { ...ran, context: [...(ran.context ?? []), chaseNote()] }
      }
      return ran
    }

    if (cmd === S.lastFail) S.failCount = 0
    if (isTestCommand(cmd)) {
      S.wagUntil = after + 4 * SEC
      await bumpStats($, s => ({ ...s, tests: s.tests + 1 }))
    }
    if (isDeployCommand(cmd)) {
      S.sniffUntil = after + 2 * MIN
      await bumpStats($, s => ({ ...s, deploys: s.deploys + 1 }))
      $.ui.invalidate('ui.render')
      return { ...ran, context: [...(ran.context ?? []), deployNote()] }
    }
    if (isDevServerCommand(cmd)) {
      // A server started in the background binds its port a little later: look again then.
      $.clock.after(8 * SEC, () => void scanPorts($).catch(() => undefined))
      const clash = await scanPorts($).catch(() => null)
      if (clash !== null) {
        $.ui.invalidate('ui.render')
        return { ...ran, context: [...(ran.context ?? []), portModelNote(clash)] }
      }
    }
    return ran
  })

  on('prompt.submit', async ($, e, next) => {
    const now = await $.clock.now()
    activity(now)
    const verdict = judge(await read($, limits), now)
    const isCommand = e.text.trimStart().startsWith('/')
    if (!isCommand && verdict.level === 'stop' && !(await read($, isWoken))) {
      return {
        drop: tr(
          `Zsemle alszik: ${verdict.message} Ha mégis folytatnád: /zsemle ebreszt`,
          `Zsemle is asleep: ${verdict.message} To go on anyway: /zsemle wake`,
        ),
      }
    }

    const notes: string[] = []
    if (S.isSaveNeeded && !S.isSaved && !S.isSaveNoteSent) {
      S.isSaveNoteSent = true
      notes.push(contextSavePromptNote())
    }
    if (isClosingPrompt(e.text) && (await refreshReflect($)) > 0) {
      S.reflectAskUntil = now + 10 * MIN
      notes.push(reflectPromptNote(S.reflectCount))
    }
    if (notes.length > 0) {
      return next({ ...e, context: [...(e.context ?? []), ...notes] })
    }
    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    const now = await $.clock.now()
    S.startedAt.set(e.turnId, now)
    S.isWorking = true
    activity(now)

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const now = await $.clock.now()
    if (e.agentId !== undefined) return next(e)
    S.isWorking = false
    activity(now)
    const start = S.startedAt.get(e.turnId)
    S.startedAt.delete(e.turnId)
    // StopFailure names an API error; this covers a turn that died without one.
    if (e.reason === 'error' && now >= S.alertUntil) {
      alert(
        $,
        now,
        tr(
          'A kör hibával ért véget (API-hiba vagy a kontextus határa). Nézd meg az utolsó üzenetet.',
          'The turn ended with an error (an API error or the context limit). Look at the last message.',
        ),
        { pose: 'droop' },
      )
    }
    if (e.reason === 'refusal') {
      alert(
        $,
        now,
        tr('Az API visszautasította ezt a kérést. Fogalmazd át, vagy válts modellt.', 'The API refused this request. Rephrase it, or switch models.'),
        { pose: 'droop', toast: false },
      )
    }
    if (start !== undefined) {
      const elapsed = now - start
      await bumpStats($, s => ({ ...s, turns: s.turns + 1, longestMs: Math.max(s.longestMs, elapsed) }))
      if (shouldBark(elapsed, e.reason)) {
        S.barkUntil = now + 2 * MIN
        S.barkPoseUntil = now + 1500
        S.barkText = `${voice().bark} ${tr('Kész a kör', 'The turn is done')} (${formatDuration(elapsed)}).`
        await bumpStats($, s => ({ ...s, barks: s.barks + 1 }))
        void playBark($).catch(() => undefined)
      }
    }

    return next(e)
  })

  on('command.run', { command: 'zsemle' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase().replace(/\s+/g, ' ')
    const now = await $.clock.now()
    if (arg === 'skin' || arg === 'skinek' || arg === 'skins' || arg === 'figura') {
      const opened = await $.ui.open({ id: SKIN_PANE, title: tr('Zsemle figurák', 'Zsemle figures') })
      const list = SKIN_IDS.map(id => `  ${id === S.skin ? '*' : ' '} ${id.padEnd(8)} ${labelOf(id)}`).join('\n')
      const where = opened.isPlaced === false ? '' : tr(' A panelen kattintással is választhatsz.', ' You can also click one in the pane.')
      return { text: `${tr('Figurák (/zsemle skin <név>):', 'Figures (/zsemle skin <name>):')}\n${list}\n${where}`.trimEnd() }
    }
    if (arg.startsWith('skin ') || arg.startsWith('figura ')) {
      const word = arg.slice(arg.indexOf(' ') + 1)
      const id = ['kovetkezo', 'következő', 'next'].includes(word) ? nextSkin(S.skin) : findSkin(word)
      if (id === null) {
        return { text: tr(`Nincs ilyen figura: "${word}". Választható: ${SKIN_IDS.join(', ')}`, `No such figure: "${word}". Pick one of: ${SKIN_IDS.join(', ')}`) }
      }
      await chooseSkin($, id)
      return { text: tr(`${voiceOf(id).name} lett a társad: ${labelOf(id)}.`, `${voiceOf(id).name} is your companion now: ${labelOf(id)}.`) }
    }
    switch (COMMANDS[arg]) {
      case 'limit':
        return { text: await limitReport($) }
      case 'stat': {
        await bumpStats($, s => s)
        return { text: statsText(S.statsDay, S.stats, voice().name) }
      }
      case 'mute':
        await setMuted($, true)
        return { text: tr(`${voice().name} csendben marad. Vissza: /zsemle hang`, `${voice().name} keeps quiet. Back: /zsemle sound`) }
      case 'sound':
        await setMuted($, false)
        return { text: tr(`${voice().name} újra hangosan szól.`, `${voice().name} speaks up again.`) }
      case 'ok':
        await ack($)
        return { text: tr(`Oké, ${voice().name} csendben marad, amíg nincs új mondanivalója.`, `Got it, ${voice().name} stays quiet until there is news.`) }
      case 'pet':
        await pet($)
        return { text: `${voice().name}: ${voice().pet}` }
      case 'hide':
        await update($, isHidden, () => true)
        return { text: tr(`${voice().name} elbújt. Visszahívás: /zsemle mutat`, `${voice().name} is hiding. Call back: /zsemle show`) }
      case 'show':
        await update($, isHidden, () => false)
        return { text: tr(`${voice().name} újra itt van.`, `${voice().name} is back.`) }
      case 'bar off':
        S.isStatusOff = true
        await $.store.set('statusOff', true)
        S.lastStatus = '-'
        return { text: tr('A limit-sor a prompt alatt kikapcsolva. Vissza: /zsemle sor be', 'The limit line under the prompt is off. Back: /zsemle bar on') }
      case 'bar on':
        S.isStatusOff = false
        await $.store.set('statusOff', false)
        S.lastStatus = '-'
        return { text: tr('A limit-sor újra látszik a prompt alatt.', 'The limit line shows under the prompt again.') }
      case 'wake':
        await update($, isWoken, () => true)
        return {
          text: tr(
            `${voice().name} felébredt: ebben a munkamenetben ${STOP_AT}% felett sem állít le.`,
            `${voice().name} is awake: in this session work goes on past ${STOP_AT}% too.`,
          ),
        }
      case 'guard off':
        await update($, isGuardOff, () => true)
        return { text: tr('A tartalomőr kikapcsolva ebben a munkamenetben. Vissza: /zsemle or be', 'The content guard is off for this session. Back: /zsemle guard on') }
      case 'guard on':
        await update($, isGuardOff, () => false)
        return { text: tr('A tartalomőr újra figyel.', 'The content guard is watching again.') }
      case 'bark': {
        const wasMuted = S.isMuted
        S.isMuted = false
        S.barkUntil = now + 10 * SEC
        S.barkPoseUntil = now + 1500
        S.barkText = voice().bark
        await playBark($)
        S.isMuted = wasMuted
        return { text: voice().bark }
      }
      default: {
        const { v, verdict } = await currentView($, now)
        const status = statusText(verdict)
        return { text: `${v.message}${status === '' ? '' : `\n${status}`}\n\n${help()}` }
      }
    }
  })

  // Clicks on the figure: a double click on the head acknowledges, a click on
  // the body pets; in the picker a click wears that figure.
  on('ui.message', async ($, e, next) => {
    const data = e.data as { type?: unknown; skin?: unknown } | null
    if (data?.type === 'ack') await ack($)
    if (data?.type === 'pet') await pet($)
    if (data?.type === 'pick' && typeof data.skin === 'string') await chooseSkin($, asSkin(data.skin))

    return next(e)
  })

  const DESKTOP_FIGURE_PX = 96
  const PICKER_FIGURE_PX = 72

  // The picker: every figure side by side (wrapping when narrow), a click or
  // its button wears it.
  on('ui.render', { component: 'Pane', requestId: SKIN_PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const isTerminal = e.surface === 'terminal'
    const cards = SKIN_IDS.map(id => {
      const name = voiceOf(id).name
      const isOn = id === S.skin
      let figure = null
      if (isTerminal) {
        const { Client } = $.ui.resolve(e)
        figure = (
          <Client key={`pick-${id}`} module="./dog.tsx" props={{ lines: spriteRuns('awake', id), pick: id }} width={SPRITE_COLUMNS} height={SPRITE_ROWS} />
        )
      } else if (e.surface === 'desktop') {
        const { Svg } = $.ui.resolve(e)
        figure = <Svg key={`pick-${id}`} source={spriteSvg('awake', id)} alt={voiceOf(id).alt} width={PICKER_FIGURE_PX} height={PICKER_FIGURE_PX} />
      }
      return (
        <Box key={`card-${id}`} flexDirection="column" alignItems="center" width={Math.max(SPRITE_COLUMNS, 12)} marginRight={2}>
          {figure}
          {isOn ? (
            <Button key={`skin-${id}`} label={`[${name}]`} onPress={() => chooseSkin($, id)} />
          ) : (
            <Button key={`skin-${id}`} label={name} plain onPress={() => chooseSkin($, id)} />
          )}
        </Box>
      )
    })
    return (
      <Box flexDirection="column">
        <Text dimColor wrap="wrap">
          {tr(
            'Válassz társat: kattints a figurára vagy a nevére. Parancsból: /zsemle skin <név>, a /config-ban: zsemle.skin.',
            'Pick a companion: click the figure or its name. From a command: /zsemle skin <name>, in /config: zsemle.skin.',
          )}
        </Text>
        <Box flexDirection="row" flexWrap="wrap" marginTop={1}>
          {cards}
        </Box>
      </Box>
    )
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || (await read($, isHidden))) {
      return next(e)
    }
    S.isWorking = e.props.isWorking

    const now = await $.clock.now()
    const { v, verdict } = await currentView($, now)
    const status = statusText(verdict)
    const color =
      v.tone === 'red' ? 'red' : v.tone === 'yellow' ? 'yellow' : v.tone === 'coat' ? COAT : v.tone === 'heart' ? HEART : undefined
    const bubbleWidth = Math.max(24, Math.min(38, e.props.bodyColumns - SPRITE_COLUMNS - 3))

    const { Box, Text, Button } = $.ui.resolve(e)

    const isOpen = showsBubble(v)
    const bubble = isOpen ? (
      <Box key="bubble" flexDirection="column" borderStyle="round" borderColor={COAT} width={bubbleWidth}>
        <Text color={color} dimColor={v.tone === 'dim'} bold={v.tone !== 'plain' && v.tone !== 'dim'} wrap="wrap">
          {v.message}
        </Text>
        <Box flexDirection="row" justifyContent="space-between">
          <Text dimColor wrap="truncate-end">
            {status}
          </Text>
          <Box flexDirection="row" gap={1}>
            <Button key="ok" label="ok" plain onPress={() => ack($)} />
            <Button key="pet" label="♥" plain onPress={() => pet($)} />
            <Button key="mute" label={S.isMuted ? tr('hang', 'sound') : tr('némít', 'mute')} plain dimColor onPress={() => setMuted($, !S.isMuted)} />
            <Button key="skin" label="skin" plain dimColor onPress={() => chooseSkin($, nextSkin(S.skin))} />
          </Box>
        </Box>
      </Box>
    ) : null

    const pointer = isOpen && (
      <Box flexDirection="column" marginTop={2}>
        <Text color={COAT}>◀</Text>
      </Box>
    )

    if (e.surface === 'terminal') {
      const { Client } = $.ui.resolve(e)

      return (
        <Box flexDirection="row" justifyContent="flex-end" alignItems="flex-start">
          {bubble}
          {pointer}
          <Client key="zsemle-dog" module="./dog.tsx" props={{ lines: spriteRuns(v.pose, S.skin) }} width={SPRITE_COLUMNS} height={SPRITE_ROWS} />
        </Box>
      )
    }

    // The desktop's font does not tile quadrant glyphs, so the figure is an Svg
    // there; petting and acknowledging go through the bubble's buttons.
    if (e.surface === 'desktop') {
      const { Svg } = $.ui.resolve(e)

      return (
        <Box flexDirection="row" justifyContent="flex-end" alignItems="flex-start">
          {bubble}
          {pointer}
          <Svg key="zsemle-dog" source={spriteSvg(v.pose, S.skin)} alt={voice().alt} width={DESKTOP_FIGURE_PX} height={DESKTOP_FIGURE_PX} />
        </Box>
      )
    }

    // No Client here (vscode, mobile): the bubble alone, and nothing while quiet.
    if (!isOpen) {
      return next(e)
    }
    return (
      <Box flexDirection="row" justifyContent="flex-end">
        <Text color={COAT}>{voice().name} </Text>
        {bubble}
      </Box>
    )
  })
}
