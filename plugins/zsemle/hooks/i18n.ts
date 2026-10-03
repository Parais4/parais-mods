// The mod's language and the user's clock offset. Every text the mod shows or
// tells the model comes in Hungarian and English through `tr`; the hooks
// module sets the language from the `language` option at load. No `$` here.

export type Lang = 'hu' | 'en'

export const LANGS: readonly Lang[] = ['hu', 'en']

const current = {
  lang: 'hu' as Lang,
  // The machine's UTC offset as measured at session start; null until then.
  offsetMs: null as number | null,
}

export function setLang(lang: Lang): void {
  current.lang = lang
}

export function lang(): Lang {
  return current.lang
}

/** An option value as a language, Hungarian when it names none. */
export function asLang(value: unknown): Lang {
  return value === 'en' ? 'en' : 'hu'
}

/** The text in the current language. */
export function tr(hu: string, en: string): string {
  return current.lang === 'en' ? en : hu
}

export function setUtcOffset(ms: number | null): void {
  current.offsetMs = ms
}

export function utcOffset(): number | null {
  return current.offsetMs
}

/** A `date +%z` or PowerShell `Get-Date -Format zzz` answer ("+0200", "+02:00", "-05:00") in ms; null when unreadable. */
export function parseOffset(text: string): number | null {
  const m = /([+-])(\d{2}):?(\d{2})/.exec(text.trim())
  if (m === null) return null
  const sign = m[1] === '-' ? -1 : 1
  const minutes = Number(m[2]) * 60 + Number(m[3])
  if (minutes > 14 * 60) return null
  return sign * minutes * 60 * 1000
}
