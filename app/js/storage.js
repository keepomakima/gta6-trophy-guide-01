// storage: earned ticks and the spoiler setting live in localStorage, so the
// tracker remembers progress between visits. Export writes the same state to
// a JSON file; import reads one back, keeping only names the list knows.

export const STORAGE_KEY = 'platinum-leonida-progress-v1';

export function readSavedProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { earned: new Set(), spoilerOn: false };
    const parsed = JSON.parse(raw);
    return {
      earned: new Set(Array.isArray(parsed.earned) ? parsed.earned.filter((n) => typeof n === 'string') : []),
      spoilerOn: parsed.spoilerOn === true,
    };
  } catch {
    return { earned: new Set(), spoilerOn: false };
  }
}

export function saveProgress(earned, spoilerOn) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ earned: [...earned], spoilerOn }));
}

export function exportProgressFile(earned) {
  const blob = new Blob([JSON.stringify({ game: 'Grand Theft Auto VI', earned: [...earned] }, null, 2)], { type: 'application/json' });
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = 'platinum-leonida-progress.json';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(anchor.href), 1000);
}

export async function importProgressFile(file, knownNames) {
  const parsed = JSON.parse(await file.text());
  const names = Array.isArray(parsed) ? parsed : parsed.earned;
  if (!Array.isArray(names)) throw new Error('import file holds no earned list');
  return new Set(names.filter((name) => typeof name === 'string' && knownNames.has(name)));
}
