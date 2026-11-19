# gta6-trophy-guide-01
[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/keepomakima/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/keepomakima/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

## Leonida Platinum Playbook

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI — the official names, descriptions and grades, a guide to each in our own words that cites its sources, a 4-phase roadmap to the platinum, and the one missable trophy flagged.

- **Tracker:** checklist of all 55 trophies with progress saved in the browser (localStorage), export/import of progress, and reset.
- **Filters:** search by name or description; kind (story / activities / collectibles), grade, earned/unearned, missable only.
- **Spoiler setting:** hides the names and descriptions of story trophies until they are earned.
- **Roadmap:** 4 phases from the story to the 100% checklist, with per-phase progress.
- **Missable:** exactly one — Positive Mental Attitude, with the Chapter 1 balcony meditation explained. Everything else can be finished after the credits.
- **Honest where it counts:** 7 trophies whose methods are not yet confirmed by any launch-era guide are marked “Method unconfirmed” instead of guessed.
- **Offline:** static files only, no network requests, small first load.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 — or serve `app/` with any static server (`npx serve app` works too).

## How it is built

- `app/index.html` — the page; `app/css/style.css` — the Vice-sunset look.
- `app/js/` — one module per job: `main.js` (boot), `data.js` (loads the trophy file), `store.js` (saved progress, export/import), `filters.js`, `spoilers.js`, `render-list.js`, `render-detail.js`, `roadmap.js`.
- `app/data/trophies.json` — the 55 official trophies with guides and cited sources.
- `main.ts` — copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the kit's `buildDossier`.

## Sources

Names, descriptions and grades: the official PlayStation list via [Exophase](https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/), cross-checked with [PSNProfiles](https://psnprofiles.com/trophies/43531-grand-theft-auto-vi). Guides draw on [PowerPyx](https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/), [GTABase](https://www.gtabase.com/articles/gta-6/gta-6-achievements-trophies-list-ps5-xbox-series), [Planet GTA 6](https://www.planetgta6.com/en/gta-6-trophies/), [Output Lag](https://outputlag.com/guides/gta-6-trophy-list/), [KeenGamer](https://www.keengamer.com/articles/guides/gta-6-trophy-guide-platinum-roadmap-all-55-trophies/) and others — each trophy names its sources beside its guide. No guide text is copied; no Rockstar artwork is used.

## License

MIT — see [LICENSE](LICENSE).

<sub>Entered on [make.fun](https://make.fun/?ref=dy7a168m&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
