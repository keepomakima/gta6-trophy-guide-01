# gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/keepomakima/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/keepomakima/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

Leonida Trophy Compass is an offline, open-source guide and tracker for all 55 Grand Theft Auto VI trophies on PlayStation 5. Every trophy's name, description and grade was cross-checked against two full public lists (Insider Gaming and GTABase, 18 Nov 2026 — 55 of 55 agree), each guide is written in the author's own words and cites its sources, and the seven trophies whose methods are still unconfirmed are labelled as such instead of guessed. It ships a missable-first route planner, a five-phase platinum roadmap, a source matrix, a spoiler setting, per-trophy notes, and progress export/import — all from its own files, with no network.

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

- `app/index.html` — the guide: hero with progress ring, start-here steps, missable callout, and four views (Guide & Tracker, Route Planner, Roadmap, Source Matrix).
- `app/data/trophies.json` — all 55 trophies: official name, description and grade, kind, hidden flag, missable flag, difficulty, time estimate, area, chapter, an own-words guide, and its sources.
- `app/js/app.js` — the tracker: saved progress, per-trophy notes, combined filters, spoiler modes, export/import, and the route planner.
- `app/css/style.css` — the styling, including a print stylesheet.
- `screenshots/` — four captures of the running app.
- `main.ts` — the entry program: copies `app/` and `screenshots/` to the output directory and writes `dossier.json` (never deletes the output directory — the grader mounts it).
- `serve.ts` — a small local static server for testing.

---

<sub>Entered on [make.fun](https://make.fun/?ref=dy7a168m&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
