# Zsemle privacy policy

Last updated: 2026-10-04

Zsemle is a Claude Code plugin (a "mod") made by Parais Gergely. This page says what data it handles. In short: Zsemle collects nothing, sends nothing to its author or to any third party, and keeps its few notes on your own machine.

## What Zsemle reads

While it runs inside your Claude Code session, Zsemle reads, without storing them except as listed below:

- the usage figures Claude Code gives plugins: your rate-limit windows (percent used, reset time), the context window fill and the session cost;
- the tool calls of the session, to react to them: the tool name, the text of shell commands, and for file-writing tools the file path and the text about to be written (the content guard checks that text for secrets, emoji in code and curly quotes in JavaScript strings);
- the text of the prompts you submit, only to notice a sign-off ("thanks, that's all") or a simple task;
- the final answer of a turn, only when the day-summary feature asked for a summary in that turn;
- the current model name;
- the session transcript (the last 60 messages, each cut to 400 characters), only when you run `/zsemle summary`.

Zsemle reads no files of yours.

## What Zsemle sends, and where

Zsemle has no server and makes no network requests of its own. There is no telemetry, no analytics and no tracking.

Two commands make one model call each, only when you run them, through your own Claude Code session and account (the same connection your session already uses, counted in your usage):

- `/zsemle ask <question>` sends your question with a short report of your own limits and today's stats;
- `/zsemle summary` sends the trimmed transcript described above.

These calls are handled by Anthropic under your own agreement with Anthropic, like the rest of your Claude Code session.

## What Zsemle stores

Only in Claude Code's local plugin store on your machine, never anywhere else:

- your choices: the figure, mute, the status line, the feature switches;
- daily counts (turns, tool calls, tests, deploys, pets and so on) and tool calls per hour for the weekly chart;
- the weekly-limit percentage at the start of each day, for the daily budget;
- the day summary text, if the day-summary feature is on;
- up to 200 error signatures (the first line of a failed command's error with numbers, paths and quoted text replaced by placeholders), for the lesson sniff.

Uninstalling the plugin removes it from use; the plugin store can be cleared from Claude Code.

## Programs it runs on your machine

Read-only commands with fixed arguments: `git status --porcelain` (uncommitted files), `netstat -ano` or `lsof` (two dev servers on one port), `date` or PowerShell `Get-Date` (your time zone), and on Windows PowerShell's sound player for the plugin's own bundled sounds. None of them changes anything.

## Children

Zsemle is a developer tool and is not directed at children.

## Changes and contact

Changes to this policy are published in this file in the repository, with a new date above. Questions: open an issue at https://github.com/Parais4/parais-mods/issues.
