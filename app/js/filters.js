// filters: one place for every rule that decides whether a trophy is shown.
// kind "missable" matches the missable flag (not a kind of its own), "online"
// matches nothing — all 55 trophies are single-player, so that filter is an
// honest empty state. Search looks at name, description and guide.

export function createFilterState() {
  return { kind: 'all', grade: 'all', status: 'all', search: '', missableOnly: false };
}

export function matchesFilters(trophy, filters, earned) {
  if (filters.kind === 'missable' && !trophy.missable) return false;
  if (filters.kind === 'online') return false;
  if (filters.kind !== 'all' && filters.kind !== 'missable' && trophy.kind !== filters.kind) return false;
  if (filters.grade !== 'all' && trophy.grade !== filters.grade) return false;
  if (filters.missableOnly && !trophy.missable) return false;
  const isEarned = earned.has(trophy.name);
  if (filters.status === 'earned' && !isEarned) return false;
  if (filters.status === 'unearned' && isEarned) return false;
  const query = filters.search.trim().toLowerCase();
  if (query) {
    const haystack = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
    if (!haystack.includes(query)) return false;
  }
  return true;
}
