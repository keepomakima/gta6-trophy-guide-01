/** Loads the trophy data file the app ships with. */
export async function loadTrophies() {
  const response = await fetch('data/trophies.json');
  if (!response.ok) throw new Error('Could not load data/trophies.json');
  const data = await response.json();
  return data;
}

/** The grade order used for sorting and for the header counts. */
export const GRADE_ORDER = ['Platinum', 'Gold', 'Silver', 'Bronze'];

/** Counts trophies per grade in a list. */
export function countByGrade(trophies) {
  const counts = { Platinum: 0, Gold: 0, Silver: 0, Bronze: 0 };
  for (const trophy of trophies) {
    if (Object.hasOwn(counts, trophy.grade)) counts[trophy.grade] += 1;
  }
  return counts;
}
