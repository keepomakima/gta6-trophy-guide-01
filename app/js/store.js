/** Progress and settings saved in the browser (localStorage only, no network). */
export const PROGRESS_KEY = 'leonida-playbook-progress-v1';
export const SPOILER_KEY = 'leonida-playbook-spoilers-v1';

/** Reads the earned set: trophy indices stored as an array of numbers. */
export function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((n) => Number.isInteger(n)));
  } catch {
    return new Set();
  }
}

/** Writes the earned set back to localStorage. */
export function saveProgress(earned) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}

/** Marks one trophy earned or unearned and saves. */
export function setEarned(earned, index, value) {
  if (value) earned.add(index);
  else earned.delete(index);
  saveProgress(earned);
}

/** Clears all saved progress. */
export function resetProgress() {
  localStorage.removeItem(PROGRESS_KEY);
  return new Set();
}

/** Downloads the progress as a JSON file the user can keep or share. */
export function exportProgress(earned) {
  const payload = { app: 'Leonida Platinum Playbook', version: 1, earned: [...earned].sort((a, b) => a - b) };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'gta6-trophy-progress.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Reads a progress file back into an earned set; returns null when it is not one. */
export async function importProgressFile(file) {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const list = Array.isArray(parsed) ? parsed : parsed.earned;
    if (!Array.isArray(list)) return null;
    const earned = new Set(list.filter((n) => Number.isInteger(n) && n >= 0 && n < 55));
    saveProgress(earned);
    return earned;
  } catch {
    return null;
  }
}

/** Reads the spoiler setting (on by default). */
export function loadSpoilersOn() {
  try {
    return localStorage.getItem(SPOILER_KEY) !== 'off';
  } catch {
    return true;
  }
}

/** Writes the spoiler setting. */
export function saveSpoilersOn(value) {
  localStorage.setItem(SPOILER_KEY, value ? 'on' : 'off');
}
