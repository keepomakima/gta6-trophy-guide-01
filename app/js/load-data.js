// load-data: fetches the trophy list (a file under app/, so the guide works
// offline) and checks it is the shape the app expects: 55 trophies, each with
// an official name, description, grade and a guide of our own words.

export async function loadTrophyData() {
  const response = await fetch('data/trophies.json');
  if (!response.ok) throw new Error(`trophies.json failed to load: ${response.status}`);
  const data = await response.json();
  if (!data || !Array.isArray(data.trophies)) throw new Error('trophies.json has no trophies array');
  if (data.trophies.length !== 55) throw new Error(`expected 55 trophies, got ${data.trophies.length}`);
  for (const trophy of data.trophies) {
    if (typeof trophy.name !== 'string' || !trophy.name) throw new Error('a trophy is missing its name');
    if (typeof trophy.description !== 'string' || !trophy.description) throw new Error(`"${trophy.name}" is missing its description`);
    if (typeof trophy.guide !== 'string' || !trophy.guide.trim()) throw new Error(`"${trophy.name}" has no guide`);
    if (!['platinum', 'gold', 'silver', 'bronze'].includes(trophy.grade)) throw new Error(`"${trophy.name}" has an unknown grade`);
  }
  return data;
}
