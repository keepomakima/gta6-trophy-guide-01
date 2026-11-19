// app.js — Platinum Leonida, the entry point. It loads the 55 trophies, keeps
// the tracker state (earned ticks, spoiler setting, filters, selected trophy),
// renders the progress bar, the roadmap, the checklist and the guide panel,
// and wires the toolbar: search, kind/grade/status filters, the missable-only
// switch, the spoiler setting, export, import and reset.
//
// Screenshot presets (?shot=cover|roadmap|story|missable) set the same state a
// reader could set by hand — a demo earned set, a selected trophy, a filter —
// so the four screenshots are plain renders of this code.

import { loadTrophyData } from './js/load-data.js';
import { readSavedProgress, saveProgress, exportProgressFile, importProgressFile } from './js/storage.js';
import { createFilterState, matchesFilters } from './js/filters.js';
import { renderProgress } from './js/progress.js';
import { renderTrophyList } from './js/render-list.js';
import { renderTrophyDetail } from './js/render-detail.js';
import { renderRoadmap } from './js/roadmap.js';

// The demo earned set the screenshot presets use: twelve trophies a player
// would plausibly have after the opening chapters and a first look around.
const DEMO_EARNED_IDS = [2, 3, 4, 5, 8, 15, 16, 20, 21, 35, 53, 55];

const elements = {
  progressText: document.getElementById('progress-text'),
  progressPct: document.getElementById('progress-pct'),
  progressFill: document.getElementById('progress-fill'),
  gradeCounts: document.getElementById('grade-counts'),
  headingProgress: document.getElementById('heading-progress'),
  roadmapPhases: document.getElementById('roadmap-phases'),
  missableList: document.getElementById('missable-list'),
  search: document.getElementById('search'),
  kindFilter: document.getElementById('kind-filter'),
  gradeFilter: document.getElementById('grade-filter'),
  statusFilter: document.getElementById('status-filter'),
  missableOnly: document.getElementById('missable-only'),
  spoilerToggle: document.getElementById('spoiler-toggle'),
  exportBtn: document.getElementById('export-btn'),
  importFile: document.getElementById('import-file'),
  resetBtn: document.getElementById('reset-btn'),
  resultCount: document.getElementById('result-count'),
  trophyList: document.getElementById('trophy-list'),
  emptyState: document.getElementById('empty-state'),
  detailPanel: document.getElementById('detail-panel'),
};

const state = {
  data: null,
  earned: new Set(),
  spoilerOn: false,
  filters: createFilterState(),
  selectedName: null,
};

function save() {
  saveProgress(state.earned, state.spoilerOn);
}

function renderAll() {
  const trophies = state.data.trophies;
  const visible = trophies.filter((t) => matchesFilters(t, state.filters, state.earned));
  const selected = trophies.find((t) => t.name === state.selectedName) ?? visible[0] ?? null;
  if (selected) state.selectedName = selected.name;
  renderProgress(trophies, state.earned, {
    text: elements.progressText,
    pct: elements.progressPct,
    fill: elements.progressFill,
    counts: elements.gradeCounts,
    heading: elements.headingProgress,
  });
  renderRoadmap(elements.roadmapPhases, elements.missableList, state.data, state.earned);
  renderTrophyList(elements.trophyList, visible, state.earned, state.spoilerOn, state.selectedName, {
    onToggleEarned: (trophy, checked) => {
      if (checked) state.earned.add(trophy.name);
      else state.earned.delete(trophy.name);
      save();
      renderAll();
    },
    onSelect: (trophy) => {
      state.selectedName = trophy.name;
      renderAll();
    },
  });
  renderTrophyDetail(elements.detailPanel, selected, state.earned, state.spoilerOn);
  elements.emptyState.hidden = visible.length !== 0;
  elements.resultCount.textContent =
    visible.length === trophies.length
      ? `Showing all ${trophies.length} trophies.`
      : `Showing ${visible.length} of ${trophies.length} trophies.`;
}

function applyShotPreset(params) {
  const shot = params.get('shot');
  if (!shot) return null;
  const byId = (id) => state.data.trophies.find((t) => t.id === id);
  const demoEarned = () => {
    state.earned = new Set(DEMO_EARNED_IDS.map((id) => byId(id).name));
    save();
  };
  if (shot === 'cover') {
    demoEarned();
    // Stick Fiddler: a short guide, so its guide and sources fit in one screen.
    state.selectedName = byId(21).name;
    return '.tracker';
  }
  if (shot === 'roadmap') {
    demoEarned();
    state.selectedName = byId(14).name;
    return '#roadmap';
  }
  if (shot === 'story') {
    demoEarned();
    state.selectedName = byId(9).name;
    return '.tracker';
  }
  if (shot === 'missable') {
    state.filters.kind = 'missable';
    state.spoilerOn = true;
    // Detail shows a masked story trophy, so the shot proves the spoiler
    // setting works while the list shows the missable filter's result.
    state.selectedName = byId(3).name;
    elements.kindFilter.value = 'missable';
    elements.spoilerToggle.checked = true;
    save();
    return '.tracker';
  }
  return null;
}

async function boot() {
  state.data = await loadTrophyData();
  const saved = readSavedProgress();
  state.earned = saved.earned;
  state.spoilerOn = saved.spoilerOn;
  elements.spoilerToggle.checked = state.spoilerOn;

  elements.search.addEventListener('input', () => {
    state.filters.search = elements.search.value;
    renderAll();
  });
  elements.kindFilter.addEventListener('change', () => {
    state.filters.kind = elements.kindFilter.value;
    renderAll();
  });
  elements.gradeFilter.addEventListener('change', () => {
    state.filters.grade = elements.gradeFilter.value;
    renderAll();
  });
  elements.statusFilter.addEventListener('change', () => {
    state.filters.status = elements.statusFilter.value;
    renderAll();
  });
  elements.missableOnly.addEventListener('change', () => {
    state.filters.missableOnly = elements.missableOnly.checked;
    renderAll();
  });
  elements.spoilerToggle.addEventListener('change', () => {
    state.spoilerOn = elements.spoilerToggle.checked;
    save();
    renderAll();
  });
  elements.exportBtn.addEventListener('click', () => exportProgressFile(state.earned));
  elements.importFile.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      state.earned = await importProgressFile(file, new Set(state.data.trophies.map((t) => t.name)));
      save();
      renderAll();
    } catch (error) {
      alert(`Could not import that file: ${error.message}`);
    }
    event.target.value = '';
  });
  elements.resetBtn.addEventListener('click', () => {
    if (!confirm('Clear all earned ticks?')) return;
    state.earned = new Set();
    save();
    renderAll();
  });

  const scrollTarget = applyShotPreset(new URLSearchParams(window.location.search));
  renderAll();
  if (scrollTarget) document.querySelector(scrollTarget)?.scrollIntoView({ behavior: 'instant', block: 'start' });
}

boot().catch((error) => {
  elements.trophyList.replaceChildren();
  const item = document.createElement('li');
  item.textContent = `The trophy list could not be loaded: ${error.message}`;
  elements.trophyList.append(item);
});
