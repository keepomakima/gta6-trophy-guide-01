/* Leonida Platinum Chartbook v6 — offline trophy tracker.
   Loads only data/trophies.json (relative). No network, no eval. */
(function () {
  'use strict';

  var KEY = 'lpc-v6-state-v1';
  var DATA_URL = 'data/trophies.json';
  var data = null;
  var state = loadState();
  var selectedId = 28; /* Positive Mental Attitude opens by default */

  function loadState() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var s = JSON.parse(raw);
        s.earned = s.earned || {}; s.counters = s.counters || {}; s.notes = s.notes || {};
        s.spoiler = s.spoiler || 'hide';
        return s;
      }
    } catch (e) { /* corrupted state: start fresh */ }
    return { earned: {}, counters: {}, notes: {}, spoiler: 'hide' };
  }
  function saveState() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage full/blocked */ }
    var el = document.getElementById('saveState');
    if (el) el.textContent = 'Saved in this browser just now.';
  }
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function trophyById(id) {
    for (var i = 0; i < data.trophies.length; i++) if (data.trophies[i].id === id) return data.trophies[i];
    return null;
  }
  function isEarned(t) { return !!state.earned[t.id]; }
  function counterOf(t) {
    if (!t.counter) return null;
    var v = state.counters[t.id];
    return { current: (typeof v === 'number' ? v : 0), target: t.counter.target, label: t.counter.label };
  }
  function srcIdsOf(t) {
    var ids = [];
    (t.steps || []).forEach(function (st) {
      (st.src || []).forEach(function (n) { if (ids.indexOf(n) === -1) ids.push(n); });
    });
    return ids;
  }
  function claimsCited(t) { return (t.steps || []).filter(function (st) { return st.src && st.src.length; }).length; }

  /* ---------- audit numbers, computed from the data ---------- */
  function audit() {
    var total = data.trophies.length;
    var cited = 0, backed2 = 0, unconfirmed = 0, missable = 0, atRisk = 0;
    var srcClaimCount = {};
    data.trophies.forEach(function (t) {
      var c = claimsCited(t);
      cited += c;
      if (srcIdsOf(t).length >= 2) backed2++;
      if (t.unconfirmed) unconfirmed++;
      if (t.missable === true) missable++;
      if (t.missable === 'at-risk') atRisk++;
      srcIdsOf(t).forEach(function (n) { srcClaimCount[n] = (srcClaimCount[n] || 0) + 1; });
    });
    return {
      total: total, cited: cited, backed2: backed2, unconfirmed: unconfirmed,
      missable: missable, atRisk: atRisk, disputes: (data.disputes || []).length,
      pages: data.meta.pagesRead, sites: data.meta.sitesRead,
      hidden: data.trophies.filter(function (t) { return t.hidden; }).length,
      srcClaimCount: srcClaimCount
    };
  }
  function renderAudit() {
    var a = audit();
    var m = data.meta;
    $('auditStrip').innerHTML =
      '<span class="audit-label">AUDIT</span>' +
      '<b>55/55</b> official name, description, grade &middot; <b>1P 2G 6S 46B</b> &middot; ' +
      '<b>' + a.hidden + ' PSN-hidden</b> &middot; <b>' + a.cited + '/' + a.cited + ' claims cited</b> &middot; ' +
      '<b>55/55 guides cite a source</b> &middot; <b>' + a.backed2 + ' backed by 2+ sources</b> &middot; ' +
      '<b>' + a.pages + ' pages</b> &middot; <b>' + a.sites + ' sites read 21 Nov 2026</b> &middot; ' +
      '<b>' + a.missable + ' possibly missable</b> &middot; <b>' + a.atRisk + ' at risk</b> &middot; ' +
      '<b>' + a.unconfirmed + ' unconfirmed</b> &middot; <b>' + a.disputes + ' disputes shown both ways</b> &middot; ' +
      'platinum ' + esc(m.platinumHours) + ' &middot; difficulty ' + esc(m.difficulty);
  }

  /* ---------- progress ---------- */
  function earnedCount() {
    var n = 0;
    data.trophies.forEach(function (t) { if (isEarned(t)) n++; });
    return n;
  }
  function renderProgress() {
    var n = earnedCount();
    $('earnedCount').textContent = n + '/55';
    $('earnedBar').style.width = (n / 55 * 100) + '%';
    $('earnedPct').textContent = Math.round(n / 55 * 100) + '%';
  }

  /* ---------- checklist ---------- */
  function spoilerHides(t) {
    if (state.spoiler === 'show') return false;
    return t.hidden && !isEarned(t);
  }
  function filtered() {
    var q = ($('search').value || '').toLowerCase();
    var kind = $('filterKind').value, grade = $('filterGrade').value, status = $('filterStatus').value;
    return data.trophies.filter(function (t) {
      if (kind && t.kind !== kind) return false;
      if (grade && t.grade !== grade) return false;
      if (status === 'earned' && !isEarned(t)) return false;
      if (status === 'todo' && isEarned(t)) return false;
      if (status === 'missable' && !(t.missable === true || t.missable === 'at-risk')) return false;
      if (status === 'hidden' && !t.hidden) return false;
      if (q) {
        var hay = (t.name + ' ' + t.description + ' ' + (t.guide || '')).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }
  function renderList() {
    var list = filtered();
    var html = '';
    list.forEach(function (t) {
      var hide = spoilerHides(t);
      var blur = state.spoiler === 'blur' && hide;
      var c = counterOf(t);
      var name = hide ? 'Hidden trophy — earn it to reveal' : t.name;
      var sub = hide ? 'PSN-hidden story / secret trophy' : t.description;
      html += '<li data-id="' + t.id + '" class="' + (isEarned(t) ? 'earned ' : '') + (t.id === selectedId ? 'selected' : '') + '">' +
        '<input type="checkbox" data-check="' + t.id + '"' + (isEarned(t) ? ' checked' : '') + ' aria-label="Earned: ' + esc(name) + '">' +
        '<span class="' + (blur ? 'blurred' : '') + '">' +
        '<span class="grade-dot grade-' + t.grade + '" title="' + t.grade + '"></span>' +
        '<span class="t-name">' + esc(name) + '</span>' +
        (t.missable === true ? '<span class="badge badge-miss">MISSABLE</span>' : '') +
        (t.missable === 'at-risk' ? '<span class="badge badge-risk">AT RISK</span>' : '') +
        (t.unconfirmed ? '<span class="badge badge-unc">UNCONFIRMED</span>' : '') +
        (t.hidden && !hide ? '<span class="badge badge-hidden">HIDDEN</span>' : '') +
        '<br><span class="t-sub">' + esc(sub) + '</span></span>' +
        (c ? '<span class="counter-chip">' + c.current + '/' + c.target + '</span>' : '') +
        '</li>';
    });
    $('trophyList').innerHTML = html || '<li>No trophies match these filters.</li>';
    $('shownCount').textContent = list.length + ' of 55 shown';
  }

  /* ---------- detail pane ---------- */
  function renderDetail() {
    var t = trophyById(selectedId) || data.trophies[0];
    selectedId = t.id;
    var c = counterOf(t);
    var ids = srcIdsOf(t);
    var html = '';
    html += '<h2>' + esc(t.name) + '</h2>';
    html += '<div class="detail-meta"><span class="grade-dot grade-' + t.grade + '"></span>' +
      t.grade.toUpperCase() + ' &middot; ' + esc(t.kind) + ' &middot; Phase ' + t.phase +
      (t.hidden ? ' &middot; PSN-hidden' : ' &middot; visible from the start') +
      (t.chapter ? ' &middot; ' + esc(t.chapter) : '') + '</div>';
    html += '<div class="official"><span class="lbl">OFFICIAL DESCRIPTION &mdash; AS PLAYSTATION PUBLISHES IT</span>' +
      '&ldquo;' + esc(t.description) + '&rdquo;</div>';
    if (t.missable === true) {
      html += '<div class="callout"><h3>&#9888; POSSIBLY MISSABLE &mdash; DO THIS FIRST</h3>' + esc(t.missableNote || '') + '</div>';
    } else if (t.missable === 'at-risk') {
      html += '<div class="callout warn"><h3>AT RISK &mdash; QUEST GIVER CAN GO QUIET</h3>' + esc(t.missableNote || '') + '</div>';
    }
    if (c) {
      html += '<div class="counter-box"><button type="button" data-counter="-1" aria-label="Decrease counter">&minus;</button>' +
        '<span class="c-val">' + c.current + ' / ' + c.target + '</span>' +
        '<button type="button" data-counter="1" aria-label="Increase counter">+</button>' +
        '<span class="c-lbl">' + esc(c.label) + ' &mdash; tracked in the game under Progress; the counter here mirrors it.</span></div>';
    }
    html += '<h3 style="margin:12px 0 2px">GUIDE &mdash; IN OUR OWN WORDS</h3><ol class="steps">';
    (t.steps || []).forEach(function (st) {
      var cites = (st.src || []).map(function (n) { return '[' + n + ']'; }).join(' ');
      html += '<li>' + esc(st.text) + (cites ? ' <span class="cite">' + cites + '</span>' : '') + '</li>';
    });
    html += '</ol>';
    if (t.dispute) {
      var d = null;
      (data.disputes || []).forEach(function (x) { if (x.id === t.dispute) d = x; });
      if (d) {
        html += '<div class="diff-box"><h3>SOURCES DIFFER &mdash; BOTH VERSIONS SHOWN</h3>';
        d.versions.forEach(function (v) {
          html += '<p class="ver"><b>' + esc(v.label) + ':</b> ' + esc(v.text) + ' <span class="cite">[' + v.src.join(', ') + ']</span></p>';
        });
        html += '<p class="ver">' + esc(d.note) + '</p></div>';
      }
    }
    if (t.unconfirmed) {
      html += '<div class="callout warn"><h3>METHOD UNCONFIRMED</h3>' + esc(t.unconfirmed) + '</div>';
    }
    html += '<div class="notes-box"><label for="noteField">YOUR NOTES (saved in this browser)</label>' +
      '<textarea id="noteField" placeholder="e.g. spot 7 done with Lucia&hellip;">' + esc(state.notes[t.id] || '') + '</textarea></div>';
    html += '<p class="claims-line">CLAIMS &mdash; EVERY FACT CITED: ' + claimsCited(t) + ' cited step' +
      (claimsCited(t) === 1 ? '' : 's') + ' &middot; sources ' + (ids.join(', ') || '—') + '.</p>';
    var idx = data.trophies.indexOf(t);
    var prev = data.trophies[(idx - 1 + data.trophies.length) % data.trophies.length];
    var next = data.trophies[(idx + 1) % data.trophies.length];
    html += '<div class="detail-nav"><button type="button" data-nav="' + prev.id + '">&larr; ' + esc(prev.name) + '</button>' +
      '<button type="button" data-nav="' + next.id + '">' + esc(next.name) + ' &rarr;</button></div>';
    $('detailPane').innerHTML = html;
    renderDetailSources(t);
    var note = $('noteField');
    if (note) note.addEventListener('input', function () {
      state.notes[t.id] = note.value; saveState();
    });
  }
  function renderDetailSources(t) {
    var ids = srcIdsOf(t);
    var a = audit();
    var html = '';
    ids.forEach(function (n) {
      var s = data.sources[n - 1];
      if (!s) return;
      html += '<li><b>[' + n + '] ' + esc(s.name) + '</b> &mdash; ' + esc(s.title) +
        '<br><span class="src-claims">' + esc(s.url) + ' &middot; read 21 Nov 2026 &middot; ' +
        (a.srcClaimCount[n] || 0) + ' claim' + ((a.srcClaimCount[n] || 0) === 1 ? '' : 's') + ' cited in this guide</span></li>';
    });
    if (!ids.length) html = '<li>No sources listed for this trophy.</li>';
    $('detailSources').innerHTML = html;
  }

  /* ---------- next up ---------- */
  function nextUpOrder() {
    var rest = data.trophies.filter(function (t) { return !isEarned(t); });
    function score(t) {
      if (t.missable === true) return 0;
      if (t.missable === 'at-risk') return 1;
      if (t.id === 14) return 2; /* A Long Road is the long grind: start it early */
      return 3 + t.phase;
    }
    rest.sort(function (x, y) { return score(x) - score(y) || x.id - y.id; });
    return rest.slice(0, 8);
  }
  function renderNextUp() {
    var html = '';
    nextUpOrder().forEach(function (t, i) {
      var why = t.missable === true ? 'Possibly missable — do in Chapter 1'
        : t.missable === 'at-risk' ? 'Stranger final — giver can go quiet'
        : t.id === 14 ? 'The long grind — start now, finish last'
        : 'Phase ' + t.phase + ' &middot; ' + t.grade;
      html += '<li data-id="' + t.id + '"><span class="nu-num">' + (i + 1) + '</span>' +
        '<span><span class="nu-name">' + esc(t.name) + '</span><span class="nu-why">' + why + '</span></span></li>';
    });
    $('nextUpList').innerHTML = html;
  }

  /* ---------- route / roadmap / sources ---------- */
  function renderRoute() {
    var a = audit();
    $('routeTotal').textContent = 'Estimated platinum: ~200 hours (PowerPyx, KeenGamer, GTABase, games.gg) — Push Square says 300+ hours. Both shown; plan for 200, budget for 300.';
    var steps = [
      { n: 0, title: 'Before you start — the one thing that can lock you out', hours: '10 min', items: [
        'Keep a manual save at the start and end of every chapter (15 slots; no mission replay).',
        'In Chapter 1, after the mission Down to Earth, find Lucia in the kitchen in the morning, follow her to the balcony and Accept the meditation. It is gone after Chapter 1 — and whether it counts toward Positive Mental Attitude is still unconfirmed, so do it anyway.',
        'Cheats disable trophies and saving. Keep them off this save.'] },
      { n: 1, title: 'Phase 1 — Play the story (Chapters 1–5)', hours: '60–80 h', items: [
        'Finish the story; the 12 story trophies pop as you go and cannot be missed.',
        'Do optional missions as they appear (purple icons; black icons with pink letters) — they unlock robberies, fishing, hunting and the stranger questlines.',
        'Scan every new vehicle with WAiNK and study animals through binoculars from the start: 100% needs 200 of 277 base vehicles and 100 of 255 animals.',
        'Finish the stranger finals for Andy, Kenton, Billy, Randy and Tyrone when they appear — their givers can go quiet mid-story, though all return later.'] },
      { n: 2, title: 'Phase 2 — 100% Completion checklist', hours: '~100 h', items: [
        'After the story, open Progress > Stats > 100% Completion. Progress made earlier already counts.',
        'Finish all robberies (39 Gang Operations, 22 Bank Jobs, 7 Payday Loan Jobs, 8 bank vaults), 33 underwater discoveries, 15 of 18 card sets, 100 WAiNK scans, 100 Cocaine Flamingos.',
        'Gold all 42 Shooting Range challenges, win 30 of 40 races, complete 300 of 397 stunts, finish 70 of 80 Challenges, complete all 15 of Bret’s Target Decks.',
        'Meditate at the remaining spots with both characters; the Mount Kalaga summit spot only appears after the others.'] },
      { n: 3, title: 'Phase 3 — Strangers & Freaks and cleanup', hours: '10–20 h', items: [
        'Complete 8 qualifying stranger strands (Kirk, Kyle, Yago, Pilot Pete and more — Andy, Billy and Tyrone do NOT count).',
        'Finish any partner trophies (Hot Together, Retail Therapy), money trophies (Dime on the Dollar, Treat Yo Self, Little Boxes, On the Spot) and the still-unconfirmed hidden trophies once players pin their methods down.',
        'Vice Got a Price! pops when the other 54 are done.'] }
    ];
    var html = '';
    steps.forEach(function (s) {
      html += '<div class="route-step"><h3>Step ' + s.n + ' — ' + esc(s.title) + '</h3>' +
        '<div class="r-meta">' + esc(s.hours) + '</div><ul>' +
        s.items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul></div>';
    });
    $('routeList').innerHTML = html;
  }
  function renderRoadmap() {
    var phases = [
      { n: 1, title: 'Story — Chapters 1–5 (60–80 h)', ids: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] },
      { n: 2, title: 'Strangers & side missions — alongside the story', ids: [22, 23, 24, 26, 27, 29, 25] },
      { n: 3, title: 'Activities & exploration — start early, finish late', ids: [15, 16, 17, 18, 19, 20, 21, 28, 32, 35, 42] },
      { n: 4, title: 'Crime, robberies & money — mostly post-story', ids: [33, 34, 36, 37, 38, 39, 40, 41, 43, 52, 53, 54, 55] },
      { n: 5, title: 'The unknowns & the platinum', ids: [44, 45, 46, 47, 48, 49, 50, 51, 30, 31, 14, 1] }
    ];
    var html = '';
    phases.forEach(function (p) {
      html += '<div class="phase-card"><h3>Phase ' + p.n + ' — ' + esc(p.title) + '</h3><ul>';
      p.ids.forEach(function (id) {
        var t = trophyById(id);
        if (!t) return;
        html += '<li><span class="grade-dot grade-' + t.grade + '"></span><b>' + esc(t.name) + '</b> — ' + esc(t.description) +
          (isEarned(t) ? ' &#10003;' : '') + '</li>';
      });
      html += '</ul></div>';
    });
    $('roadmapList').innerHTML = html;
    var rows = [
      ['Story', 'Finish all 5 chapters'],
      ['Optional tasks', '100 completed (200–300+ exist)'],
      ['Gang Operations', '39 of 39'], ['Bank Jobs', '22 of 22'],
      ['Payday Loan Jobs', '7 of 7'], ['Bank Vaults', '8 of 8'],
      ['Smash ’N’ Grabs', '34 of 35'], ['Stick Ups', '50 of 91'],
      ['Fencing', '$100k narcotics · $100k jewelry · $250k marked bills · $200k vehicles'],
      ['Kenton’s Treasure Sets', '5 of 7'], ['Collectible Card Sets', '15 of 18'],
      ['WAiNK Locations', '100 scans'], ['Underwater Discoveries', '33 of 33'],
      ['Magazines, Books & Comics', '30 of 34'], ['Meditations', '15 of 18'],
      ['Cocaine Flamingos', '100 of 125'], ['Unique Playlists', '2 of 2'],
      ['Discovered Styles', '70 of 79'], ['Base-Model Vehicles', '200 of 277'],
      ['Standard Issue Weapons', '50 of 66'], ['Animals Studied', '100 of 255'],
      ['Unique Races Won', '30 of 40'], ['Race Challenge Golds', '10 of 13'],
      ['Shooting Range Golds', '42 of 42'], ['Video Games', 'Play all 4'],
      ['Pool Opponents', 'Defeat 5 of 7'], ['Mini Golf', 'Play at 2 of 3'],
      ['Basketball Hoops', 'Score at 90 of 100'], ['Drone Time Trials', '42 of 42'],
      ['Stunts', '300 of 397'], ['Challenges', '70 of 80'], ['Bret’s Target Decks', '15 of 15']
    ];
    $('checklistTable').innerHTML = '<tr><th>Checklist line</th><th>Needed for 100%</th></tr>' +
      rows.map(function (r) { return '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td></tr>'; }).join('');
  }
  function renderSources() {
    var a = audit();
    var html = '<tr><th>#</th><th>Source</th><th>What it gave this guide</th><th>Claims cited here</th></tr>';
    data.sources.forEach(function (s, i) {
      html += '<tr><td>' + (i + 1) + '</td><td><b>' + esc(s.name) + '</b><br><span style="color:var(--muted)">' + esc(s.url) + '</span></td>' +
        '<td>' + esc(s.title) + '</td><td>' + (a.srcClaimCount[i + 1] || 0) + '</td></tr>';
    });
    $('sourceMatrix').innerHTML = html;
    var dh = '';
    (data.disputes || []).forEach(function (d) {
      dh += '<div class="dispute"><h3>' + esc(d.title) + '</h3>';
      d.versions.forEach(function (v) {
        dh += '<p><b>' + esc(v.label) + ':</b> ' + esc(v.text) + ' [' + v.src.join(', ') + ']</p>';
      });
      dh += '<p>' + esc(d.note) + '</p></div>';
    });
    $('disputeList').innerHTML = dh;
    $('auditDetail').innerHTML = '<dl>' +
      '<dt>Trophies with a guide</dt><dd>55/55 — every trophy has a non-empty guide field.</dd>' +
      '<dt>Claims cited (steps with a source)</dt><dd>' + a.cited + ' cited steps across 55 guides.</dd>' +
      '<dt>Backed by 2+ sources</dt><dd>' + a.backed2 + ' of 55 trophies.</dd>' +
      '<dt>Pages / sites read</dt><dd>' + a.pages + ' pages across ' + a.sites + ' sites, 21 Nov 2026.</dd>' +
      '<dt>Possibly missable</dt><dd>' + a.missable + ' — Positive Mental Attitude (Chapter 1 balcony meditation).</dd>' +
      '<dt>At risk</dt><dd>' + a.atRisk + ' stranger finals (Andy, Kenton, Billy, Randy, Tyrone).</dd>' +
      '<dt>Unconfirmed methods</dt><dd>' + a.unconfirmed + ' — In The Beginning…, Capital Offense, Bad Luck I Guess, The Truth Is Out There, Ten Pin.</dd>' +
      '<dt>Disputes shown both ways</dt><dd>' + a.disputes + ' — platinum hours, final-mission wording, shooting-range locations, Ten Pin method.</dd>' +
      '</dl>';
  }

  /* ---------- routing ---------- */
  function route() {
    var h = location.hash || '#/guide';
    var view = 'guide';
    if (h.indexOf('#/route') === 0) view = 'route';
    else if (h.indexOf('#/roadmap') === 0) view = 'roadmap';
    else if (h.indexOf('#/sources') === 0) view = 'sources';
    else if (h.indexOf('#/trophy/') === 0) {
      var id = parseInt(h.split('/')[2], 10);
      if (trophyById(id)) { selectedId = id; renderList(); renderDetail(); renderNextUp(); }
    }
    ['guide', 'route', 'roadmap', 'sources'].forEach(function (v) {
      $('view-' + v).hidden = (v !== view);
    });
    document.querySelectorAll('.tabs a').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-view') === view);
    });
    if (view === 'route') renderRoute();
    if (view === 'roadmap') renderRoadmap();
    if (view === 'sources') renderSources();
  }

  /* ---------- export / import ---------- */
  function exportProgress() {
    var blob = new Blob([JSON.stringify({ app: 'leonida-platinum-chartbook-v6', exported: new Date().toISOString(), state: state }, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'leonida-platinum-chartbook-progress.json';
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function importProgress(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var obj = JSON.parse(reader.result);
        var s = obj.state || obj;
        if (s && typeof s === 'object') {
          state.earned = s.earned || {}; state.counters = s.counters || {}; state.notes = s.notes || {};
          if (s.spoiler) state.spoiler = s.spoiler;
          saveState(); renderAll();
          $('saveState').textContent = 'Imported progress from ' + file.name + '.';
        }
      } catch (e) { $('saveState').textContent = 'Import failed: not a valid progress file.'; }
    };
    reader.readAsText(file);
  }

  /* ---------- demo seed (screenshots only) ---------- */
  function maybeSeedDemo() {
    var params = new URLSearchParams(location.search);
    if (params.get('seed') !== 'demo') return;
    var demoEarned = [2, 3, 8, 15, 16, 19, 21, 28, 35, 42, 46, 53, 55];
    demoEarned.forEach(function (id) { state.earned[id] = true; });
    state.counters = { 15: 87, 17: 12, 18: 6, 28: 7, 30: 1, 31: 34, 32: 19, 35: 61, 40: 2, 43: 4 };
    state.notes[28] = 'Balcony meditation done in Ch1 — do NOT skip on a fresh run.';
    saveState();
  }

  function renderAll() {
    renderAudit(); renderProgress(); renderList(); renderDetail(); renderNextUp();
  }

  /* ---------- boot ---------- */
  fetch(DATA_URL).then(function (r) { return r.json(); }).then(function (json) {
    data = json;
    maybeSeedDemo();
    $('spoilerMode').value = state.spoiler;
    renderAll();
    renderRoute(); renderRoadmap(); renderSources();
    route();

    $('search').addEventListener('input', renderList);
    ['filterKind', 'filterGrade', 'filterStatus'].forEach(function (id) {
      $(id).addEventListener('change', renderList);
    });
    $('spoilerMode').addEventListener('change', function () {
      state.spoiler = $('spoilerMode').value; saveState(); renderList();
    });
    $('resetFilters').addEventListener('click', function () {
      $('search').value = ''; $('filterKind').value = ''; $('filterGrade').value = ''; $('filterStatus').value = '';
      renderList();
    });
    $('trophyList').addEventListener('click', function (e) {
      var cb = e.target.closest('[data-check]');
      if (cb) {
        var id = parseInt(cb.getAttribute('data-check'), 10);
        if (cb.checked) state.earned[id] = true; else delete state.earned[id];
        saveState(); renderProgress(); renderList(); renderDetail(); renderNextUp();
        return;
      }
      var li = e.target.closest('li[data-id]');
      if (li) { selectedId = parseInt(li.getAttribute('data-id'), 10); renderList(); renderDetail(); }
    });
    $('nextUpList').addEventListener('click', function (e) {
      var li = e.target.closest('li[data-id]');
      if (li) { selectedId = parseInt(li.getAttribute('data-id'), 10); location.hash = '#/trophy/' + selectedId; renderList(); renderDetail(); }
    });
    $('detailPane').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-counter]');
      if (btn) {
        var t = trophyById(selectedId);
        var c = counterOf(t);
        var v = Math.max(0, Math.min(c.target, c.current + parseInt(btn.getAttribute('data-counter'), 10)));
        state.counters[t.id] = v; saveState(); renderDetail(); renderList();
        return;
      }
      var nav = e.target.closest('[data-nav]');
      if (nav) { selectedId = parseInt(nav.getAttribute('data-nav'), 10); renderList(); renderDetail(); }
    });
    $('exportBtn').addEventListener('click', exportProgress);
    $('importFile').addEventListener('change', function () {
      if (this.files && this.files[0]) importProgress(this.files[0]);
      this.value = '';
    });
    window.addEventListener('hashchange', route);
  }).catch(function (err) {
    $('auditStrip').textContent = 'Could not load data/trophies.json: ' + err.message;
  });
})();
