// Pure helpers for the zsemle mod: limit verdicts, the texts (Hungarian and
// English, through `tr`), the content guard, command recognition, local time
// and the sprite drawing. No `$` here, so the tests can exercise all of it directly.

import type { Limit } from '../types'
import { lang, tr, utcOffset } from './i18n'
import { DEFAULT_SKIN, POSE_NAMES, skinOf } from './skins'
import type { Pose, SkinId } from './skins'

export type { Pose, SkinId } from './skins'

export const WARN_AT = 50
export const HIGH_AT = 75
export const CRITICAL_AT = 90
export const STOP_AT = 95
/** The limit thresholds Zsemle speaks up at, lowest first. */
export const THRESHOLDS = [WARN_AT, HIGH_AT, CRITICAL_AT, STOP_AT] as const
export const BARK_AFTER_MS = 3 * 60 * 1000
export const IDLE_AFTER_MS = 20 * 60 * 1000
export const REST_AFTER_MS = 90 * 60 * 1000
export const BREAK_GAP_MS = 15 * 60 * 1000
export const CONTEXT_TIRED_AT = 60
export const CONTEXT_COMPACT_AT = 80
export const CONTEXT_CRITICAL_AT = 90
export const FAIL_STREAK = 3

const NAMES: Record<string, [string, string]> = {
  five_hour: ['5 órás', '5-hour'],
  seven_day: ['heti', 'weekly'],
  spend_limit: ['költési', 'spend'],
}

const SHORT: Record<string, [string, string]> = {
  five_hour: ['5 órás', '5h'],
  seven_day: ['heti', 'week'],
  spend_limit: ['költés', 'spend'],
}

const pick = (pair: [string, string] | undefined, fallback: string) => (pair === undefined ? fallback : tr(pair[0], pair[1]))

export function limitName(kind: string): string {
  return pick(NAMES[kind], kind)
}

// Hungarian definite article: "az" before a vowel sound. Digits count by how
// they are read: 1 (egy) and 5 (öt) start with a vowel.
export function article(word: string): 'a' | 'az' {
  return /^[aáeéiíoóöőuúüű15]/i.test(word) ? 'az' : 'a'
}

/** "az 5 órás" in Hungarian, "the 5-hour" in English. */
const theName = (kind: string) => {
  const name = limitName(kind)
  return lang() === 'en' ? `the ${name}` : `${article(name)} ${name}`
}

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// ---- Local time -------------------------------------------------------------
// The module has no reliable time zone. In Hungarian, Central European time is
// computed: UTC+1, and UTC+2 from the last Sunday of March 01:00 UTC to the
// last Sunday of October 01:00 UTC. In English, the machine's offset measured
// at session start (i18n's utcOffset), UTC until it is known.

function lastSundayUtc(year: number, month: number): number {
  const last = new Date(Date.UTC(year, month + 1, 0, 1, 0, 0))
  return last.getTime() - last.getUTCDay() * 86400000
}

export function budapestOffsetMs(ms: number): number {
  const year = new Date(ms).getUTCFullYear()
  const isSummer = ms >= lastSundayUtc(year, 2) && ms < lastSundayUtc(year, 9)
  return (isSummer ? 2 : 1) * 3600000
}

const pad = (n: number) => String(n).padStart(2, '0')

export type LocalTime = { day: string; hm: string; weekday: number }

function at(ms: number, offsetMs: number): LocalTime {
  const d = new Date(ms + offsetMs)
  return {
    day: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
    hm: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`,
    weekday: d.getUTCDay(),
  }
}

export function budapest(ms: number): LocalTime {
  return at(ms, budapestOffsetMs(ms))
}

/** The user's local time: Budapest in Hungarian, the machine's offset in English. */
export function localTime(ms: number): LocalTime {
  return lang() === 'en' ? at(ms, utcOffset() ?? 0) : budapest(ms)
}

const ON_DAY = ['vasárnap', 'hétfőn', 'kedden', 'szerdán', 'csütörtökön', 'pénteken', 'szombaton']
const ON_DAY_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/** A moment as a phrase: "14:20-kor", "holnap 9:05-kor", "hétfőn 14:20-kor"; "at 14:20", "tomorrow at 9:05", "on Monday at 14:20". */
export function atPhrase(ms: number, nowMs: number): string {
  const then = localTime(ms)
  const today = localTime(nowMs)
  const tomorrow = localTime(nowMs + 86400000)
  if (lang() === 'en') {
    if (then.day === today.day) return `at ${then.hm}`
    if (then.day === tomorrow.day) return `tomorrow at ${then.hm}`
    return `on ${ON_DAY_EN[then.weekday] ?? ''} at ${then.hm}`
  }
  if (then.day === today.day) return `${then.hm}-kor`
  if (then.day === tomorrow.day) return `holnap ${then.hm}-kor`
  return `${ON_DAY[then.weekday] ?? ''} ${then.hm}-kor`
}

/** When a window resets (atPhrase), or null without a valid time. */
export function resetPhrase(resetsAt: string | undefined, nowMs: number): string | null {
  if (resetsAt === undefined) return null
  const ms = Date.parse(resetsAt)
  if (Number.isNaN(ms)) return null
  return atPhrase(ms, nowMs)
}

// ---- Limits -----------------------------------------------------------------

export type Level = 'none' | 'ok' | 'warn' | 'high' | 'critical' | 'stop'

export type Verdict = {
  level: Level
  worst: Limit | null
  message: string
  status: string
}

export function statusLine(limits: readonly Limit[]): string {
  return limits.map(l => `${pick(SHORT[l.kind], l.kind)} ${Math.round(l.percentUsed)}%`).join(' · ')
}

export function judge(limits: readonly Limit[], nowMs = Date.now()): Verdict {
  if (limits.length === 0) {
    return { level: 'none', worst: null, message: tr('Még nincs limitadat.', 'No limit reading yet.'), status: '' }
  }
  const worst = limits.reduce((a, b) => (b.percentUsed > a.percentUsed ? b : a))
  const name = theName(worst.kind)
  const pct = Math.round(worst.percentUsed)
  const status = statusLine(limits)
  const reset = resetPhrase(worst.resetsAt, nowMs)
  const resetText = reset === null ? '' : tr(` Visszaáll ${reset}.`, ` It resets ${reset}.`)

  if (worst.percentUsed > 100) {
    return {
      level: 'stop',
      worst,
      message: tr(
        `Túllépted ${name} limitet (${pct}%). Leállítottam, alszom.${resetText}`,
        `You went past ${name} limit (${pct}%). I stopped the work and went to sleep.${resetText}`,
      ),
      status,
    }
  }
  if (worst.percentUsed >= STOP_AT) {
    return {
      level: 'stop',
      worst,
      message: tr(
        `Elérted ${name} limit ${STOP_AT}%-át (${pct}%). Leállítottam, alszom.${resetText}`,
        `You reached ${STOP_AT}% of ${name} limit (${pct}%). I stopped the work and went to sleep.${resetText}`,
      ),
      status,
    }
  }
  if (worst.percentUsed >= CRITICAL_AT) {
    return {
      level: 'critical',
      worst,
      message: tr(
        `Majdnem elfogyott ${name} limit: ${pct}%. ${STOP_AT}%-nál leállítom a munkát, zárd le, ami félkész.${resetText}`,
        `${capital(name)} limit is almost gone: ${pct}%. At ${STOP_AT}% I stop the work, so wrap up what is half done.${resetText}`,
      ),
      status,
    }
  }
  if (worst.percentUsed >= HIGH_AT) {
    return {
      level: 'high',
      worst,
      message: tr(
        `Már ${name} limit ${HIGH_AT}%-ánál tartunk (${pct}%). A fontosra koncentrálj.${resetText}`,
        `We are past ${HIGH_AT}% of ${name} limit (${pct}%). Focus on what matters.${resetText}`,
      ),
      status,
    }
  }
  if (worst.percentUsed >= WARN_AT) {
    return {
      level: 'warn',
      worst,
      message: tr(
        `Figyelem: elérted ${name} limit ${WARN_AT}%-át (${pct}%).${resetText}`,
        `Heads up: you reached ${WARN_AT}% of ${name} limit (${pct}%).${resetText}`,
      ),
      status,
    }
  }
  return { level: 'ok', worst, message: tr('Minden rendben, figyelek.', 'All is well, I am watching.'), status }
}

/** A window that rose past one of the thresholds between two readings, the highest it passed. */
export type Crossing = { limit: Limit; threshold: number }

export function crossings(before: readonly Limit[], after: readonly Limit[]): Crossing[] {
  const out: Crossing[] = []
  for (const l of after) {
    const prev = before.find(b => b.kind === l.kind)?.percentUsed ?? 0
    const passed = THRESHOLDS.filter(t => prev < t && l.percentUsed >= t)
    const top = passed[passed.length - 1]
    if (top !== undefined) out.push({ limit: l, threshold: top })
  }
  return out
}

export function crossingNote(c: Crossing, nowMs: number): string {
  const name = theName(c.limit.kind)
  const reset = resetPhrase(c.limit.resetsAt, nowMs)
  const pct = Math.round(c.limit.percentUsed)
  return tr(
    `${capital(name)} limit ${c.threshold}%-a elfogyott (${pct}%${reset === null ? '' : `, visszaáll ${reset}`}).`,
    `${capital(name)} limit passed ${c.threshold}% (${pct}%${reset === null ? '' : `, resets ${reset}`}).`,
  )
}

/** Windows reset since the last reading: the use dropped by 10 points or more, or a later reset time came with less use. */
export function resets(before: readonly Limit[], after: readonly Limit[]): Limit[] {
  return after.filter(l => {
    const prev = before.find(b => b.kind === l.kind)
    if (prev === undefined) return false
    const dropped = prev.percentUsed - l.percentUsed >= 10
    const later =
      prev.resetsAt !== undefined &&
      l.resetsAt !== undefined &&
      Date.parse(l.resetsAt) - Date.parse(prev.resetsAt) > 30 * 60 * 1000
    return dropped || (later && l.percentUsed < prev.percentUsed)
  })
}

export function resetNote(l: Limit): string {
  const name = theName(l.kind)
  const pct = Math.round(l.percentUsed)
  return tr(`Visszaállt ${name} limit (most ${pct}%). Tele a tank!`, `${capital(name)} limit has reset (now ${pct}%). Full tank!`)
}

// ---- Pace: will a window run out before it resets? ---------------------------

const WINDOW_MS: Record<string, number> = {
  five_hour: 5 * 3600 * 1000,
  seven_day: 7 * 86400 * 1000,
}

export const PACE_FROM = 25
const PACE_MARGIN_MS = 15 * 60 * 1000

export type Forecast = { limit: Limit; exhaustAt: number; resetAt: number }

/** When the window runs out at the pace so far, if that is before its reset; null when it lasts. */
export function forecast(l: Limit, nowMs: number): Forecast | null {
  const span = WINDOW_MS[l.kind]
  if (span === undefined || l.resetsAt === undefined) return null
  const resetAt = Date.parse(l.resetsAt)
  if (Number.isNaN(resetAt) || resetAt <= nowMs) return null
  const elapsed = span - (resetAt - nowMs)
  if (elapsed < span * 0.1 || l.percentUsed < PACE_FROM || l.percentUsed >= STOP_AT) return null
  const exhaustAt = nowMs + ((100 - l.percentUsed) * elapsed) / l.percentUsed
  return exhaustAt < resetAt - PACE_MARGIN_MS ? { limit: l, exhaustAt, resetAt } : null
}

/** The window that runs out soonest at the current pace, if one does before its reset. */
export function worstForecast(limits: readonly Limit[], nowMs: number): Forecast | null {
  let best: Forecast | null = null
  for (const l of limits) {
    const f = forecast(l, nowMs)
    if (f !== null && (best === null || f.exhaustAt < best.exhaustAt)) best = f
  }
  return best
}

export function paceNote(f: Forecast, nowMs: number): string {
  const name = theName(f.limit.kind)
  const pct = Math.round(f.limit.percentUsed)
  return tr(
    `Ezzel a tempóval ${name} limit kb. ${atPhrase(f.exhaustAt, nowMs)} elfogy ` +
      `(most ${pct}%), pedig csak ${atPhrase(f.resetAt, nowMs)} áll vissza. ` +
      'Lassíts, vagy válts kisebb modellre.',
    `At this pace ${name} limit runs out ${atPhrase(f.exhaustAt, nowMs)} or so ` +
      `(now ${pct}%), but it only resets ${atPhrase(f.resetAt, nowMs)}. ` +
      'Slow down, or switch to a smaller model.',
  )
}

// ---- API errors, model fallback, compaction, cost -----------------------------

export type Alert = { message: string; isSevere: boolean }

/** What an API error that ended a turn means (StopFailure's `error`), in plain words. */
export function apiErrorNote(error: string): Alert {
  switch (error) {
    case 'rate_limit':
      return {
        message: tr(
          'Az API elutasította a kérést: elfogyott a használati keret (rate limit). Várni kell a visszaállásig.',
          'The API turned the request down: the usage allowance ran out (rate limit). We have to wait for the reset.',
        ),
        isSevere: true,
      }
    case 'overloaded':
      return {
        message: tr(
          'Az Anthropic szerverei most túlterheltek. Pár perc múlva próbáld újra.',
          "Anthropic's servers are overloaded right now. Try again in a few minutes.",
        ),
        isSevere: false,
      }
    case 'billing_error':
      return {
        message: tr('Számlázási hiba: nézd meg az előfizetést vagy a kreditegyenleget.', 'Billing error: check the subscription or the credit balance.'),
        isSevere: true,
      }
    case 'max_output_tokens':
      return {
        message: tr(
          'A válasz elérte a kimeneti token-limitet, a vége hiányozhat. Kérd, hogy folytassa.',
          'The answer hit the output token limit, its end may be missing. Ask it to continue.',
        ),
        isSevere: false,
      }
    case 'authentication_failed':
      return {
        message: tr('Lejárt vagy hibás a bejelentkezés: futtasd a /login parancsot.', 'The login expired or failed: run /login.'),
        isSevere: true,
      }
    case 'oauth_org_not_allowed':
    case 'account_on_hold':
    case 'verification_required':
      return {
        message: tr(`Gond van a fiókkal (${error}): nézd meg a fiókbeállításokat.`, `Something is wrong with the account (${error}): check the account settings.`),
        isSevere: true,
      }
    case 'invalid_request':
      return {
        message: tr(
          'Érvénytelen kérés, gyakran a túl hosszú kontextus miatt: a /compact segíthet.',
          'Invalid request, often from a context that is too long: /compact may help.',
        ),
        isSevere: false,
      }
    case 'server_error':
      return {
        message: tr('Szerverhiba az API oldalán. Kicsit később próbáld újra.', 'Server error on the API side. Try again a little later.'),
        isSevere: false,
      }
    case 'model_not_found':
      return {
        message: tr('A választott modell nem érhető el: válts a /model paranccsal.', 'The chosen model is not available: switch with /model.'),
        isSevere: true,
      }
    case 'cloud_credential_error':
      return {
        message: tr(
          'Felhős hitelesítési hiba (Bedrock / Vertex): nézd meg a hozzáférést.',
          'Cloud credential error (Bedrock / Vertex): check the access.',
        ),
        isSevere: true,
      }
    default:
      return { message: tr(`API-hiba (${error}): a kör elbukott.`, `API error (${error}): the turn failed.`), isSevere: false }
  }
}

/** A model id as people say it: "claude-opus-5-5-20260101" is "opus-5-5". */
export function shortModel(id: string): string {
  return id
    .replace(/^claude-/, '')
    .replace(/\[1m\]$/, '')
    .replace(/-\d{8}$/, '')
}

export function modelSwitchNote(from: string, to: string): string {
  return tr(
    `Automatikus modellváltás: ${shortModel(from)} helyett most ${shortModel(to)} dolgozik (tartalék vagy limit miatt).`,
    `Automatic model switch: ${shortModel(to)} now works in place of ${shortModel(from)} (a fallback or a limit).`,
  )
}

export function autoCompactNote(): string {
  return tr(
    'Megtelt a kontextus, automatikusan tömörítettem (auto-compact): a korábbi részletek már csak összefoglalóként vannak meg.',
    'The context filled up and was compacted automatically: the earlier details are now only a summary.',
  )
}

export function contextCriticalNote(percent: number): string {
  const pct = Math.round(percent)
  return tr(
    `A kontextus ${pct}%-on áll: hamarosan automatikus tömörítés jön, a részletek elveszhetnek.`,
    `The context is at ${pct}%: an automatic compaction is coming soon, and details may be lost.`,
  )
}

/** Session cost milestones in US dollars, spoken on API-key use (no rate-limit windows). */
export const COST_STEPS = [1, 5, 10, 20, 50, 100, 200] as const

export function costCrossed(before: number, after: number): number | null {
  const passed = COST_STEPS.filter(s => before < s && after >= s)
  return passed[passed.length - 1] ?? null
}

export function costNote(step: number, usd: number): string {
  return tr(
    `A munkamenet költsége átlépte a ${step} dollárt (most ${usd.toFixed(2)} $).`,
    `The session cost went past ${step} dollars (now $${usd.toFixed(2)}).`,
  )
}

export function contextNote(percent: number | null): string | null {
  if (percent === null || percent < CONTEXT_COMPACT_AT) return null
  const pct = Math.round(percent)
  return tr(`Fáradok: a kontextus ${pct}%-on áll. Ideje a /compact parancsnak.`, `I am getting tired: the context is at ${pct}%. Time for /compact.`)
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const min = Math.floor(total / 60)
  const sec = total % 60
  if (lang() === 'en') return min > 0 ? `${min}m ${sec}s` : `${sec}s`
  return min > 0 ? `${min}p ${sec}mp` : `${sec}mp`
}

export function shouldBark(elapsedMs: number, reason: string): boolean {
  return reason === 'answer' && elapsedMs >= BARK_AFTER_MS
}

// ---- Content guard ----------------------------------------------------------
// The characters the guard looks for are built from code points: a tool's
// input reaches the hooks with escapes already turned into characters, so a
// `\u` escape of them in this source would trip the guard on its own file.

const chars = (...codes: number[]) => String.fromCodePoint(...codes)

const DASH = new RegExp(
  [chars(0x2014), chars(0x2013), '&' + 'mdash;', '&' + 'ndash;', '&#' + '8212;', '&#' + '8211;', '&#x' + '2014;', '&#x' + '2013;'].join('|'),
  'gi',
)
const CODE_FILE = /\.(m?[jt]sx?|cjs|cts|py|css|scss|html?|vue|svelte|astro|json|ya?ml|toml|sql|sh|ps1|go|rs|java|kt|swift|c|cpp|h)$/i
const JS_FILE = /\.(m?[jt]sx?|cjs|cts|vue|svelte|astro)$/i
// A Hungarian or curly quote right where JS expects a string delimiter.
const QUOTE_DELIMITER = new RegExp(String.raw`(^|[=(,:[{?]|\breturn)\s*[` + chars(0x201e, 0x201c, 0x201d) + ']', 'm')
// Emoji: the pictographic planes, or anything forced to emoji presentation.
const EMOJI = new RegExp('[' + chars(0x1f000) + '-' + chars(0x1faff) + ']|' + chars(0xfe0f), 'u')
const SECRET_FILE = /(^|[\\/])(\.env[^\\/]*|\.dev\.vars)$/i
const SECRETS: readonly { name: [string, string]; re: RegExp }[] = [
  { name: ['Anthropic API-kulcs', 'An Anthropic API key'], re: /sk-ant-[A-Za-z0-9_-]{20,}/ },
  { name: ['Stripe éles kulcs', 'A live Stripe key'], re: /\b[sr]k_live_[0-9A-Za-z]{20,}/ },
  { name: ['AWS hozzáférési kulcs', 'An AWS access key'], re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: ['GitHub token', 'A GitHub token'], re: /\b(ghp|gho|ghs)_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}/ },
  { name: ['Slack token', 'A Slack token'], re: /\bxox[baprs]-[A-Za-z0-9-]{10,}/ },
  { name: ['Google API-kulcs', 'A Google API key'], re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { name: ['privát kulcs', 'A private key'], re: /-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/ },
]

const count = (text: string, re: RegExp) => (text.match(re) ?? []).length

export type GuardOptions = { dashes?: boolean }

/** Why Zsemle growls at this write, or null when it may go ahead. The dash rule is on unless `dashes` is false. */
export function guardReason(path: string, added: string, removed = '', options: GuardOptions = {}): string | null {
  if (options.dashes !== false && count(added, DASH) > count(removed, DASH)) {
    return tr(
      'hosszú gondolatjel (em vagy en dash) kerülne a fájlba. Használj vesszőt, kettőspontot vagy sima kötőjelet.',
      'a long dash (em or en dash) would go into the file. Use a comma, a colon or a plain hyphen.',
    )
  }
  if (JS_FILE.test(path) && QUOTE_DELIMITER.test(added) && !QUOTE_DELIMITER.test(removed)) {
    return tr(
      'magyar vagy görbe idézőjel állna string-határolóként a JS/TS kódban (SyntaxError). Csak ASCII \' vagy " jó.',
      'a curly or Hungarian quote would delimit a string in JS/TS code (SyntaxError). Only ASCII \' or " works.',
    )
  }
  if (CODE_FILE.test(path) && EMOJI.test(added) && !EMOJI.test(removed)) {
    return tr('emoji kerülne kódba vagy kommentbe.', 'an emoji would go into code or a comment.')
  }
  if (!SECRET_FILE.test(path)) {
    for (const s of SECRETS) {
      if (s.re.test(added) && !s.re.test(removed)) {
        return tr(
          `${s.name[0]} kerülne a fájlba. Titok csak .env-be vagy secret store-ba mehet.`,
          `${s.name[1]} would go into the file. Secrets belong in .env or a secret store only.`,
        )
      }
    }
  }
  return null
}

export type WriteParts = { path: string; added: string; removed: string }

/** What a file-writing tool call would add, or null for other tools. */
export function writeParts(tool: string, input: Record<string, unknown>): WriteParts | null {
  const str = (v: unknown) => (typeof v === 'string' ? v : '')
  if (tool === 'Write') {
    return { path: str(input.file_path), added: str(input.content), removed: '' }
  }
  if (tool === 'Edit') {
    return { path: str(input.file_path), added: str(input.new_string), removed: str(input.old_string) }
  }
  if (tool === 'MultiEdit' && Array.isArray(input.edits)) {
    const edits = input.edits as { new_string?: unknown; old_string?: unknown }[]
    return {
      path: str(input.file_path),
      added: edits.map(e => str(e.new_string)).join('\n'),
      removed: edits.map(e => str(e.old_string)).join('\n'),
    }
  }
  if (tool === 'NotebookEdit') {
    return { path: str(input.notebook_path), added: str(input.new_source), removed: '' }
  }
  return null
}

// ---- Commands ---------------------------------------------------------------

export function isTestCommand(cmd: string): boolean {
  return /\b(npm|pnpm|yarn|bun)\s+(run\s+)?test\b|\b(vitest|jest|pytest|playwright\s+test|mocha)\b|\bclaude\s+plugin\s+test\b|\bnode\s+--test\b|\bgo\s+test\b|\bcargo\s+test\b/.test(cmd)
}

// A command word at the start of the command or after a shell separator, so a
// script that merely mentions "vercel" in its text is not a deploy.
const AT_COMMAND = String.raw`(?:^|[;&|(]\s*|\bnpx\s+|\bbunx\s+|\bpnpm\s+dlx\s+)`

const DEPLOY = new RegExp(
  AT_COMMAND +
    String.raw`(?:wrangler\s+(?:pages\s+)?deploy\b|vercel(?:\s+(?:--prod\b|deploy\b|--yes\b)|\s*$|\s*[;&|])|netlify\s+deploy\b|firebase\s+deploy\b|fly\s+deploy\b)`,
  'm',
)

export function isDeployCommand(cmd: string): boolean {
  return DEPLOY.test(cmd.trim())
}

export function deployNote(): string {
  return tr(
    'Zsemle szimatol: deploy futott. A sikeres parancs nem bizonyít, kérdezd vissza az élő állapotot ' +
      '(curl az élő URL-re, a verzió vagy időbélyeg, a fő API státusza), mielőtt késznek mondod.',
    'Zsemle sniffs: a deploy ran. A successful command proves nothing; check the live state ' +
      '(curl the live URL, the version or timestamp, the main API status) before you call it done.',
  )
}

export function chaseNote(): string {
  return tr(
    'Zsemle: ez a parancs egymás után többször ugyanúgy elbukott. Ne futtasd újra változatlanul; ' +
      'állj meg, olvasd el a hibát, és keresd a gyökérokot, mielőtt újra próbálod.',
    'Zsemle: this command failed the same way several times in a row. Do not run it again unchanged; ' +
      'stop, read the error and find the root cause before you try again.',
  )
}

// ---- Sprite -----------------------------------------------------------------
// The figures live in skins.ts: 24 x 12 pixels per pose. A one-pixel outline
// and a pixel of padding make 28 x 14, drawn in quadrant blocks as 14 columns
// and 7 rows on a terminal, and as an Svg on the desktop.

function outline(rows: readonly string[]): string[] {
  const w = (rows[0]?.length ?? 0) + 2
  const h = rows.length + 2
  const grid = Array.from({ length: h }, (_, y) =>
    Array.from({ length: w }, (_, x) => rows[y - 1]?.[x - 1] ?? '.'),
  )
  const filled = (y: number, x: number) => {
    const c = grid[y]?.[x]
    return c !== undefined && c !== '.' && c !== 'O'
  }
  return grid.map(
    (row, y) =>
      '.' +
      row
        .map((c, x) =>
          c === '.' && (filled(y + 1, x) || filled(y - 1, x) || filled(y, x + 1) || filled(y, x - 1)) ? 'O' : c,
        )
        .join('') +
      '.',
  )
}

/**
 * A frame the figure can show: one of the 9 poses, or a skin's extra frame:
 * `work0`.. (while the model works), `long` (a turn past 3 minutes), `level0`
 * to `level3` (the resting face by fatigue).
 */
export type Frame = Pose | `work${number}` | 'long' | `level${number}`

const frameCache = new Map<SkinId, Record<string, readonly string[]>>()

/** A skin's frames, outlined and padded: the grids every drawing is made from. */
export function framesOf(skin: SkinId): Record<string, readonly string[]> {
  const cached = frameCache.get(skin)
  if (cached !== undefined) return cached
  const s = skinOf(skin)
  const out: Record<string, readonly string[]> = {}
  for (const p of POSE_NAMES) out[p] = outline(s.poses[p])
  ;(s.workFrames ?? []).forEach((g, i) => (out[`work${i}`] = outline(g)))
  if (s.longTurn !== undefined) out.long = outline(s.longTurn)
  ;(s.levels ?? []).forEach((g, i) => (out[`level${i}`] = outline(g)))
  frameCache.set(skin, out)
  return out
}

/** A skin's 9 poses, outlined and padded. */
export function posesOf(skin: SkinId): Record<Pose, readonly string[]> {
  return framesOf(skin) as Record<Pose, readonly string[]>
}

const rowsOf = (frame: Frame, skin: SkinId) => framesOf(skin)[frame] ?? framesOf(skin).awake ?? []

/** Zsemle's own poses (the default skin). */
export const POSES: Record<Pose, readonly string[]> = posesOf(DEFAULT_SKIN)

export const SPRITE_COLUMNS = (POSES.awake[0]?.length ?? 0) / 2
export const SPRITE_ROWS = POSES.awake.length / 2

const rgbRaw = (skin: SkinId, c: string): readonly [number, number, number] => skinOf(skin).palette[c] ?? [0, 0, 0]

// A faded figure (a ghost asleep) for the terminal, which has no opacity: every
// color mixed 60% toward a mid grey, which reads as see-through on dark and light alike.
const FADE = 0.6
let fading = false

const rgbOf = (skin: SkinId, c: string): readonly [number, number, number] => {
  const rgb = rgbRaw(skin, c)
  return fading ? (rgb.map(v => Math.round(v * (1 - FADE) + 128 * FADE)) as unknown as readonly [number, number, number]) : rgb
}

const hexRaw = (skin: SkinId, c: string) =>
  '#' +
  rgbRaw(skin, c)
    .map(v => v.toString(16).padStart(2, '0'))
    .join('')

const hex = (skin: SkinId, c: string) =>
  '#' +
  rgbOf(skin, c)
    .map(v => v.toString(16).padStart(2, '0'))
    .join('')

// Quadrant blocks by mask: top-left 8, top-right 4, bottom-left 2, bottom-right 1.
const QUADRANTS = [' ', '▗', '▖', '▄', '▝', '▐', '▞', '▟', '▘', '▚', '▌', '▙', '▀', '▜', '▛', '█']

/** One run of identical cells: its glyphs and colors, ready to draw as one Text. */
export type SpriteRun = { text: string; fg?: string; bg?: string }

/** A cell holds two colors (foreground, background); a third maps to the nearer of the two. */
function quadrantCell(skin: SkinId, px: string[]): { ch: string; fg?: string; bg?: string } {
  const distance = (a: string, b: string) => {
    const x = rgbOf(skin, a)
    const y = rgbOf(skin, b)
    return (x[0] - y[0]) ** 2 + (x[1] - y[1]) ** 2 + (x[2] - y[2]) ** 2
  }
  const counts = new Map<string, number>()
  for (const c of px) counts.set(c, (counts.get(c) ?? 0) + 1)
  const keep = [...counts.keys()]
    .sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0) || Number(a !== 'O') - Number(b !== 'O') || a.localeCompare(b))
    .slice(0, 2)
  const opaque = keep.filter(k => k !== '.')
  const cells = px.map(c =>
    keep.includes(c) ? c : (opaque.length > 0 ? opaque : keep).reduce((best, k) => (distance(c, k) < distance(c, best) ? k : best)),
  )
  const fg = cells.find(c => c !== '.')
  if (fg === undefined) return { ch: ' ' }
  const bg = cells.find(c => c !== fg && c !== '.')
  const mask = cells.reduce((m, c, i) => (c === fg ? m | [8, 4, 2, 1][i]! : m), 0)
  return { ch: QUADRANTS[mask] ?? ' ', fg: hex(skin, fg), bg: bg === undefined ? undefined : hex(skin, bg) }
}

const runCache = new Map<string, SpriteRun[][]>()

/** Grid rows as lines of runs: quadrant glyphs, at most two colors per cell; `faded` mixes every color toward grey. */
function runsFrom(rows: readonly string[], skin: SkinId, faded: boolean): SpriteRun[][] {
  fading = faded
  const lines: SpriteRun[][] = []
  const width = (rows[0]?.length ?? 0) / 2
  for (let cy = 0; cy < rows.length / 2; cy++) {
    const runs: SpriteRun[] = []
    for (let cx = 0; cx < width; cx++) {
      const px = (dy: number, dx: number) => rows[cy * 2 + dy]?.[cx * 2 + dx] ?? '.'
      const cell = quadrantCell(skin, [px(0, 0), px(0, 1), px(1, 0), px(1, 1)])
      const last = runs[runs.length - 1]
      if (last !== undefined && last.fg === cell.fg && last.bg === cell.bg) last.text += cell.ch
      else {
        // Client props are plain data: an absent color is left out, never undefined.
        const run: SpriteRun = { text: cell.ch }
        if (cell.fg !== undefined) run.fg = cell.fg
        if (cell.bg !== undefined) run.bg = cell.bg
        runs.push(run)
      }
    }
    lines.push(runs)
  }
  fading = false
  return lines
}

/** The frame as lines of runs: quadrant glyphs, at most two colors per cell; `faded` mixes every color toward grey. */
export function spriteRuns(pose: Frame, skin: SkinId = DEFAULT_SKIN, faded = false): SpriteRun[][] {
  const cacheKey = `${skin}:${pose}:${faded}`
  const cached = runCache.get(cacheKey)
  if (cached !== undefined) return cached
  const lines = runsFrom(rowsOf(pose, skin), skin, faded)
  runCache.set(cacheKey, lines)
  return lines
}

/**
 * The frame at half size: each 2 x 2 block of pixels becomes one pixel of its
 * weightiest opaque color (rare colors weigh more, the outline half), padded to an even height.
 */
export function halve(rows: readonly string[]): string[] {
  // Colors rare in the whole figure (eyes, nose, beak) outweigh the common ones,
  // so the face survives the halving.
  const total = new Map<string, number>()
  for (const r of rows) for (const c of r) if (c !== '.') total.set(c, (total.get(c) ?? 0) + 1)
  const out: string[] = []
  const width = rows[0]?.length ?? 0
  for (let y = 0; y < rows.length; y += 2) {
    let line = ''
    for (let x = 0; x < width; x += 2) {
      const px = [rows[y]?.[x], rows[y]?.[x + 1], rows[y + 1]?.[x], rows[y + 1]?.[x + 1]].filter(
        (c): c is string => c !== undefined && c !== '.',
      )
      if (px.length < 2) {
        line += '.'
        continue
      }
      const counts = new Map<string, number>()
      for (const c of px) counts.set(c, (counts.get(c) ?? 0) + (c === 'O' ? 0.5 : 1) / Math.sqrt(total.get(c) ?? 1))
      line += [...counts.entries()].sort((p, q) => q[1] - p[1] || p[0].localeCompare(q[0]))[0]?.[0] ?? '.'
    }
    out.push(line)
  }
  if (out.length % 2 === 1) out.push('.'.repeat(out[0]?.length ?? 0))
  return out
}

/** The mini figure's size in terminal cells: half the figure. */
export const MINI_COLUMNS = SPRITE_COLUMNS / 2
export const MINI_ROWS = Math.ceil(SPRITE_ROWS / 2)

/** The frame at half size as runs: the small helpers that stand for running subagents. */
export function miniRuns(pose: Frame, skin: SkinId = DEFAULT_SKIN): SpriteRun[][] {
  const cacheKey = `mini:${skin}:${pose}`
  const cached = runCache.get(cacheKey)
  if (cached !== undefined) return cached
  const lines = runsFrom(halve(rowsOf(pose, skin)), skin, false)
  runCache.set(cacheKey, lines)
  return lines
}

const svgCache = new Map<string, string>()

function svgFrom(rows: readonly string[], skin: SkinId, faded: boolean): string {
  const width = rows[0]?.length ?? 0
  const rects: string[] = []
  rows.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const c = row[x] ?? '.'
      let end = x + 1
      while (end < row.length && row[end] === c) end++
      if (c !== '.') rects.push(`<rect x="${x}" y="${y * 2}" width="${end - x}" height="2" fill="${hexRaw(skin, c)}"/>`)
      x = end
    }
  })
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${rows.length * 2}" shape-rendering="crispEdges"${faded ? ' opacity="0.35"' : ''}>` +
    rects.join('') +
    '</svg>'
  )
}

/**
 * The frame as an SVG document for surfaces that draw `Svg` (the desktop),
 * where quadrant glyphs do not tile. One sprite pixel is 1 x 2 user units, as
 * tall as a quadrant is in a terminal cell, so both surfaces show the same
 * figure. Each row's runs of one color are merged into a single rect.
 */
export function spriteSvg(pose: Frame, skin: SkinId = DEFAULT_SKIN, faded = false): string {
  const cacheKey = `${skin}:${pose}:${faded}`
  const cached = svgCache.get(cacheKey)
  if (cached !== undefined) return cached
  const svg = svgFrom(rowsOf(pose, skin), skin, faded)
  svgCache.set(cacheKey, svg)
  return svg
}

/** The half-size frame as an SVG document, for the desktop's mini figures. */
export function miniSvg(pose: Frame, skin: SkinId = DEFAULT_SKIN): string {
  const cacheKey = `mini:${skin}:${pose}`
  const cached = svgCache.get(cacheKey)
  if (cached !== undefined) return cached
  const svg = svgFrom(halve(rowsOf(pose, skin)), skin, false)
  svgCache.set(cacheKey, svg)
  return svg
}

// ---- Housekeeping: context save, reflect queue, commits, ports ---------------

export const SAVE_RESET_BELOW = 50
export const COMMIT_SNIFF_AT = 10
export const SCAN_EVERY_MS = 2 * 60 * 1000

export function contextSaveNote(percent: number, isSaved: boolean): string {
  const pct = Math.round(percent)
  if (isSaved) {
    return tr(`Kontextus ${pct}%: a "Folytatás innen" mentve, mehet a /compact.`, `Context ${pct}%: the status note is saved, /compact can go.`)
  }
  return tr(
    `Kontextus ${pct}%: előbb frissítsd a projekt HOME "Folytatás innen" blokkját, aztán /compact.`,
    `Context ${pct}%: first update the project's status note (HOME.md or INDEX.md), then /compact.`,
  )
}

export function contextSavePromptNote(): string {
  return tr(
    'Zsemle: a kontextus 80% fölött jár. Mielőtt tovább dolgozol, frissítsd a projekt HOME.md (vagy INDEX.md) ' +
      '"Folytatás innen" blokkját: hol tartunk, mi a következő lépés, mi vár másra. Utána javasold a felhasználónak a /compact parancsot.',
    'Zsemle: the context is above 80%. Before you go on, update the project status note (HOME.md or INDEX.md): ' +
      'where we are, what the next step is, what waits on others. Then suggest /compact to the user.',
  )
}

/** A project status card: the note the "Folytatás innen" block lives in. */
export function isProjectCard(path: string): boolean {
  return /(^|[\/])(HOME|INDEX|00-INDEX)\.md$/i.test(path)
}

/** Lines in the SIL queue: each one is a session that has not been reflected on yet. */
export function queueCount(text: string): number {
  return text.split(/\r?\n/).filter(l => l.trim() !== '').length
}

export function reflectNote(count: number): string {
  return tr(
    `A SIL-sorban ${count} feldolgozatlan reflexió vár. A munkamenet végén futtasd: /reflect`,
    `${count} unprocessed reflections wait in the queue. At the end of the session run: /reflect`,
  )
}

export function reflectPromptNote(count: number): string {
  return tr(
    `Zsemle: a SIL-sorban ${count} feldolgozatlan reflexió vár. A válaszod végén javasold a /reflect futtatását.`,
    `Zsemle: ${count} unprocessed reflections wait in the queue. At the end of your answer, suggest running /reflect.`,
  )
}

/** A prompt that sounds like the end of the session. */
export function isClosingPrompt(text: string): boolean {
  const t = text.trim().toLowerCase()
  // Unicode letter boundaries: "készíts" is not "kész".
  return (
    t.length < 80 &&
    /(?<!\p{L})(köszi|köszönöm|kösz|kész|ennyi|vége|mára|jó éjt|jóéjt|szia|viszlát|bye|thanks|thank you|good night|that's all|done for today)(?!\p{L})/u.test(t)
  )
}

/** Changed files in `git status --porcelain` output. */
export function porcelainCount(text: string): number {
  return text.split(/\r?\n/).filter(l => l.trim() !== '').length
}

export function commitNote(count: number): string {
  return tr(`Szimat: ${count} módosított fájl vár commitra. Ideje egy commitnak?`, `Sniff: ${count} changed files wait for a commit. Time for one?`)
}

export function commitBucket(count: number): number {
  return Math.floor(count / COMMIT_SNIFF_AT) * COMMIT_SNIFF_AT
}

export function isDevServerCommand(cmd: string): boolean {
  return /\b(wrangler|vite|next|astro|nuxt|remix|vercel)\s+dev\b|\b(npm|pnpm|yarn|bun)\s+(run\s+)?(dev|start|preview)\b|\bpython\s+-m\s+http\.server\b|\bserve\b/.test(cmd)
}

const DEV_PORT = (port: number) =>
  (port >= 3000 && port <= 3010) || (port >= 4000 && port <= 4010) || port === 4173 || port === 4321 ||
  (port >= 5000 && port <= 5010) || (port >= 5173 && port <= 5180) || (port >= 8000 && port <= 8010) ||
  port === 8080 || port === 8081 || (port >= 8787 && port <= 8790) || port === 8888

export type PortUse = Map<number, Set<number>>

/** Listening TCP ports and their PIDs from Windows `netstat -ano`. */
export function parseNetstat(text: string): PortUse {
  const use: PortUse = new Map()
  for (const line of text.split(/\r?\n/)) {
    // A listening socket has no remote end (0.0.0.0:0 or [::]:0); the state word
    // itself is localized on some Windows installs, so it is not matched.
    const m = /^\s*TCP\s+\S*:(\d+)\s+(?:0\.0\.0\.0|\[::\]):0\s+\S+\s+(\d+)\s*$/i.exec(line)
    if (m === null) continue
    const port = Number(m[1])
    const pid = Number(m[2])
    if (!use.has(port)) use.set(port, new Set())
    use.get(port)?.add(pid)
  }
  return use
}

/** Listening TCP ports and their PIDs from `lsof -nP -iTCP -sTCP:LISTEN`. */
export function parseLsof(text: string): PortUse {
  const use: PortUse = new Map()
  for (const line of text.split(/\r?\n/).slice(1)) {
    const cols = line.trim().split(/\s+/)
    const pid = Number(cols[1])
    const name = cols.find(c => /:\d+$/.test(c))
    if (!Number.isFinite(pid) || name === undefined) continue
    const port = Number(name.slice(name.lastIndexOf(':') + 1))
    if (!use.has(port)) use.set(port, new Set())
    use.get(port)?.add(pid)
  }
  return use
}

export type PortClash = { port: number; pids: number[] }

/** Dev ports with more than one process listening: one of them serves stale code. */
export function portClashes(use: PortUse): PortClash[] {
  return [...use.entries()]
    .filter(([port, pids]) => DEV_PORT(port) && pids.size > 1)
    .map(([port, pids]) => ({ port, pids: [...pids].sort((a, b) => a - b) }))
    .sort((a, b) => a.port - b.port)
}

export function portNote(clash: PortClash): string {
  const pids = clash.pids.join(', ')
  return tr(
    `Portőr: a ${clash.port}-es porton ${clash.pids.length} folyamat figyel (PID ${pids}). Az egyik elavult kódot szolgálhat ki.`,
    `Port guard: ${clash.pids.length} processes listen on port ${clash.port} (PID ${pids}). One of them may serve stale code.`,
  )
}

export function portModelNote(clash: PortClash): string {
  const pids = clash.pids.join(', ')
  const ps =
    "Get-CimInstance Win32_Process | Where-Object { $_.ProcessId -in @(" + clash.pids.join(',') + ') } | Select ProcessId, CommandLine'
  return tr(
    `Zsemle portőr: a ${clash.port}-es porton ${clash.pids.length} folyamat figyel (PID ${pids}), ` +
      'az egyik elavult kódot szolgálhat ki. Állítsd le a régieket, mielőtt a dev-szerver válaszára építesz. ' +
      `Windowson: ${ps}, aztán Stop-Process -Id <régi PID> -Force (a saját shelledet ne).`,
    `Zsemle port guard: ${clash.pids.length} processes listen on port ${clash.port} (PID ${pids}), ` +
      'one of them may serve stale code. Stop the old ones before you rely on the dev server. ' +
      `On Windows: ${ps}, then Stop-Process -Id <old PID> -Force (not your own shell).`,
  )
}

// ---- Daily stats ------------------------------------------------------------

export type DayStats = {
  turns: number
  tools: number
  longestMs: number
  tests: number
  deploys: number
  growls: number
  pets: number
  barks: number
}

export const EMPTY_STATS: DayStats = { turns: 0, tools: 0, longestMs: 0, tests: 0, deploys: 0, growls: 0, pets: 0, barks: 0 }

export function statsText(day: string, s: DayStats, name = 'Zsemle'): string {
  const longest = s.longestMs > 0 ? formatDuration(s.longestMs) : '-'
  if (lang() === 'en') {
    return [
      `${name}'s stats for the day (${day}):`,
      `  turns:            ${s.turns}`,
      `  tool calls:       ${s.tools}`,
      `  longest turn:     ${longest}`,
      `  green test runs:  ${s.tests}`,
      `  deploys:          ${s.deploys}`,
      `  growls (guard):   ${s.growls}`,
      `  barks:            ${s.barks}`,
      `  pets:             ${s.pets}`,
    ].join('\n')
  }
  return [
    `${name} napi statisztikája (${day}):`,
    `  körök:            ${s.turns}`,
    `  tool-hívások:     ${s.tools}`,
    `  leghosszabb kör:  ${longest}`,
    `  zöld tesztfutás:  ${s.tests}`,
    `  deploy:           ${s.deploys}`,
    `  morgás (őr):      ${s.growls}`,
    `  ugatás:           ${s.barks}`,
    `  simogatás:        ${s.pets}`,
  ].join('\n')
}
