// progress: the masthead numbers — how many earned of 55, the percentage, the
// bar width, and the per-grade counts (platinum, gold, silver, bronze).

const GRADES = ['platinum', 'gold', 'silver', 'bronze'];

export function renderProgress(trophies, earned, elements) {
  const total = trophies.length;
  const pct = total === 0 ? 0 : Math.round((earned.size / total) * 100);
  elements.text.textContent = `${earned.size} of ${total} earned`;
  elements.pct.textContent = `${pct}%`;
  elements.fill.style.width = `${pct}%`;
  elements.counts.textContent = GRADES.map((grade) => {
    const inGrade = trophies.filter((t) => t.grade === grade);
    const done = inGrade.filter((t) => earned.has(t.name)).length;
    return `${grade} ${done}/${inGrade.length}`;
  }).join(' · ');
  if (elements.heading) elements.heading.textContent = `— ${earned.size} of ${total} earned · ${pct}%`;
}
