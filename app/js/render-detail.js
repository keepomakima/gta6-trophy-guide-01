// render-detail: the guide panel beside the checklist. It shows the selected
// trophy's official name, description and grade, the guide in our own words,
// why it can or cannot be missed, and the sources that back each fact —
// a link the reader can follow. A trophy whose method is not confirmed yet
// carries an "unconfirmed" mark instead of an invented method.

import { isSpoilerHidden } from './spoilers.js';

const UNCONFIRMED_HINT = 'method unconfirmed';

function metaLine(text) {
  const line = document.createElement('p');
  line.className = 'meta-line';
  line.textContent = text;
  return line;
}

export function renderTrophyDetail(panelEl, trophy, earned, spoilerOn) {
  panelEl.replaceChildren();
  if (!trophy) {
    const hint = document.createElement('p');
    hint.textContent = 'Select a trophy in the checklist to read its guide and sources.';
    panelEl.append(hint);
    return;
  }
  const hidden = isSpoilerHidden(trophy, earned, spoilerOn);
  const title = document.createElement('h3');
  title.textContent = hidden ? 'Hidden story trophy' : trophy.name;
  panelEl.append(title);

  const meta = document.createElement('div');
  meta.className = 'trophy-meta';
  const grade = document.createElement('span');
  grade.className = `chip grade-${trophy.grade}`;
  grade.textContent = trophy.grade;
  meta.append(grade);
  const kind = document.createElement('span');
  kind.className = 'chip';
  kind.textContent = trophy.kind;
  meta.append(kind);
  if (trophy.missable) {
    const flag = document.createElement('span');
    flag.className = 'chip missable';
    flag.textContent = '⚠ missable';
    meta.append(flag);
  }
  panelEl.append(meta);

  if (!hidden) {
    const official = document.createElement('p');
    official.className = 'official-desc';
    official.textContent = `Official description: “${trophy.description}”`;
    panelEl.append(official);
  }

  const guideHeading = document.createElement('h4');
  guideHeading.textContent = 'Guide';
  panelEl.append(guideHeading);
  const guide = document.createElement('p');
  guide.className = 'guide-text';
  guide.textContent = hidden
    ? 'This is a story trophy. Its name and description stay hidden until you earn it — turn the spoiler setting off to read its guide now.'
    : trophy.guide;
  panelEl.append(guide);

  if (trophy.missable_reason && trophy.missable_reason.toLowerCase().includes(UNCONFIRMED_HINT)) {
    const mark = document.createElement('p');
    const badge = document.createElement('span');
    badge.className = 'unconfirmed';
    badge.textContent = 'Method unconfirmed';
    mark.append(badge);
    panelEl.append(mark);
  }

  const sourcesHeading = document.createElement('h4');
  sourcesHeading.textContent = 'Sources';
  panelEl.append(sourcesHeading);
  const list = document.createElement('ul');
  list.className = 'sources';
  for (const source of trophy.sources ?? []) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = source.url;
    link.textContent = source.name;
    link.target = '_blank';
    link.rel = 'noopener';
    item.append(link);
    list.append(item);
  }
  panelEl.append(list);

  const missableHeading = document.createElement('h4');
  missableHeading.textContent = trophy.missable ? 'Can you miss it? Yes — read this' : 'Can you miss it?';
  panelEl.append(missableHeading);
  const missable = document.createElement('p');
  missable.className = 'missable-note';
  missable.textContent = trophy.missable_reason ?? 'No missable information for this trophy.';
  panelEl.append(missable);

  const stageNames = { 1: 'Story, in order', 2: 'Stranger strands & activities', 3: 'Collectibles & counts', 4: 'Cleanup & 100%' };
  panelEl.append(metaLine(`Roadmap: phase ${trophy.stage} — ${stageNames[trophy.stage] ?? '—'}.`));
  if (trophy.count != null) panelEl.append(metaLine(`PlayStation tracks a count for this one: ${trophy.count.toLocaleString('en-US')}.`));
  if (trophy.hidden) panelEl.append(metaLine('Hidden on PlayStation until earned.'));
}
