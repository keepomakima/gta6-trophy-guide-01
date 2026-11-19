import { isSpoilerHidden, spoilerDescription, spoilerName } from './spoilers.js';

/** Renders the checklist rows for the filtered trophies. */
export function renderChecklist(listElement, rows, earned, selectedIndex, spoilersOn, onToggle, onSelect) {
  listElement.innerHTML = '';
  for (const { trophy, index } of rows) {
    const hidden = isSpoilerHidden(trophy, spoilersOn, earned.has(index));
    const item = document.createElement('li');
    if (index === selectedIndex) item.classList.add('selected');
    if (earned.has(index)) item.classList.add('earned');
    item.dataset.index = String(index);

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = earned.has(index);
    checkbox.setAttribute('aria-label', `Mark ${hidden ? 'story trophy' : trophy.name} as earned`);
    checkbox.addEventListener('click', (event) => event.stopPropagation());
    checkbox.addEventListener('change', () => onToggle(index, checkbox.checked));

    const medal = document.createElement('span');
    medal.className = `medal ${trophy.grade}`;
    medal.textContent = medalLetter(trophy.grade);
    medal.title = trophy.grade;

    const body = document.createElement('div');
    body.className = 'row-body';
    const name = document.createElement('div');
    name.className = 'row-name';
    name.textContent = hidden ? spoilerName() : trophy.name;
    const description = document.createElement('div');
    description.className = 'row-desc';
    description.textContent = hidden ? spoilerDescription() : trophy.description;
    const tags = document.createElement('div');
    tags.className = 'row-tags';
    tags.append(tagChip(trophy.kind));
    tags.append(tagChip(trophy.grade));
    if (trophy.hidden) tags.append(tagChip('Hidden', 'hidden-flag'));
    if (trophy.missable) tags.append(tagChip('Missable', 'missable'));
    if (trophy.unconfirmed) tags.append(tagChip('Method unconfirmed', 'unconfirmed'));
    if (earned.has(index)) tags.append(tagChip('Earned', 'earned-tag'));
    if (trophy.count !== null && trophy.count !== undefined) {
      tags.append(tagChip(`Target: ${formatCount(trophy)}`));
    }
    body.append(name, description, tags);

    item.append(checkbox, medal, body);
    item.addEventListener('click', () => onSelect(index));
    listElement.appendChild(item);
  }
}

/** One-letter medal mark for a grade. */
export function medalLetter(grade) {
  if (grade === 'Platinum') return 'P';
  if (grade === 'Gold') return 'G';
  if (grade === 'Silver') return 'S';
  return 'B';
}

/** A small tag chip for the row. */
export function tagChip(text, extraClass = '') {
  const chip = document.createElement('span');
  chip.className = `tag ${extraClass}`.trim();
  chip.textContent = text;
  return chip;
}

/** Human-readable target for a trophy with a count (money shown in dollars). */
export function formatCount(trophy) {
  if (trophy.name === 'Dime on the Dollar') return '$250,000 laundered';
  if (trophy.name === 'Treat Yo Self') return '$100,000 spent';
  return String(trophy.count);
}
