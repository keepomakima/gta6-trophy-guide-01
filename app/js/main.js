import { loadTrophies, countByGrade } from './data.js';
import {
  loadProgress,
  saveProgress,
  setEarned,
  resetProgress,
  exportProgress,
  importProgressFile,
  loadSpoilersOn,
  saveSpoilersOn,
} from './store.js';
import { applyFilters, readFilters } from './filters.js';
import { renderChecklist } from './render-list.js';
import { renderDetail } from './render-detail.js';
import { renderRoadmap, renderMissable } from './roadmap.js';

/** Boots the guide: loads data, restores saved progress, wires every control. */
async function bootGuide() {
  const data = await loadTrophies();
  const trophies = data.trophies;
  const sources = data.sources;

  let earned = loadProgress();
  let spoilersOn = loadSpoilersOn();
  let kind = 'all';
  let selectedIndex = 27;

  const listElement = document.getElementById('trophyList');
  const detailPane = document.getElementById('detailPane');
  const searchInput = document.getElementById('searchInput');
  const gradeSelect = document.getElementById('gradeSelect');
  const statusSelect = document.getElementById('statusSelect');
  const missableOnly = document.getElementById('missableOnly');
  const spoilerToggle = document.getElementById('spoilerToggle');
  const resultLine = document.getElementById('resultLine');
  spoilerToggle.checked = spoilersOn;

  /** Re-renders the list, the detail pane and the progress header. */
  function refreshGuide() {
    const filters = readFilters(searchInput, kind, gradeSelect, statusSelect, missableOnly);
    const rows = applyFilters(trophies, filters, earned);
    renderChecklist(listElement, rows, earned, selectedIndex, spoilersOn, toggleEarned, selectTrophy);
    resultLine.textContent = `Showing ${rows.length} of 55 trophies · ${earned.size} earned`;
    renderProgressHeader();
    const trophy = trophies[selectedIndex];
    const next = nextUnearnedTrophy(selectedIndex);
    renderDetail(detailPane, trophy, selectedIndex, sources, earned, spoilersOn, toggleEarned, next);
    renderRoadmap(document.getElementById('phaseList'), trophies, earned);
    renderMissable(document.getElementById('missableCard'), trophies[27], sources);
  }

  /** Updates the header progress bar and grade counts. */
  function renderProgressHeader() {
    const counts = countByGrade(trophies.filter((_, i) => earned.has(i)));
    document.getElementById('earnedCount').textContent = String(earned.size);
    const percent = Math.round((earned.size / trophies.length) * 100);
    document.getElementById('progressFill').style.width = `${percent}%`;
    document.getElementById('progressBar').setAttribute('aria-valuenow', String(earned.size));
    document.getElementById('progressLabel').textContent =
      earned.size === 55 ? 'Platinum earned — Vice Got a Price!' : `${percent}% to the platinum`;
    document.getElementById('gradeCounts').textContent =
      `Platinum ${counts.Platinum}/1 · Gold ${counts.Gold}/2 · Silver ${counts.Silver}/6 · Bronze ${counts.Bronze}/46`;
  }

  /** Toggles one trophy's earned state and re-renders. */
  function toggleEarned(index, value) {
    setEarned(earned, index, value);
    refreshGuide();
  }

  /** Selects a trophy to show in the detail pane. */
  function selectTrophy(index) {
    selectedIndex = index;
    refreshGuide();
  }

  /** The next unearned trophy after the selected one, for the “Next up” line. */
  function nextUnearnedTrophy(fromIndex) {
    for (let step = 1; step <= trophies.length; step++) {
      const candidate = (fromIndex + step) % trophies.length;
      if (!earned.has(candidate)) return trophies[candidate];
    }
    return null;
  }

  /** Switches between the Guide, Roadmap and Missable views. */
  function switchView(view) {
    for (const section of document.querySelectorAll('.view')) section.classList.remove('active');
    for (const tab of document.querySelectorAll('.view-tab')) tab.classList.remove('active');
    document.getElementById(`view${view[0].toUpperCase()}${view.slice(1)}`).classList.add('active');
    document.getElementById(`tab${view[0].toUpperCase()}${view.slice(1)}`).classList.add('active');
    window.location.hash = `#/${view}`;
  }

  for (const tab of document.querySelectorAll('.view-tab')) {
    tab.addEventListener('click', () => switchView(tab.dataset.view));
  }
  for (const chip of document.querySelectorAll('#kindChips .chip')) {
    chip.addEventListener('click', () => {
      for (const other of document.querySelectorAll('#kindChips .chip')) other.classList.remove('active');
      chip.classList.add('active');
      kind = chip.dataset.kind;
      refreshGuide();
    });
  }
  searchInput.addEventListener('input', refreshGuide);
  gradeSelect.addEventListener('change', refreshGuide);
  statusSelect.addEventListener('change', refreshGuide);
  missableOnly.addEventListener('change', refreshGuide);
  spoilerToggle.addEventListener('change', () => {
    spoilersOn = spoilerToggle.checked;
    saveSpoilersOn(spoilersOn);
    refreshGuide();
  });
  document.getElementById('exportBtn').addEventListener('click', () => exportProgress(earned));
  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const imported = await importProgressFile(file);
    if (imported) {
      earned = imported;
      refreshGuide();
    } else {
      resultLine.textContent = 'That file is not a progress export from this guide.';
    }
    event.target.value = '';
  });
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (window.confirm('Clear all 55 checkboxes? This cannot be undone.')) {
      earned = resetProgress();
      refreshGuide();
    }
  });

  const hashView = window.location.hash.replace('#/', '');
  if (['roadmap', 'missable'].includes(hashView)) switchView(hashView);
  refreshGuide();
  saveProgress(earned);
}

bootGuide().catch((error) => {
  document.getElementById('detailPane').textContent = `Could not load the trophy data: ${error.message}`;
});
