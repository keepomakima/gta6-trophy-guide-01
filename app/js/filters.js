/** Filters the trophy list by the toolbar state. */
export function applyFilters(trophies, filters, earned) {
  const query = filters.search.trim().toLowerCase();
  return trophies
    .map((trophy, index) => ({ trophy, index }))
    .filter(({ trophy, index }) => {
      if (filters.kind !== 'all' && trophy.kind !== filters.kind) return false;
      if (filters.grade !== 'all' && trophy.grade !== filters.grade) return false;
      if (filters.status === 'earned' && !earned.has(index)) return false;
      if (filters.status === 'unearned' && earned.has(index)) return false;
      if (filters.missableOnly && !trophy.missable) return false;
      if (query) {
        const haystack = `${trophy.name} ${trophy.description}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
}

/** The toolbar's current filter state. */
export function readFilters(searchInput, kind, gradeSelect, statusSelect, missableOnly) {
  return {
    search: searchInput.value,
    kind,
    grade: gradeSelect.value,
    status: statusSelect.value,
    missableOnly: missableOnly.checked,
  };
}
