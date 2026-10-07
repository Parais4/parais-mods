// Pure helpers for Zsemle's optional features: fatigue, the weekly budget,
// model advice, the context saver, the commit guard, the loop watch, the
// morning brief, the lesson sniff, the weekly activity chart and the day
// summary. Each feature can be switched off (FEATURES). No `$` here.

import type { Limit } from '../types'
import { lang, tr } from './i18n'

// ---- Switches ---------------------------------------------------------------

export type Feature =
  | 'fatigueLook'
  | 'budgetPlanner'
  | 'modelAdvice'
  | 'contextSaver'
  | 'commitGuard'
  | 'loopWatch'
  | 'morningBrief'
  | 'lessonSniff'
  | 'daySummary'

export const FEATURES: readonly Feature[] = [
  'fatigueLook',
  'budgetPlanner',
  'modelAdvice',
  'contextSaver',
  'commitGuard',
  'loopWatch',
  'morningBrief',
  'lessonSniff',
  'daySummary',
]

const FEATURE_TEXT: Record<Feature, [string, string, string]> = {
  fatigueLook: ['faradtsag', 'a figura fárad, ahogy a limit fogy', 'the figure tires as the limit runs low'],
  budgetPlanner: ['koltsegvetes', 'heti keret napi adagra osztva, esti figyelmeztetés', 'weekly allowance split into daily shares, evening warning'],
  modelAdvice: ['modelltanacs', 'egyszerű feladatnál kisebb modellt javasol', 'suggests a smaller model for simple tasks'],
  contextSaver: ['kontextusfek', '70% kontextus fölött tömörebb munkát kér', 'asks for leaner work above 70% context'],
  commitGuard: ['commitor', 'git commit előtt szól, ha a módosítás óta nem futott teszt', 'warns before git commit when no test ran since the last edit'],
  loopWatch: ['hurokfigyelo', 'szól, ha egy fájlt egy körön belül ötödször szerkeszt', 'warns when a file is edited a fifth time in one turn'],
  morningBrief: ['reggeli', 'a nap első promptjánál rövid áttekintés', 'a short brief with the first prompt of the day'],
  lessonSniff: ['tanulsag', 'harmadszor visszatérő hibánál tanulság rögzítését javasolja', 'suggests recording a lesson when an error comes back a third time'],
  daySummary: ['napzaro', 'búcsúzáskor napzáró összefoglaló', 'a day summary when you sign off'],
}

/** The Hungarian command word of a feature (`/zsemle kapcsolo <word> ki`). */
export function featureWord(f: Feature): string {
  return FEATURE_TEXT[f][0]
}

export function featureLabel(f: Feature): string {
  return tr(FEATURE_TEXT[f][1], FEATURE_TEXT[f][2])
}

const fold = (s: string) => s.trim().toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')

/** The feature a word names: its option key or its Hungarian word, accents and case aside. */
export function findFeature(word: string): Feature | null {
  const w = fold(word)
  return FEATURES.find(f => fold(f) === w || fold(FEATURE_TEXT[f][0]) === w) ?? null
}

// ---- Fatigue ----------------------------------------------------------------

/** 0 under 50% of the worst window, 1 from 50%, 2 from 75%, 3 from 90%. */
export function fatigueLevel(limits: readonly Limit[]): number {
  const worst = limits.reduce((m, l) => Math.max(m, l.percentUsed), 0)
  return worst >= 90 ? 3 : worst >= 75 ? 2 : worst >= 50 ? 1 : 0
}

// ---- Weekly budget ----------------------------------------------------------

const DAY_MS = 86400000

/** What a day of the weekly window may use: the rest of the window over the days left, today included. */
export type Budget = { allowance: number; usedToday: number; startPct: number; daysLeft: number }

/**
 * The day's share of the weekly window. `startPct` is the weekly use at the
 * first reading of the day, `dayStartMs` that local day's midnight in ms.
 */
export function dailyBudget(week: Limit, startPct: number, dayStartMs: number): Budget | null {
  if (week.resetsAt === undefined) return null
  const resetAt = Date.parse(week.resetsAt)
  if (Number.isNaN(resetAt)) return null
  const daysLeft = Math.max(1, Math.ceil((resetAt - dayStartMs) / DAY_MS))
  const allowance = Math.max(0, (100 - startPct) / daysLeft)
  return { allowance, usedToday: Math.max(0, week.percentUsed - startPct), startPct, daysLeft }
}

export function budgetLine(b: Budget): string {
  const a = b.allowance.toFixed(1)
  const u = b.usedToday.toFixed(1)
  return tr(
    `Napi adag a heti keretből: ${a}% (még ${b.daysLeft} nap), ma eddig ${u}%.`,
    `Daily share of the weekly allowance: ${a}% (${b.daysLeft} days left), used today ${u}%.`,
  )
}

export function budgetOverNote(b: Budget): string {
  const a = b.allowance.toFixed(1)
  const u = b.usedToday.toFixed(1)
  return tr(
    `Ma ${u}%-ot használtál a heti keretből, a napi adag ${a}% lett volna. Holnap lassabban, hogy kitartson a hét végéig.`,
    `Today you used ${u}% of the weekly allowance against a daily share of ${a}%. Go easier tomorrow so it lasts the week.`,
  )
}

// ---- Model advice -----------------------------------------------------------

const SIMPLE =
  /(?<!\p{L})(átnevez\p{L}*|nevezd át|rename|formáz\p{L}*|format\p{L}*|elírás\p{L}*|typo\p{L}*|fordítsd|translate|komment\p{L}*|comment\p{L}*|behúz\p{L}*|indent\p{L}*|rendezd|sort|lint\p{L}*|helyesírás|spelling|import\p{L}*|szóköz\p{L}*|whitespace)(?!\p{L})/iu

/** A prompt that asks for a small mechanical change. */
export function isSimpleTask(text: string): boolean {
  const t = text.trim()
  return t.length > 0 && t.length < 240 && !t.startsWith('/') && SIMPLE.test(t)
}

export const isBigModel = (model: string) => /opus/i.test(model)

export function modelAdviceNote(model: string): string {
  return tr(
    `Ez egyszerű feladatnak tűnik, és most ${model} dolgozik. Egy kisebb modell (/model sonnet vagy haiku) kímélné a keretet.`,
    `This looks like a simple task, and ${model} is working now. A smaller model (/model sonnet or haiku) would spare the allowance.`,
  )
}

// ---- Context saver ----------------------------------------------------------

export const CONTEXT_SAVER_AT = 70

export function contextSaverNote(): string {
  return tr(
    'Zsemle: a kontextus 70% fölött jár. Dolgozz takarékosan: tömör válaszok, fájlokból csak a szükséges részt olvasd be (offset/limit), kerüld a hosszú parancskimeneteket, és ne ismételd meg, amit már láttál.',
    'Zsemle: the context is above 70%. Work lean: short answers, read only the needed part of files (offset/limit), avoid long command output, and do not repeat what you have already seen.',
  )
}

// ---- Commit guard -----------------------------------------------------------

// Global options may come first, with a value for -C and -c: git -C repo commit, git -c a=b commit.
const COMMIT_AT = /(?:^|[;&|(]\s*)git\s+(?:(?:-[Cc]\s+\S+|--?[\w-]+(?:=\S+)?)\s+)*commit\b/m

export function isCommitCommand(cmd: string): boolean {
  return COMMIT_AT.test(cmd.trim())
}

const TEMP_DIR = /^(?:\/tmp\/|\$\{?TMPDIR\b|%TE?MP%|\$env:TE?MP\b|\$\(mktemp\b|[A-Za-z]:[\\/](?:[^\\/]+[\\/])*AppData[\\/]Local[\\/]Temp[\\/]|\/[a-z]\/Users\/[^/]+\/AppData\/Local\/Temp\/)/i
const unquote = (s: string) => s.replace(/^["']|["']$/g, '')

/**
 * A commit into a throwaway repository: one the same command makes (`git init` before the commit), or one in a
 * temp folder (`cd`, `Set-Location`, `Push-Location` or `git -C` to mktemp, /tmp, %TEMP%, $env:TEMP,
 * AppData/Local/Temp). Such a commit is a test harness, not the project's history, so the commit guard lets it
 * through. A move into a real folder keeps it guarded.
 */
export function isThrowawayCommit(cmd: string): boolean {
  const m = COMMIT_AT.exec(cmd)
  if (m === null) return false
  const before = cmd.slice(0, m.index)
  if (/\bgit\s+init\b/.test(before)) return true
  const tempVars = [...cmd.matchAll(/\b(\w+)=["']?\$\(mktemp\b/g)].map(v => v[1])
  const isTemp = (raw: string) => {
    const p = unquote(raw)
    const v = /^\$\{?(\w+)\}?/.exec(p)
    return TEMP_DIR.test(p) || (v !== null && tempVars.includes(v[1]))
  }
  const target =
    /\s-C\s+("[^"]*"|'[^']*'|\S+)/.exec(m[0])?.[1] ??
    [...before.matchAll(/(?:^|[\s;&|(])(?:cd|pushd|Set-Location|Push-Location|sl)\s+(?:-(?:Literal)?Path\s+)?("[^"]*"|'[^']*'|[^\s;&|)]+)/gi)].pop()?.[1]
  return target !== undefined && isTemp(target)
}

export function commitGuardNote(): string {
  return tr(
    'Zsemle commit-őr: a legutóbbi módosítás óta nem futott teszt. Futtasd a teszteket, vagy ha szándékos, add ki újra ugyanezt a commitot (2 percen belül átengedem).',
    'Zsemle commit guard: no test ran since the last edit. Run the tests, or if this is on purpose, run the same commit again (I let it through within 2 minutes).',
  )
}

// ---- Loop watch -------------------------------------------------------------

export const LOOP_EDITS = 5

export function loopNote(path: string, edits: number): string {
  const name = path.split(/[\\/]/).pop() ?? path
  return tr(
    `Zsemle hurokfigyelő: a(z) ${name} fájlt ebben a körben már ${edits}. alkalommal szerkeszted. Állj meg, nézd meg egészben, mi a cél, és egy átgondolt lépésben javítsd.`,
    `Zsemle loop watch: this is edit number ${edits} of ${name} in this turn. Stop, look at the whole file and the goal, and fix it in one considered step.`,
  )
}

export function loopBubble(path: string, edits: number): string {
  const name = path.split(/[\\/]/).pop() ?? path
  return tr(`Körbe-körbe javítunk: ${name}, ${edits}. szerkesztés ebben a körben.`, `Going in circles: ${name}, edit number ${edits} in this turn.`)
}

// ---- Lesson sniff -----------------------------------------------------------

/** An error's signature: its first meaningful line without numbers, paths and quotes, so the same failure matches across runs. */
export function errorSignature(text: string): string | null {
  const line = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .find(l => l.length > 8 && /[A-Za-z]/.test(l))
  if (line === undefined) return null
  return line
    .replace(/[A-Za-z]:[\\/][^\s'"]*/g, '<path>')
    .replace(/(^|\s)\/[^\s'"]+/g, '$1<path>')
    .replace(/'[^']*'|"[^"]*"|`[^`]*`/g, '<q>')
    .replace(/\d+/g, '<n>')
    .replace(/\s+/g, ' ')
    .slice(0, 160)
}

export const LESSON_AFTER = 3

export function lessonNote(signature: string, count: number): string {
  return tr(
    `Zsemle tanulság-szimat: ez a hiba már ${count}. alkalommal jön elő ("${signature}"). Ha megvan a javítás, a válaszod végén javasold a felhasználónak, hogy rögzítse tanulságként (/reflect vagy a projekt LESSONS.md-je).`,
    `Zsemle lesson sniff: this error came back for the ${count}th time ("${signature}"). Once it is fixed, suggest at the end of your answer that the user records it as a lesson (/reflect or the project's LESSONS.md).`,
  )
}

export function lessonBubble(count: number): string {
  return tr(`Ez a hiba már ${count}. alkalommal jön elő: érdemes tanulságként rögzíteni.`, `This error is back for the ${count}th time: worth recording as a lesson.`)
}

// ---- Morning brief ----------------------------------------------------------

export type ProjectRow = { name: string; status: string; note: string }

/** Rows of a markdown project table: `| [[path\|Name]] | status | ... | blocker | ... |`. */
export function parseProjectTable(text: string): ProjectRow[] {
  const rows: ProjectRow[] = []
  for (const line of text.split(/\r?\n/)) {
    if (!line.startsWith('|') || /^\|\s*-/.test(line)) continue
    const cells = line
      .replace(/\\\|/g, '\u0000')
      .split('|')
      .slice(1, -1)
      .map(c => c.replace(/\u0000/g, '|').trim())
    if (cells.length < 2) continue
    const nameCell = cells[0] ?? ''
    const m = /\[\[[^\]|]*\|([^\]]+)\]\]/.exec(nameCell) ?? /\[\[([^\]]+)\]\]/.exec(nameCell)
    const name = (m?.[1] ?? nameCell).trim()
    const status = (cells[1] ?? '').trim()
    if (name === '' || /^(projekt|project|name|név)$/i.test(name)) continue
    rows.push({ name, status, note: (cells[4] ?? '').trim() })
  }
  return rows
}

const WAITING = /^(deploy-var|blokkolt|blocked|ready|review)$/i

export function briefNote(opts: { yesterday: string | null; projects: ProjectRow[]; budget: string | null; reflect: number }): string {
  const parts: string[] = []
  if (opts.yesterday !== null && opts.yesterday.trim() !== '') {
    parts.push(tr(`Tegnapi napzáró: ${opts.yesterday.trim()}`, `Yesterday's summary: ${opts.yesterday.trim()}`))
  }
  const waiting = opts.projects.filter(p => WAITING.test(p.status))
  if (waiting.length > 0) {
    const list = waiting.map(p => `${p.name} (${p.status}${p.note !== '' && p.note !== '-' ? `: ${p.note}` : ''})`).join('; ')
    parts.push(tr(`Kiadásra vagy másra váró projektek: ${list}.`, `Projects waiting to ship or on others: ${list}.`))
  }
  if (opts.budget !== null) parts.push(opts.budget)
  if (opts.reflect > 0) parts.push(tr(`${opts.reflect} feldolgozatlan reflexió vár (/reflect).`, `${opts.reflect} unprocessed reflections wait (/reflect).`))
  if (parts.length === 0) return ''
  return tr(
    `Zsemle reggeli brief (ez a nap első promptja; a válaszod elején 3-5 sorban mondd el a felhasználónak, aztán folytasd a kérését): ${parts.join(' ')}`,
    `Zsemle morning brief (this is the first prompt of the day; tell the user in 3-5 lines at the start of your answer, then carry on with the request): ${parts.join(' ')}`,
  )
}

// ---- Day summary ------------------------------------------------------------

export function daySummaryNote(): string {
  return tr(
    'Zsemle napzáró: a válaszod végén foglald össze 3-5 pontban a mai munkát (mi készült el, mi maradt nyitva, mi a következő lépés). Ha van projekt HOME.md vagy INDEX.md kártya, frissítsd a "Folytatás innen" blokkját is.',
    'Zsemle day summary: at the end of your answer, sum up today\'s work in 3-5 points (what got done, what is still open, what comes next). If the project has a HOME.md or INDEX.md status note, update it too.',
  )
}

/** The tail of an answer worth keeping as the day summary: its last 600 characters, on whole lines. */
export function summaryOf(answer: string): string {
  const t = answer.trim()
  if (t.length <= 600) return t
  const tail = t.slice(-600)
  const nl = tail.indexOf('\n')
  return (nl >= 0 ? tail.slice(nl + 1) : tail).trim()
}

// ---- Weekly activity chart ----------------------------------------------------

/** Tool calls per hour of one day: 24 counts. */
export type DayActivity = number[]

const SHADES = [' ', '.', ':', '+', '#']

/** A 24-column chart, one row per day (oldest first), a header of hours and the busiest hour. */
export function weekChart(days: { day: string; hours: DayActivity }[]): string {
  const max = Math.max(1, ...days.flatMap(d => d.hours))
  const shade = (n: number) => (n <= 0 ? SHADES[0] : SHADES[Math.min(SHADES.length - 1, 1 + Math.floor(((n - 1) / max) * (SHADES.length - 1)))])
  const header = '            ' + Array.from({ length: 24 }, (_, h) => (h % 3 === 0 ? String(h).padEnd(3) : '')).join('')
  const lines = days.map(d => {
    const total = d.hours.reduce((a, b) => a + b, 0)
    return `${d.day.slice(5)}  ${weekday(d.day)} |${d.hours.map(shade).join('')}| ${total}`
  })
  const byHour = Array.from({ length: 24 }, (_, h) => days.reduce((a, d) => a + (d.hours[h] ?? 0), 0))
  const best = byHour.indexOf(Math.max(...byHour))
  const total = byHour.reduce((a, b) => a + b, 0)
  const bestLine =
    total === 0
      ? tr('Még nincs adat erről a hétről.', 'No data for this week yet.')
      : tr(`A legaktívabb órád: ${best}:00 és ${best + 1}:00 között. Összesen ${total} eszközhívás.`, `Your busiest hour: ${best}:00 to ${best + 1}:00. ${total} tool calls in all.`)
  return [header, ...lines, '', bestLine, tr('(jelmagyarázat: . kevés, : közepes, + sok, # a legtöbb)', '(legend: . a little, : some, + a lot, # the most)')].join('\n')
}

const WEEKDAYS_HU = ['V', 'H', 'K', 'Sze', 'Cs', 'P', 'Szo']
const WEEKDAYS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function weekday(day: string): string {
  const d = new Date(`${day}T12:00:00Z`).getUTCDay()
  return ((lang() === 'en' ? WEEKDAYS_EN : WEEKDAYS_HU)[d] ?? '').padEnd(3)
}

// ---- Ask ----------------------------------------------------------------------

export function askSystem(facts: string): string {
  return tr(
    'Te Zsemle vagy, egy Claude Code társfigura. Röviden (legfeljebb 5 mondat), barátságosan, magyarul válaszolj a felhasználó kérdésére a lenti tények alapján. Ha a válasz nincs a tényekben, mondd meg őszintén. Ne használj hosszú gondolatjelet.\n\nTények:\n' +
      facts,
    'You are Zsemle, a Claude Code companion. Answer the user\'s question briefly (at most 5 sentences), in a friendly way, in English, from the facts below. If the answer is not in the facts, say so honestly. Do not use em or en dashes.\n\nFacts:\n' +
      facts,
  )
}
