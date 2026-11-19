import { isSpoilerHidden, spoilerDescription, spoilerName } from './spoilers.js';
import { medalLetter, tagChip } from './render-list.js';

/** Renders the detail pane for one trophy: official text, guide, sources, flags. */
export function renderDetail(pane, trophy, index, sources, earned, spoilersOn, onToggle, nextTrophy) {
  pane.innerHTML = '';
  const hidden = isSpoilerHidden(trophy, spoilersOn, earned.has(index));

  const medal = document.createElement('span');
  medal.className = `medal ${trophy.grade}`;
  medal.textContent = medalLetter(trophy.grade);
  medal.title = trophy.grade;

  const title = document.createElement('h2');
  title.textContent = hidden ? spoilerName() : trophy.name;

  const tags = document.createElement('div');
  tags.className = 'row-tags';
  tags.append(tagChip(trophy.kind));
  tags.append(tagChip(trophy.grade));
  if (trophy.hidden) tags.append(tagChip('Hidden on PlayStation', 'hidden-flag'));
  if (trophy.missable) tags.append(tagChip('Missable', 'missable'));
  if (trophy.unconfirmed) tags.append(tagChip('Method unconfirmed', 'unconfirmed'));
  if (earned.has(index)) tags.append(tagChip('Earned', 'earned-tag'));

  const officialHeading = document.createElement('h3');
  officialHeading.textContent = 'Official description';
  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = hidden ? spoilerDescription() : `“${trophy.description}”`;

  const guideHeading = document.createElement('h3');
  guideHeading.textContent = 'Guide';
  const guide = document.createElement('p');
  guide.className = 'guide-text';
  guide.textContent = hidden
    ? 'This is a story trophy. Turn off “Hide story spoilers” — or earn it in the game — to read its guide.'
    : trophy.guide;

  pane.append(medal, title, tags, officialHeading, official, guideHeading, guide);

  if (trophy.missable && !hidden) {
    const callout = document.createElement('div');
    callout.className = 'callout';
    callout.innerHTML = '<strong>Missable — read before Chapter 1 ends.</strong> ';
    callout.append(document.createTextNode('The Chapter 1 balcony meditation with Lucia is the only deadline in the list. Do it, and keep a Chapter 1 save until this trophy pops.'));
    pane.appendChild(callout);
  }
  if (trophy.unconfirmed && !hidden) {
    const note = document.createElement('div');
    note.className = 'note-box';
    note.textContent = 'Method unconfirmed: no launch-era guide has verified the exact trigger for this trophy yet. The guide above says what the description suggests and where to check for the confirmed method.';
    pane.appendChild(note);
  }

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
  const exophaseNote = document.createElement('li');
  exophaseNote.textContent = 'Name, description and grade: the official PlayStation list via Exophase, cross-checked with PSNProfiles.';
  list.appendChild(exophaseNote);
  pane.append(sourcesHeading, list);

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.textContent = earned.has(index) ? 'Mark as not earned' : 'Mark as earned';
  toggle.addEventListener('click', () => onToggle(index, !earned.has(index)));
  pane.appendChild(toggle);

  if (nextTrophy) {
    const next = document.createElement('p');
    next.className = 'next-up';
    next.textContent = `Next up: ${nextTrophy.name} (${nextTrophy.grade}) — ${nextTrophy.description}`;
    pane.appendChild(next);
  }
}
