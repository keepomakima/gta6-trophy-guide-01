// roadmap: the four phases to the platinum, each with its trophies counted
// and its earned count, plus the missable list — every trophy the guides flag
// as possibly missable, with the reason beside it.

export function renderRoadmap(phasesEl, missableEl, data, earned) {
  phasesEl.replaceChildren();
  for (const phase of data.roadmap) {
    const inPhase = data.trophies.filter((t) => t.stage === phase.stage);
    const done = inPhase.filter((t) => earned.has(t.name)).length;
    const card = document.createElement('article');
    card.className = 'phase';
    const heading = document.createElement('h3');
    const num = document.createElement('span');
    num.className = 'phase-num';
    num.textContent = phase.stage;
    heading.append(num, document.createTextNode(phase.name));
    const note = document.createElement('p');
    note.textContent = phase.note;
    const count = document.createElement('p');
    count.className = 'phase-count';
    count.textContent = `${done}/${inPhase.length} trophies earned`;
    card.append(heading, note, count);
    phasesEl.append(card);
  }

  missableEl.replaceChildren();
  const flagged = data.trophies.filter((t) => t.missable);
  if (flagged.length === 0) {
    const item = document.createElement('li');
    item.textContent = 'No trophy in this list is flagged as missable.';
    missableEl.append(item);
    return;
  }
  for (const trophy of flagged) {
    const item = document.createElement('li');
    const name = document.createElement('strong');
    name.textContent = trophy.name;
    item.append(name, document.createTextNode(` — ${trophy.missable_reason}`));
    missableEl.append(item);
  }
}
