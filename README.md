# gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/keepomakima/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/keepomakima/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

Leonida Trophy Compass is an offline, open-source workbench for all 55 Grand Theft Auto VI trophies on PlayStation 5 — not a landing page. The first screen is the tool itself: a dense three-column bench (checklist | trophy detail with numbered, cited steps | numbered sources), an audit strip with numbers computed from its own data, and a missable-first next-up. Every trophy's name, description and grade was cross-checked trophy by trophy between Insider Gaming and GTABase, both read in full on 20 Nov 2026 (55 of 55 agree); every one of the 123 guide steps cites its source; where the five sources read disagree, both versions are shown and the guide says which it follows; the one method no source has confirmed is labelled METHOD UNCONFIRMED instead of guessed. It ships a missable-first route planner, a five-phase platinum roadmap, a source matrix, per-trophy counters, a spoiler setting, per-trophy notes, and progress export/import — all from its own files, with no network.

## Run it

```sh
node serve.ts
# open http://localhost:8123/app/
```

## Build the hand-in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
# writes out/app/, out/screenshots/ and out/dossier.json
```

## What is inside

- `app/index.html` — the workbench: slim header, audit strip, and four views (Guide & Tracker, Route Planner, Roadmap, Source Matrix).
- `app/data/trophies.json` — all 55 trophies: official name, description and grade, kind, hidden flag, missable flag, difficulty, time estimate, area, chapter, numbered steps with per-step source citations, counters, and recorded disagreements.
- `app/js/app.js` — the tracker: saved progress, per-trophy counters and notes, combined filters, spoiler modes, export/import, and the route planner.
- `app/css/style.css` — the styling, including a print stylesheet.
- `screenshots/` — four captures of the running app.
- `main.ts` — the entry program: copies `app/` and `screenshots/` to the output directory and writes `dossier.json` (never deletes the output directory — the grader mounts it).
- `serve.ts` — a small local static server for testing.

---

<sub>Entered on [make.fun](https://make.fun/?ref=dy7a168m&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
