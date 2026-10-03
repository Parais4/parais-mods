# Zsemle

A pixel-art companion for Claude Code that sits above the prompt and keeps an eye on your usage limits. It shows as quadrant-block pixel art in the terminal and as an SVG in the desktop app's Code tab, the same figure on both.

*Magyarul lent.*

## Figures

| id | figure |
| --- | --- |
| `zsemle` | golden retriever puppy (default) |
| `cirmi` | grey tabby cat |
| `trutyi` | jelly slime with big eyes |
| `kapocs` | paperclip with big eyes |

Pick one with `/zsemle skin` (a pane with previews, click to choose), `/zsemle skin cat`, the bubble's `skin` button, or the `zsemle.skin` row in `/config`.

## Limit watch

- 5-hour, weekly and spend limits: a heads-up at 50%, a stronger one at 75%, red at 90%, and at 95% it stops tool calls and prompts (`/zsemle wake` overrides it for the session). Every threshold crossed raises a toast with the reset time.
- Pace forecast: if the window runs out before it resets at the current pace, it tells you when.
- Resets: it cheers when a window is full again.
- API errors that end a turn: rate limit, overload, output token limit, billing, login, model not available, server error.
- Automatic model switch (fallback) and automatic compaction.
- Context: tired at 60%, asks for a status note before `/compact` at 80%, warns of the coming auto-compact at 90%.
- On API-key use (no subscription windows) it watches the session cost: 1, 5, 10, 20, 50, 100 and 200 dollars.
- A limit line under the prompt (`/zsemle bar off|on`) and a full report: `/zsemle limit`.

## Also

- A sound when a turn longer than 3 minutes finishes (mute with `/zsemle mute`).
- Content guard: curly quotes as JS string delimiters, emoji in code, secrets (API keys, tokens, private keys) outside `.env`; optionally em and en dashes (`guardDashes`).
- Sniffs after a deploy and reminds the model to check the live state, calls out a command that keeps failing the same way, warns when two dev servers share a port, nudges toward a commit when many files are changed.
- Sleeps when idle, reminds you to take a break after 90 minutes, can be petted, keeps daily stats (`/zsemle stats`).

Commands: `/zsemle` (help), `/zsemle limit`, `/zsemle skin`, `/zsemle stats`, `/zsemle ok`, `/zsemle mute`, `/zsemle sound`, `/zsemle bar off|on`, `/zsemle guard off|on`. Hungarian command words work too.

## Settings

In `/config`, or under `pluginConfigs.zsemle.options` in `~/.claude/settings.json`:

- `language`: `en` (default) or `hu`.
- `skin`: the default figure.
- `guardDashes`: also block em and en dashes in writes (off by default).
- `reflectQueue`: optional path of a log whose non-empty lines are unprocessed `/reflect` markers (empty turns the reminder off).

## Install

```
/plugin marketplace add Parais4/parais-mods
/plugin install zsemle@parais-mods
```

## Notes

Zsemle is a fan-made mod, not affiliated with or endorsed by Anthropic. Sounds are CC0, see `sounds/CREDITS.md`. Code under the MIT license, see `LICENSE`.

---

## Magyarul

Pixelgrafikus társfigura a Claude Code promptja fölött: figyeli a használati limiteket (50/75/90/95%, tempó-előrejelzés, keret-visszaállás, API-hibák, automatikus modellváltás és tömörítés, költség API-kulcsnál), őrzi a fájlírásokat, és szól, ha valami fontos történik. Négy figura: `zsemle` (kutya), `cirmi` (macska), `trutyi` (slime), `kapocs` (gemkapocs). Magyar nyelvhez a `/config`-ban a `language` legyen `hu`; a parancsok magyarul is működnek (`/zsemle nemit`, `/zsemle simi`, `/zsemle sor ki`).
