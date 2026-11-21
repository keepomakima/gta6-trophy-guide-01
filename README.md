# Leonida Platinum Chartbook — GTA 6 Trophy Guide & Tracker (v6)

An offline, open-source web app that guides and tracks all **55 PlayStation 5
trophies of Grand Theft Auto VI** (1 Platinum, 2 Gold, 6 Silver, 46 Bronze;
28 hidden on PSN). Built for the make.fun bounty `gta6-trophy-guide-01`.

## What it is

A dense three-column workbench — no hero, no landing page. The first screen
is the work itself:

- **Left:** the full 55-trophy checklist with search, kind / grade / status
  filters, a spoiler shield (hide / blur / show story trophies), and progress.
- **Centre:** the selected trophy's detail — official description quoted
  verbatim, a per-trophy counter (+/−), numbered steps with inline source
  citations `[n]`, a SOURCES DIFFER panel when guides disagree, a missable
  window callout, and a notes field.
- **Right:** NEXT UP (missable-first), SOURCES FOR THIS GUIDE (numbered, with
  read date and claim counts), and export / import.

Plus a Route Planner (missable-first order + hour estimates), a 5-phase
Roadmap to the Platinum, and a Source Matrix with an honest audit strip.

## Honesty rules

- Every trophy carries a `guide` (own words, cited) in
  `app/data/trophies.json`. Methods that could not be confirmed in 2+ sources
  are marked **METHOD UNCONFIRMED**; sources that disagree are shown **both
  ways** (platinum time 200 h vs 300+ h; final-mission wording; shooting-range
  locations; Ten Pin method; whether the Chapter 1 meditation counts).
- The audit strip is computed from the data, not typed by hand: claims cited,
  trophies backed by 2+ sources, pages and sites read (21 Nov 2026), possibly
  missable (1), at risk (5 stranger finals), unconfirmed methods (5), disputes
  shown both ways (4).
- The game launched 19 Nov 2026; several methods are still being confirmed by
  players. This guide says so where it is true instead of inventing a method.

## Run it

```sh
node serve.ts          # serves app/ on http://localhost:8080
```

Open `app/index.html` in any desktop browser. It works with the network off:
every file it loads lives under `app/`, and the only fetch is the relative
`data/trophies.json`.

## Routes

- `#/guide` — the workbench (default; `#/trophy/<id>` opens one trophy)
- `#/route` — Route Planner, missable-first
- `#/roadmap` — the 5-phase roadmap to the platinum
- `#/sources` — Source Matrix, disputes, and the audit

## Progress & privacy

Progress, counters and notes are stored only in your browser
(`localStorage`, key `lpc-v6-state-v1`). Export downloads a JSON file;
import reads a file you choose. Nothing leaves your machine.

## Demo seed (for screenshots only)

Opening the app with `?seed=demo` pre-fills 13 earned trophies and a few
counters so screenshots show a lived-in tracker. It never writes to the
submitted data; it only seeds the browser's own localStorage.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` and writes `out/dossier.json`
with the vendored `vendor/makefun-frontend.ts` library. It only creates
directories and copies files — it never deletes the output folder.

## Sources

20 sites consulted 21 Nov 2026 — see the Source Matrix in the app
(`#/sources`): Exophase, PSNProfiles, PowerPyx, Push Square, KeenGamer,
Insider Gaming, GTABase, games.gg, GameMapa, eGamers, CryptoGames, Beebom,
GTADB, Mobalytics, GamesFuze, GTAScoop, GTAVibes, FullSweep, ViceCityHustle. Trophy names, descriptions and grades follow the official
PS5 list as frozen in the kit's starter data.

## License

BSD 2-Clause — see `LICENSE`.
