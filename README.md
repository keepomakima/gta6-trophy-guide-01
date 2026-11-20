# gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/keepomakima/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/keepomakima/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

Leonida Platinum Field Guide — an offline field guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI, built for make.fun's "Build the best GTA 6 trophy guide" bounty ($250, top 50). Every trophy with its official name, description and grade; a checklist saved in the browser with export and import; filters by grade, category and phase plus a spoiler setting that hides story trophies until earned; a 12-session planner that warns about the missable step in the session where it matters; a 4-phase roadmap to the platinum; and an honest flag on the 7 trophies whose unlock method is still unconfirmed in public guides — no invented walkthroughs.

## Run it

```sh
node serve.ts
# then open http://localhost:8080
```

Or open `app/index.html` directly in a browser (served over HTTP for the data file to load). No build step, no network, no account: progress is saved in localStorage and never leaves the browser except when you choose Export.

## What's inside

- `app/index.html` — the guide: checklist, session planner, roadmap, sources
- `app/js/app.js` — the tracker (filters, spoilers, export/import, print stylesheet)
- `app/data/trophies.json` — all 55 trophies with original per-trophy guides, difficulty and time estimates, sources, and honest unconfirmed flags
- `main.ts` — hands the guide in as a make.fun program entry (Node 22, stdlib only)
- `screenshots/` — 4 screenshots of the guide in use

---

<sub>Entered on [make.fun](https://make.fun/?ref=dy7a168m&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
