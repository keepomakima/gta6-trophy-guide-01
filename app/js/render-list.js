// render-list: builds the checklist rows. Each row is a trophy card with its
// earned checkbox, official name and description, grade chip, kind chip,
// missable and hidden flags, and its count when PlayStation tracks one.
// Clicking a card (not its checkbox) opens it in the detail panel.

import { isSpoilerHidden, SPOILER_MASK_NAME, SPOILER_MASK_DESC } from './spoilers.js';

function gradeChip(trophy) {
  const chip = document.createElement('span');
  chip.className = `chip grade-${trophy.grade}`;
  chip.textContent = trophy.grade;
  return chip;
}

function kindChip(trophy) {
  const chip = document.createElement('span');
  chip.className = 'chip';
  chip.textContent = trophy.kind;
  return chip;
}

export function renderTrophyList(listEl, trophies, earned, spoilerOn, selectedName, callbacks) {
  listEl.replaceChildren();
  for (const trophy of trophies) {
    const hidden = isSpoilerHidden(trophy, earned, spoilerOn);
    const item = document.createElement('li');
    item.className = 'trophy-card' + (earned.has(trophy.name) ? ' earned' : '') + (trophy.name === selectedName ? ' selected' : '');

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(trophy.name);
    box.setAttribute('aria-label', `Mark ${hidden ? 'hidden story trophy' : trophy.name} as earned`);
    box.addEventListener('change', () => callbacks.onToggleEarned(trophy, box.checked));
    box.addEventListener('click', (event) => event.stopPropagation());

    const body = document.createElement('div');
    body.className = 'trophy-body';
    const name = document.createElement('p');
    name.className = 'trophy-name' + (hidden ? ' spoiler-mask' : '');
    name.textContent = hidden ? SPOILER_MASK_NAME : trophy.name;
    const desc = document.createElement('p');
    desc.className = 'trophy-desc' + (hidden ? ' spoiler-mask' : '');
    desc.textContent = hidden ? SPOILER_MASK_DESC : trophy.description;
    const meta = document.createElement('div');
    meta.className = 'trophy-meta';
    meta.append(gradeChip(trophy), kindChip(trophy));
    if (trophy.hidden) {
      const flag = document.createElement('span');
      flag.className = 'chip hidden-flag';
      flag.textContent = 'hidden on PS5';
      meta.append(flag);
    }
    if (trophy.missable) {
      const flag = document.createElement('span');
      flag.className = 'chip missable';
      flag.textContent = '⚠ missable';
      meta.append(flag);
    }
    if (trophy.count != null) {
      const count = document.createElement('span');
      count.className = 'chip count';
      count.textContent = `× ${trophy.count.toLocaleString('en-US')}`;
      meta.append(count);
    }
    body.append(name, desc, meta);
    item.append(box, body);
    item.addEventListener('click', () => callbacks.onSelect(trophy));
    listEl.append(item);
  }
}
