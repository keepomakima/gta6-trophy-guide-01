/** The four-phase roadmap to the platinum, built from the official descriptions. */
export const ROADMAP_PHASES = [
  {
    title: 'Phase 1 — Story first, save smart',
    meta: 'Chapters 1–5 · about 60–80 hours · incl. the one missable moment',
    items: [
      'Play the story straight through: Gone Fishing, then Chapters 1–4 and the final mission.',
      'Chapter 1 — do Lucia’s balcony meditation at Jason’s house after Down to Earth. It is the one missable moment in the game.',
      'Keep a manual save at the start of every chapter and one before the final mission — there is no mission replay.',
      'Scan vehicles and animals with WAiNK as you travel, and try one of each activity when it appears.',
    ],
  },
  {
    title: 'Phase 2 — Strangers & character lines',
    meta: 'Side missions · 8 stranger strands + 6 character quest lines',
    items: [
      'Finish 8 stranger mission strands across Leonida (Strangers & Freaks).',
      'Clear the character quest lines to their final missions: Andy, Kenton, Billy, Randy, Tyrone and Bret.',
      'Do the partner trophies with Jason and Lucia together: Hot Together and Retail Therapy.',
      'Hunt Bret’s unique animal (Fair Game) while his strand is active.',
      'Watch for the cryptic story moments (a cocktail on Ocean Beach, the bowling alley, the showroom) — seven are still unconfirmed, so check the guide before hunting them.',
    ],
  },
  {
    title: 'Phase 3 — Activities & robberies',
    meta: 'The grind · 250 stunts, 42 shooting-range golds, 20 races, 5 vaults',
    items: [
      'Stunts to 250, shooting-range golds to 42, race wins to 20, drone-race wins at all 14 Top Fun locations.',
      'Complete 50 challenges and beat Cal at fishing; finish one arcade game.',
      'Robberies: 5 bank vaults, an armored truck, a jewelry store undetected, one illegal operation per gang.',
      'Combat Focus: 5 takedowns in one use (Gunslinger). Steal a plane at VCIA and drive a Rhino tank.',
    ],
  },
  {
    title: 'Phase 4 — Cleanup to the platinum',
    meta: 'Collectibles & money · then the 100% checklist',
    items: [
      'Collectibles: WAiNK at 100 locations, 100 vehicles, 3 card sets, 18 meditation spots, explore all of Leonida.',
      'Money: launder $250,000 in Marked Bills, spend $100,000 in shops, buy all garages, register 10 vehicles on Scooter Bros.',
      'Open Progress > Stats > 100% Completion and clear the checklist (A Long Road).',
      'Vice Got a Price! pops when the other 54 are done.',
    ],
  },
];

/** Renders the roadmap phases with per-phase progress. */
export function renderRoadmap(container, trophies, earned) {
  container.innerHTML = '';
  const phaseTrophies = [
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 27],
    [21, 22, 23, 24, 25, 26, 28, 32, 33, 43, 44, 45, 46, 47, 48, 49, 50],
    [14, 15, 16, 17, 18, 19, 20, 31, 35, 36, 37, 38, 39, 40, 42],
    [0, 13, 29, 30, 34, 41, 51, 52, 53, 54],
  ];
  ROADMAP_PHASES.forEach((phase, phaseIndex) => {
    const card = document.createElement('article');
    card.className = 'phase';
    const heading = document.createElement('h3');
    heading.textContent = phase.title;
    const meta = document.createElement('p');
    meta.className = 'phase-meta';
    meta.textContent = phase.meta;
    const list = document.createElement('ul');
    for (const line of phase.items) {
      const item = document.createElement('li');
      item.textContent = line;
      list.appendChild(item);
    }
    const progress = document.createElement('p');
    progress.className = 'phase-progress';
    const indices = phaseTrophies[phaseIndex] ?? [];
    const done = indices.filter((i) => earned.has(i)).length;
    progress.textContent = `${done} / ${indices.length} of this phase’s trophies earned`;
    card.append(heading, meta, list, progress);
    container.appendChild(card);
  });
}

/** Renders the missable card for Positive Mental Attitude. */
export function renderMissable(card, trophy, sources) {
  card.innerHTML = '';
  const heading = document.createElement('h3');
  heading.textContent = `${trophy.name} — ${trophy.grade}`;
  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = `“${trophy.description}”`;
  const guide = document.createElement('p');
  guide.className = 'guide-text';
  guide.textContent = trophy.guide;
  const sourcesHeading = document.createElement('h3');
  sourcesHeading.textContent = 'Sources';
  const list = document.createElement('ul');
  list.className = 'sources';
  for (const key of trophy.sources) {
    const source = sources[key];
    if (!source) continue;
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = source.url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = source.name;
    item.appendChild(link);
    list.appendChild(item);
  }
  card.append(heading, official, guide, sourcesHeading, list);
}
