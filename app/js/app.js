// Leonida Platinum Field Guide — offline tracker. No network calls; data comes
// from data/trophies.json beside this file. Progress lives in localStorage only.
const STORE_KEY = 'leonida-field-guide-v3';
const PHASES = {
  1: { name: 'Phase 1 · Story', blurb: 'Chapters 1–4 and the final mission. The only missable step in the whole list lives here.' },
  2: { name: 'Phase 2 · Strangers', blurb: 'The five side characters, the 8 stranger strands, and Bret’s hunt.' },
  3: { name: 'Phase 3 · Activities', blurb: 'The long middle: activities, collectibles, robberies, exploration — most of the silver.' },
  4: { name: 'Phase 4 · Cleanup', blurb: 'Money, garages, the Shooting Range, and the 100% completion checklist.' },
};
const PLANNER = [
  { id: 's1', phase: 1, title: 'Session 1 — First night in Leonida', goal: 'Play the opening mission Gone Fishing, learn the map, and meditate at Jason’s house the moment the spot appears.', trophies: [2], warn: 'Do the Jason’s-house meditation spot in this session. It is the one spot that can be left behind when Chapter 1 ends.' },
  { id: 's2', phase: 1, title: 'Session 2 — Chapter 1 sweep', goal: 'Finish Chapter 1, then sweep the meditation spots in the areas Chapter 1 opened.', trophies: [3, 28], warn: 'Finish every Chapter 1 meditation spot BEFORE the chapter ends. Keep a separate manual save at the chapter transition.' },
  { id: 's3', phase: 1, title: 'Session 3 — Chapters 2–3', goal: 'Play Chapters 2 and 3. Between missions, scan WAiNK locations and drive new vehicles — both count passively.', trophies: [4, 5, 8, 9, 10], warn: 'None in this session. Keep your manual-save rotation going: one save per chapter.' },
  { id: 's4', phase: 1, title: 'Session 4 — Chapter 4 & the finale', goal: 'Play Chapter 4 and the final mission. Check the stranger strands before the finale — they are easier to finish while the story is still moving you around.', trophies: [6, 11, 12, 13, 7], warn: 'None in this session. After the finale, the 100% checklist opens in the Progress menu.' },
  { id: 's5', phase: 2, title: 'Session 5 — Andy & Kenton', goal: 'Clear Andy’s strand, then Kenton’s, to their final missions.', trophies: [22, 23], warn: 'None. Finish a strand in one stretch while you are in the area.' },
  { id: 's6', phase: 2, title: 'Session 6 — Billy, Randy & Tyrone', goal: 'Clear the remaining three named-character strands to their final missions.', trophies: [24, 26, 27], warn: 'None. Three strands left to the endgame is a dull slog — clear them now.' },
  { id: 's7', phase: 2, title: 'Session 7 — Strangers & Freaks + Bret', goal: 'Finish three more stranger strands (8 total) and hunt Bret’s unique animal.', trophies: [25, 29], warn: 'A strand only counts toward Strangers & Freaks when its FINAL mission is done — half-finished strands stall you at 7 of 8.' },
  { id: 's8', phase: 3, title: 'Session 8 — Activities tour', goal: 'One taste of every activity type, then a full game at the arcade, a fishing challenge against Cal, and drone races region by region.', trophies: [16, 21, 20, 18, 19], warn: 'None. Master of None needs all 9 activity types — the activity menu shows which you have touched.' },
  { id: 's9', phase: 3, title: 'Session 9 — Robbery run', goal: 'Partner robberies first (shops, then the 4-star escape), then the jewelry store, an armored truck, one illegal operation per gang, and the bank vaults.', trophies: [33, 34, 39, 41, 43, 40], warn: 'Retail Therapy breaks if the wanted level drops between shops — pick three close shops and keep moving.' },
  { id: 's10', phase: 3, title: 'Session 10 — Exploration & collectibles', goal: 'Drive the full map, scan 100 WAiNK locations, discover 100 vehicles, finish 3 card sets, and try the 7 unconfirmed encounters — flagged honestly, not forced.', trophies: [15, 31, 35, 42, 30, 32, 36, 37, 38, 44, 45, 46, 47, 48, 49, 50, 51], warn: 'The 7 unconfirmed trophies (45–51) have no verified method yet — try the leading reading once, then move on and check back later.' },
  { id: 's11', phase: 4, title: 'Session 11 — Money & garages', goal: 'Launder Marked Bills after every robbery, spend $100,000 across shops, buy all 8 garages, and register 10 vehicles to Scooter Bros.', trophies: [52, 53, 54, 55], warn: 'Keep money aside for the last garages instead of spending everything on cars.' },
  { id: 's12', phase: 4, title: 'Session 12 — 100% cleanup', goal: 'Work the Progress-menu checklist bucket by bucket, gold the last Shooting Range challenges, and let A Long Road — then the platinum — pop.', trophies: [14, 17, 1], warn: 'Work from the checklist itself, not from memory. It tells you exactly which buckets are short.' },
];

const state = { earned: new Set(), sessions: new Set(), spoilers: false, selected: null };
let trophies = [];

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    state.earned = new Set(Array.isArray(raw.earned) ? raw.earned : []);
    state.sessions = new Set(Array.isArray(raw.sessions) ? raw.sessions : []);
    state.spoilers = !!raw.spoilers;
  } catch { /* corrupted save: start clean rather than crash */ }
}
function saveState() {
  localStorage.setItem(STORE_KEY, JSON.stringify({
    earned: [...state.earned], sessions: [...state.sessions], spoilers: state.spoilers,
  }));
}
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const byId = (id) => trophies.find((t) => t.id === id);
const gradeLabel = (g) => g[0].toUpperCase() + g.slice(1);
const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

function isHiddenFromUser(t) {
  return t.hidden && !state.spoilers && !state.earned.has(t.id);
}

function filtered() {
  const q = $('#search').value.trim().toLowerCase();
  const grade = $('#gradeFilter').value;
  const cat = $('#catFilter').value;
  const phase = $('#phaseFilter').value;
  const rem = $('#remainingOnly').checked;
  return trophies.filter((t) => {
    if (q && !(t.name + ' ' + t.description + ' ' + t.guide).toLowerCase().includes(q)) return false;
    if (grade && t.grade !== grade) return false;
    if (cat && t.category !== cat) return false;
    if (phase && String(t.phase) !== phase) return false;
    if (rem && state.earned.has(t.id)) return false;
    return true;
  });
}

function renderStats() {
  const earned = state.earned.size;
  const pct = Math.round((earned / trophies.length) * 100);
  $('#statEarned').textContent = earned;
  $('#statBar').style.width = pct + '%';
  $('#statPct').textContent = pct + '%';
  const hoursLeft = trophies.filter((t) => !state.earned.has(t.id) && t.id !== 1).reduce((a, t) => a + t.hours, 0);
  $('#statHours').textContent = earned === trophies.length ? 'Platinum done!' : '~' + hoursLeft + ' h of trophy work left (parallel — journey ≈200 h)';
  const grades = ['platinum', 'gold', 'silver', 'bronze'];
  $('#statsStrip').innerHTML = grades.map((g) => {
    const total = trophies.filter((t) => t.grade === g).length;
    const done = trophies.filter((t) => t.grade === g && state.earned.has(t.id)).length;
    return `<span><span class="grade-dot grade-${g}"></span>${gradeLabel(g)} <b>${done}/${total}</b></span>`;
  }).join('') +
  `<span>Hidden <b>${trophies.filter((t) => t.hidden).length}</b> · Missable <b>1</b> · Unconfirmed <b>7</b></span>` +
  `<span>Sessions done <b>${state.sessions.size}/12</b></span>`;
}

function renderList() {
  const list = filtered();
  $('#listMeta').textContent = `Showing ${list.length} of 55 trophies · ${state.earned.size} earned · tick a box when you earn a trophy in-game.`;
  $('#trophyList').innerHTML = list.map((t) => {
    const earned = state.earned.has(t.id);
    const hidden = isHiddenFromUser(t);
    const name = hidden ? 'Hidden trophy — earn it (or enable spoilers) to reveal' : esc(t.name);
    const desc = hidden ? 'A story trophy. Its name and description stay hidden until you earn it.' : esc(t.description);
    return `<li data-id="${t.id}" class="${earned ? 'earned' : ''} ${state.selected === t.id ? 'selected' : ''}">
      <input type="checkbox" data-check="${t.id}" ${earned ? 'checked' : ''} aria-label="Earned: ${esc(t.name)}">
      <div class="t-body">
        <div class="t-name"><span class="grade-dot grade-${t.grade}"></span>${name}</div>
        <div class="t-desc">${desc}</div>
        <div class="t-meta">
          <span>${gradeLabel(t.grade)}</span><span>${esc(t.category)}</span>
          <span>${stars(t.difficulty)} difficulty</span><span>~${t.hours} h</span><span>Phase ${t.phase}</span>
          ${t.missable ? '<span class="flag missable">Missable</span>' : ''}
          ${t.unconfirmed ? '<span class="flag unconfirmed">Method unconfirmed</span>' : ''}
          ${t.hidden ? '<span class="flag hidden-flag">Hidden</span>' : ''}
        </div>
      </div>
    </li>`;
  }).join('') || '<li>No trophies match these filters.</li>';
}

function renderDetail() {
  const t = byId(state.selected) || trophies[0];
  if (!t) { $('#detailPanel').innerHTML = '<p class="detail-empty">Loading…</p>'; return; }
  const hidden = isHiddenFromUser(t);
  const earned = state.earned.has(t.id);
  $('#detailPanel').innerHTML = `
    <h2>${hidden ? 'Hidden trophy' : esc(t.name)}</h2>
    <div class="d-grade"><span class="grade-dot grade-${t.grade}"></span>${gradeLabel(t.grade)} · ${esc(t.category)} · Phase ${t.phase} · ${stars(t.difficulty)} difficulty · ~${t.hours} h</div>
    <p class="d-desc">${hidden ? 'Hidden until earned. Turn on “Show story spoilers” to reveal it.' : '“' + esc(t.description) + '”'}</p>
    ${t.missable ? '<div class="d-warn"><strong>⚠ Missable — the only one on the list.</strong> Meditate at the spot at Jason’s house <strong>before finishing Chapter 1</strong>. No mission replay exists, so keep a manual save at the chapter transition.</div>' : ''}
    ${t.unconfirmed ? '<div class="d-unconfirmed"><strong>Method unconfirmed.</strong> The name and description are official; the method below is the leading community reading, marked as a guess — not a verified fact.</div>' : ''}
    ${hidden ? '' : `<p class="d-guide">${esc(t.guide)}</p>`}
    <dl class="d-facts">
      <dt>Status</dt><dd>${earned ? '✓ Earned' : 'Not earned yet'}</dd>
      <dt>Hidden</dt><dd>${t.hidden ? 'Yes — hidden on PSN' : 'No'}</dd>
      <dt>Missable</dt><dd>${t.missable ? 'Yes' : 'No'}</dd>
      <dt>Method</dt><dd>${t.unconfirmed ? 'Unconfirmed — see guide' : 'Verified from official description'}</dd>
    </dl>
    <p class="d-source"><strong>Source:</strong> ${esc(t.source)} · Names, descriptions and grades verified against Exophase &amp; PSNProfiles, 20 Nov 2026.</p>`;
}

function renderPlanner() {
  $('#planner').innerHTML = PLANNER.map((s) => {
    const done = state.sessions.has(s.id);
    const names = s.trophies.map((id) => { const t = byId(id); return t ? esc(t.name) : '#' + id; }).join(' · ');
    const doneCount = s.trophies.filter((id) => state.earned.has(id)).length;
    return `<div class="session ${done ? 'done' : ''}">
      <h3><span class="s-phase">${esc(PHASES[s.phase].name)}</span> — ${esc(s.title)}</h3>
      <p>${esc(s.goal)}</p>
      <p class="s-trophies">Trophies: ${names} <strong>(${doneCount}/${s.trophies.length} earned)</strong></p>
      ${s.warn ? `<p class="s-warn">⚠ ${esc(s.warn)}</p>` : ''}
      <label><input type="checkbox" data-session="${s.id}" ${done ? 'checked' : ''}> Session done</label>
    </div>`;
  }).join('');
}

function renderRoadmap() {
  $('#roadmap').innerHTML = [1, 2, 3, 4].map((p) => {
    const ts = trophies.filter((t) => t.phase === p);
    const done = ts.filter((t) => state.earned.has(t.id)).length;
    const pct = ts.length ? Math.round((done / ts.length) * 100) : 0;
    // The platinum's 200 h is the whole journey, not phase work — exclude it
    // from the phase total so Phase 4 does not read as 274 h of new work.
    const hours = ts.filter((t) => t.id !== 1).reduce((a, t) => a + t.hours, 0);
    return `<div class="phase-card">
      <h3>${esc(PHASES[p].name)}</h3>
      <div class="p-count">${done}/${ts.length} trophies · ~${hours} h of trophy work (overlaps)</div>
      <div class="p-bar"><div style="width:${pct}%"></div></div>
      <p>${esc(PHASES[p].blurb)}</p>
      <ul>${ts.slice(0, 6).map((t) => `<li>${esc(t.name)}${t.missable ? ' ⚠' : ''}</li>`).join('')}${ts.length > 6 ? `<li>…and ${ts.length - 6} more</li>` : ''}</ul>
    </div>`;
  }).join('');
}

function renderAll() { renderStats(); renderList(); renderDetail(); renderPlanner(); renderRoadmap(); }

function exportProgress() {
  const blob = new Blob([JSON.stringify({ app: 'leonida-field-guide-v3', exported: new Date().toISOString(), earned: [...state.earned].sort((a, b) => a - b), sessions: [...state.sessions].sort() }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'leonida-platinum-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      const earned = Array.isArray(data.earned) ? data.earned.filter((id) => Number.isInteger(id) && id >= 1 && id <= 55) : null;
      const sessions = Array.isArray(data.sessions) ? data.sessions.filter((id) => PLANNER.some((s) => s.id === id)) : [];
      if (!earned) throw new Error('No earned list in file');
      state.earned = new Set(earned);
      state.sessions = new Set(sessions);
      saveState(); renderAll();
      alert(`Imported ${earned.length} earned trophies and ${sessions.length} finished sessions.`);
    } catch (e) {
      alert('Could not import that file: ' + e.message + '. Expected the JSON this guide exports.');
    }
  };
  reader.readAsText(file);
}

async function init() {
  loadState();
  const res = await fetch('data/trophies.json');
  const data = await res.json();
  trophies = data.trophies;
  const cats = [...new Set(trophies.map((t) => t.category))];
  $('#catFilter').innerHTML = '<option value="">All categories</option>' + cats.map((c) => `<option>${esc(c)}</option>`).join('');
  $('#spoilerToggle').checked = state.spoilers;
  // Demo state for screenshots: ?demo=1 checks a few trophies and opens the missable one.
  if (new URLSearchParams(location.search).has('demo')) {
    [2, 3, 18, 21, 28, 44].forEach((id) => state.earned.add(id));
    state.selected = 28;
  } else {
    state.selected = trophies[0].id;
  }
  // Tabs, including #planner / #roadmap / #sources deep links for screenshots.
  const showTab = (name) => {
    document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
    document.querySelectorAll('.tabpage').forEach((p) => p.classList.toggle('active', p.id === 'tab-' + name));
  };
  document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));
  const hash = location.hash.replace('#', '');
  if (['planner', 'roadmap', 'sources'].includes(hash)) showTab(hash);

  $('#trophyList').addEventListener('click', (e) => {
    const check = e.target.closest('[data-check]');
    if (check) {
      const id = Number(check.dataset.check);
      check.checked ? state.earned.add(id) : state.earned.delete(id);
      saveState(); renderAll();
      return;
    }
    const li = e.target.closest('li[data-id]');
    if (li) { state.selected = Number(li.dataset.id); renderList(); renderDetail(); }
  });
  ['search', 'gradeFilter', 'catFilter', 'phaseFilter', 'remainingOnly'].forEach((id) =>
    document.getElementById(id).addEventListener('input', renderList));
  $('#spoilerToggle').addEventListener('change', (e) => { state.spoilers = e.target.checked; saveState(); renderAll(); });
  $('#exportBtn').addEventListener('click', exportProgress);
  $('#importBtn').addEventListener('click', () => $('#importFile').click());
  $('#importFile').addEventListener('change', (e) => { if (e.target.files[0]) importProgress(e.target.files[0]); e.target.value = ''; });
  $('#printBtn').addEventListener('click', () => window.print());
  $('#resetBtn').addEventListener('click', () => {
    if (confirm('Reset all progress in this guide?')) {
      state.earned.clear(); state.sessions.clear(); saveState(); renderAll();
    }
  });
  $('#planner').addEventListener('change', (e) => {
    const box = e.target.closest('[data-session]');
    if (!box) return;
    box.checked ? state.sessions.add(box.dataset.session) : state.sessions.delete(box.dataset.session);
    saveState(); renderAll();
  });
  renderAll();
}
init();
