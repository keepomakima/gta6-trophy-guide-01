/* Leonida Trophy Compass — tracker, route planner, roadmap and source matrix.
   Static, offline, no network: the only fetch is the local trophies.json. */
(function () {
  'use strict';

  var SAVE_KEY = 'leonida-trophy-compass-v4';
  var DEMO_EARNED = [
    'just-like-paradise', 'paradise-lost', 'trust', 'baited-my-tackle',
    'stick-fiddler', 'master-of-none', 'whip-it-good', 'the-goodtime-state',
    'earn-cash-not-kudos', 'top-fun', 'one-last-thing', 'cunning-stunts',
    'treat-yo-self'
  ];
  var DEMO_NOTE = { 'positive-mental-attitude': 'Do the balcony meditation in Chapter 1 — do not skip it!' };

  var data = null;          // parsed trophies.json
  var byId = {};            // id -> trophy
  var state = load();       // { earned: {id:true}, notes: {id:text}, spoiler: 'mask' }
  var view = 'guide';
  var selectedId = null;

  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  function load() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return {
            earned: parsed.earned || {},
            notes: parsed.notes || {},
            spoiler: parsed.spoiler || 'mask'
          };
        }
      }
    } catch (e) { /* corrupted save: start fresh */ }
    return { earned: {}, notes: {}, spoiler: 'mask' };
  }

  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      var now = new Date();
      var pad = function (n) { return (n < 10 ? '0' : '') + n; };
      $('saveState').textContent = 'Progress saved in this browser · ' +
        earnedCount() + ' of 55 earned · last saved ' + pad(now.getHours()) + ':' + pad(now.getMinutes());
    } catch (e) { /* storage unavailable: tracker still works in memory */ }
  }

  function earnedCount() {
    return Object.keys(state.earned).filter(function (id) { return state.earned[id] && byId[id]; }).length;
  }

  function isEarned(t) { return !!state.earned[t.id]; }

  function gradeLabel(g) { return g.charAt(0).toUpperCase() + g.slice(1); }

  function stars(n) {
    var out = '';
    for (var i = 0; i < 5; i++) out += i < n ? '★' : '☆';
    return out;
  }

  /* Route order: the missable trophy first, then story in chapter order,
     then the rest by phase, then the platinum last. */
  function routeRank(t) {
    if (t.missable) return 0;
    if (t.kind === 'platinum') return 900 + t.phase;
    if (t.kind === 'story') return 100 + t.phase * 10;
    return 300 + t.phase * 10;
  }

  function compareRoute(a, b) {
    var r = routeRank(a) - routeRank(b);
    if (r !== 0) return r;
    return a.name.localeCompare(b.name);
  }

  function filtered() {
    var q = ($('q').value || '').trim().toLowerCase();
    var kind = $('fKind').value;
    var grade = $('fGrade').value;
    var status = $('fStatus').value;
    var missableOnly = $('fMissable').checked;
    var unconfirmedOnly = $('fUnconfirmed').checked;
    var spoiler = $('fSpoiler').value;
    var list = data.trophies.filter(function (t) {
      if (spoiler === 'hide' && t.hidden && !isEarned(t)) return false;
      if (kind && t.kind !== kind) return false;
      if (grade && t.grade !== grade) return false;
      if (status === 'earned' && !isEarned(t)) return false;
      if (status === 'remaining' && isEarned(t)) return false;
      if (missableOnly && !t.missable) return false;
      if (unconfirmedOnly && t.status !== 'unconfirmed') return false;
      if (q) {
        var hay = (t.name + ' ' + t.description + ' ' + t.guide + ' ' + t.area + ' ' + (t.chapter || '')).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
    var sort = $('fSort').value;
    if (sort === 'name') list.sort(function (a, b) { return a.name.localeCompare(b.name); });
    else if (sort === 'difficulty') list.sort(function (a, b) { return b.difficulty - a.difficulty || a.name.localeCompare(b.name); });
    else if (sort === 'hours') list.sort(function (a, b) { return b.hours - a.hours || a.name.localeCompare(b.name); });
    else list.sort(compareRoute);
    return list;
  }

  function masked(t) {
    return t.hidden && state.spoiler === 'mask' && !isEarned(t);
  }

  function renderStats() {
    var earned = earnedCount();
    var pct = Math.round(earned / data.trophies.length * 100);
    var hoursLeft = Math.round(200 * (1 - earned / data.trophies.length));
    $('heroStats').innerHTML =
      '<span class="stat"><b>55</b> trophies</span>' +
      '<span class="stat"><b>1</b> platinum &middot; <b>2</b> gold &middot; <b>6</b> silver &middot; <b>46</b> bronze</span>' +
      '<span class="stat"><b>28</b> hidden</span>' +
      '<span class="stat"><b>1</b> missable</span>' +
      '<span class="stat"><b>7</b> methods unconfirmed</span>' +
      '<span class="stat">Platinum in <b>~200 h</b></span>';
    $('progressRing').style.setProperty('--p', pct);
    $('ringText').textContent = pct + '%';
    $('progressBig').textContent = earned + ' / 55 earned';
    $('progressSub').textContent = earned === 55
      ? 'Every trophy earned — Vice Got a Price! is yours, Leonida Legend.'
      : 'Platinum is about 200 hours away — the route below shows the order.';
    $('progressBar').style.width = pct + '%';
    $('hoursLeft').textContent = earned === 55
      ? ''
      : 'Roughly ' + hoursLeft + ' h of route time left (pro-rata estimate from the ~200 h total).';
  }

  function tagHtml(t) {
    var tags = '<span class="tag ' + t.grade + '">' + gradeLabel(t.grade) + '</span>' +
      '<span class="tag">' + t.kind + '</span>';
    if (t.hidden) tags += '<span class="tag hidden-t">Hidden</span>';
    if (t.missable) tags += '<span class="tag missable">Missable</span>';
    if (t.status === 'unconfirmed') tags += '<span class="tag unconfirmed">Method unconfirmed</span>';
    if (t.status === 'partial') tags += '<span class="tag partial">Partially confirmed</span>';
    return tags;
  }

  function renderList() {
    var list = filtered();
    var ul = $('trophyList');
    ul.innerHTML = '';
    $('resultCount').textContent = list.length + ' of 55 trophies shown' +
      (earnedCount() ? ' · ' + earnedCount() + ' earned' : '');
    list.forEach(function (t) {
      var li = document.createElement('li');
      li.className = 'trophy' + (isEarned(t) ? ' earned' : '') + (selectedId === t.id ? ' selected' : '');
      li.dataset.id = t.id;
      li.tabIndex = 0;
      var name = masked(t) ? 'Hidden trophy — earn it to reveal its name' : esc(t.name);
      var desc = masked(t) ? 'Its name and description stay hidden until you earn it (spoiler setting: mask).' : esc(t.description);
      li.innerHTML =
        '<input type="checkbox" aria-label="Mark ' + esc(t.name) + ' earned"' + (isEarned(t) ? ' checked' : '') + '>' +
        '<div class="t-main"><p class="t-name">' + name + '</p>' +
        '<p class="t-desc">' + desc + '</p>' +
        '<div class="t-meta">' + tagHtml(t) + '</div></div>' +
        '<div class="t-side"><span class="diff" title="Difficulty ' + t.difficulty + ' of 5">' + stars(t.difficulty) + '</span><br>' +
        (t.hours ? '~' + t.hours + ' h' : 'Story') +
        (t.chapter ? '<br>' + esc(t.chapter) : '') + '</div>';
      li.addEventListener('click', function (ev) {
        if (ev.target.tagName === 'INPUT') return;
        selectTrophy(t.id);
      });
      li.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); selectTrophy(t.id); }
      });
      var box = li.querySelector('input');
      box.addEventListener('change', function () {
        state.earned[t.id] = box.checked;
        if (!box.checked) delete state.earned[t.id];
        save();
        renderAll();
      });
      ul.appendChild(li);
    });
    if (list.length === 0) {
      ul.innerHTML = '<li class="trophy"><div class="t-main"><p class="t-name">Nothing matches those filters.</p>' +
        '<p class="t-desc">Loosen a filter or clear the search to see the full list again.</p></div></li>';
    }
  }

  function sourceName(key) {
    var s = null;
    data.meta.sources.forEach(function (x) { if (x.key === key) s = x; });
    return s ? s.name : key;
  }

  function sourceUrl(key) {
    var s = null;
    data.meta.sources.forEach(function (x) { if (x.key === key) s = x; });
    return s ? s.url : '#';
  }

  function renderDetail() {
    var box = $('detail');
    var t = selectedId ? byId[selectedId] : null;
    if (!t) {
      box.innerHTML = '<p class="detail-empty">Select a trophy to see its guide, sources and your note.</p>';
      return;
    }
    var srcItems = t.sources.map(function (k) {
      return '<li><a href="' + esc(sourceUrl(k)) + '" target="_blank" rel="noopener">' + esc(sourceName(k)) + '</a></li>';
    }).join('');
    var warn = '';
    if (t.missable) warn = '<p class="warn">Missable — the Chapter 1 balcony meditation with Lucia disappears after Chapter 1. Do it, and keep a manual save at every chapter start.</p>';
    if (t.status === 'unconfirmed') warn += '<p class="warn">Method unconfirmed — no source has verified the exact steps yet. This guide gives the description\u2019s hint and the reported lead, and nothing more.</p>';
    if (t.status === 'partial') warn += '<p class="warn">Partially confirmed — the place or shape of the task is known, but the exact steps are not yet verified.</p>';
    box.innerHTML =
      '<h3>' + esc(t.name) + '</h3>' +
      '<div class="t-meta">' + tagHtml(t) + '</div>' +
      '<h4>Official description</h4><p class="t-desc">\u201C' + esc(t.description) + '\u201D</p>' +
      warn +
      '<h4>How to unlock it</h4><p class="guide">' + esc(t.guide) + '</p>' +
      '<h4>Where &amp; when</h4><p>' + esc(t.area) + (t.chapter ? ' · ' + esc(t.chapter) : '') +
      ' · Difficulty ' + t.difficulty + ' of 5 · ' + (t.hours ? 'about ' + t.hours + ' h' : 'part of the story') + '</p>' +
      '<h4>Sources for this trophy</h4><ul class="src-list">' + srcItems + '</ul>' +
      '<h4>Your note</h4><textarea id="noteField" placeholder="Your own note — a spot, a loadout, a reminder&hellip;" aria-label="Your note for ' + esc(t.name) + '">' +
      esc(state.notes[t.id] || '') + '</textarea>' +
      '<div class="earned-row"><button type="button" id="toggleEarned" class="' + (isEarned(t) ? 'earned' : '') + '">' +
      (isEarned(t) ? '✓ Earned — click to undo' : 'Mark as earned') + '</button></div>';
    var note = $('noteField');
    note.addEventListener('input', function () {
      if (note.value.trim()) state.notes[t.id] = note.value;
      else delete state.notes[t.id];
      save();
    });
    $('toggleEarned').addEventListener('click', function () {
      if (isEarned(t)) delete state.earned[t.id];
      else state.earned[t.id] = true;
      save();
      renderAll();
    });
  }

  var ROUTE_GROUPS = [
    { key: 'missable', title: 'Stop 0 — Do this first: the one missable step', blurb: 'Before anything else. One meditation in Chapter 1 may not come back.', match: function (t) { return t.missable; } },
    { key: 'p1', title: 'Phase 1 — Chapters 1–2: the story opens', blurb: 'Meet Cal, Kenton and Moses, unlock both characters, and finish Chapter 2.', match: function (t) { return t.kind === 'story' && t.phase === 1; } },
    { key: 'p2', title: 'Phase 2 — Chapters 3–4: the story deepens', blurb: 'Andy, Randy and Tyrone open up; vaults and jewelry jobs unlock.', match: function (t) { return t.kind === 'story' && t.phase === 2; } },
    { key: 'p3', title: 'Phase 3 — Finale and free roam', blurb: 'Finish Chapter 5, then the whole map stays open. Partner trophies and the airport stunt live here.', match: function (t) { return t.phase === 3 && !t.missable; } },
    { key: 'p4', title: 'Phase 4 — The clean-up sweep', blurb: 'Collectibles, challenges, stranger strands and the long grinds, grouped by area so one trip covers several trophies.', match: function (t) { return t.phase === 4; } },
    { key: 'p5', title: 'Phase 5 — The platinum', blurb: 'The 100% checklist, then the platinum itself. Nothing here is missable.', match: function (t) { return t.phase === 5; } }
  ];

  function renderRoute() {
    var ordered = data.trophies.slice().sort(compareRoute);
    var next = ordered.find(function (t) { return !isEarned(t); });
    $('nextUp').innerHTML = next
      ? '<strong>Next up:</strong> ' + esc(next.name) + ' — ' + esc(next.description) +
        ' <span class="tag ' + next.grade + '">' + gradeLabel(next.grade) + '</span>'
      : '<strong>Route complete.</strong> Every trophy is earned — enjoy the platinum.';
    var wrap = $('routeGroups');
    wrap.innerHTML = '';
    ROUTE_GROUPS.forEach(function (g) {
      var items = ordered.filter(g.match);
      if (!items.length) return;
      var left = items.filter(function (t) { return !isEarned(t); });
      var hours = items.reduce(function (s, t) { return s + (t.hours || 0); }, 0);
      var div = document.createElement('div');
      div.className = 'route-group';
      div.innerHTML = '<h3>' + esc(g.title) + '</h3>' +
        '<p class="g-meta">' + esc(g.blurb) + ' ' + (items.length - left.length) + ' of ' + items.length +
        ' done' + (hours ? ' · about ' + hours + ' h in this stop' : '') + '</p>' +
        '<ul>' + items.map(function (t) {
          return '<li class="' + (isEarned(t) ? 'done' : '') + '">' + esc(t.name) +
            ' <span class="tag ' + t.grade + '">' + gradeLabel(t.grade) + '</span>' +
            (t.missable ? ' <span class="tag missable">Missable</span>' : '') +
            (t.status === 'unconfirmed' ? ' <span class="tag unconfirmed">Method unconfirmed</span>' : '') +
            '</li>';
        }).join('') + '</ul>';
      wrap.appendChild(div);
    });
  }

  var PHASES = [
    { n: 1, title: 'Chapters 1–2 — learn Leonida', hours: 'about 25 h', body: 'Play the story and take side content as it shows up. Scan vehicles with the WAiNK app, study animals with binoculars, meditate with both characters, and turn on every progress and collectible notification. In Chapter 1, do not skip Lucia\u2019s balcony meditation — it is the one possibly missable step in the whole game. Steer clear of the Irredeemable criminal profile: it is permanent.' },
    { n: 2, title: 'Chapters 3–4 — the crew grows', hours: 'about 35 h', body: 'Andy\u2019s Lucia-only quests, Randy\u2019s 16-car Wish List and Tyrone\u2019s lab jobs all open here, along with the jewelry jobs, the bank vaults and the Dye Pack Jammer for laundering marked bills. Do character quests as they appear — they stay open after the story, but doing them now keeps the clean-up short.' },
    { n: 3, title: 'Chapter 5 and the finale — free roam opens', hours: 'about 10 h', body: 'Finish the final mission and the credits roll, but Leonida stays open. The 100% checklist appears under Progress, then Stats. Partner trophies (Hot Together, Retail Therapy), the airport jet and the tank all belong to free roam — do them now while the story is fresh.' },
    { n: 4, title: 'Clean-up — collectibles, challenges, stranger strands', hours: 'about 80 h', body: 'The long middle: 250 stunts, 14 drone-race locations, 42 shooting-range golds, 100 WAiNK scans, 3 card sets, 8 stranger strands, 50 challenges and the map fog. Group by area — one flight over a region can tick stunts, WAiNK scans, meditations and map fog at once.' },
    { n: 5, title: '100% and the platinum', hours: 'about 50 h', body: 'Work down the 100% checklist itself: all 8 bank vaults, all 39 gang operations, all drone races, all 15 Target Decks, 100 optional missions, 200 vehicle scans, 100 animal studies, 15 meditations, 70 challenges, 300 stunts and 100 WAiNK scans. When A Long Road pops, Vice Got a Price! follows immediately.' }
  ];

  function renderRoadmap() {
    var wrap = $('roadmapPhases');
    wrap.innerHTML = '';
    PHASES.forEach(function (p) {
      var items = data.trophies.filter(function (t) { return t.phase === p.n; });
      var done = items.filter(function (t) { return isEarned(t); }).length;
      var div = document.createElement('div');
      div.className = 'phase-card';
      div.innerHTML = '<h3><span class="phase-num">Phase ' + p.n + '</span>' + esc(p.title) + '</h3>' +
        '<p class="g-meta">' + esc(p.hours) + ' · ' + done + ' of ' + items.length + ' trophies in this phase earned</p>' +
        '<p>' + esc(p.body) + '</p>' +
        '<ul>' + items.map(function (t) {
          return '<li class="' + (isEarned(t) ? 'done' : '') + '">' + esc(t.name) + '</li>';
        }).join('') + '</ul>';
      wrap.appendChild(div);
    });
  }

  function renderSources() {
    var rows = data.meta.sources.map(function (s) {
      return '<tr><td><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) + '</a></td>' +
        '<td>' + esc(s.covers) + '</td><td>' + esc(s.read) + '</td></tr>';
    }).join('');
    $('sourceMatrix').innerHTML =
      '<table class="matrix"><thead><tr><th>Source</th><th>What it confirms in this guide</th><th>How it was read</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table>' +
      '<p><strong>Verification:</strong> ' + esc(data.meta.verified) + '</p>' +
      '<p><strong>Unconfirmed methods:</strong> ' + data.meta.unconfirmed.length +
      ' trophies carry a METHOD UNCONFIRMED label — ' +
      data.meta.unconfirmed.map(function (id) { return esc(byId[id].name); }).join(', ') +
      '. Two more (Fair Game, In The Beginning…) are partially confirmed: the place or shape is known, the exact steps are not.</p>';
  }

  function renderAll() {
    renderStats();
    renderList();
    renderDetail();
    renderRoute();
    renderRoadmap();
    renderSources();
  }

  function setView(v) {
    view = v;
    document.querySelectorAll('.tabs button').forEach(function (b) {
      var on = b.dataset.view === v;
      b.classList.toggle('active', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    document.querySelectorAll('.view').forEach(function (s) {
      s.classList.toggle('active', s.id === 'view-' + v);
    });
  }

  function selectTrophy(id) {
    selectedId = id;
    setView('guide');
    renderList();
    renderDetail();
    var el = document.querySelector('.trophy[data-id="' + id + '"]');
    if (el) el.scrollIntoView({ block: 'nearest' });
  }

  function routeFromHash() {
    var h = (location.hash || '').replace(/^#\/?/, '');
    var parts = h.split('/');
    if (parts[0] === 'trophy' && parts[1] && byId[parts[1]]) {
      selectedId = parts[1];
      setView('guide');
      renderList();
      renderDetail();
      var el = document.querySelector('.trophy[data-id="' + selectedId + '"]');
      if (el) el.scrollIntoView({ block: 'nearest' });
      return;
    }
    if (['guide', 'route', 'roadmap', 'sources'].indexOf(parts[0]) !== -1) setView(parts[0]);
  }

  function exportProgress() {
    var payload = {
      app: 'Leonida Trophy Compass',
      version: 4,
      exportedAt: new Date().toISOString(),
      earned: Object.keys(state.earned).filter(function (id) { return state.earned[id]; }),
      notes: state.notes
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'leonida-trophy-compass-progress.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function importProgress(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var payload = JSON.parse(String(reader.result));
        var earned = payload.earned;
        if (!earned || !Array.isArray(earned)) throw new Error('bad file');
        var next = { earned: {}, notes: {}, spoiler: state.spoiler };
        earned.forEach(function (id) { if (byId[id]) next.earned[id] = true; });
        if (payload.notes && typeof payload.notes === 'object') {
          Object.keys(payload.notes).forEach(function (id) {
            if (byId[id] && String(payload.notes[id]).trim()) next.notes[id] = String(payload.notes[id]);
          });
        }
        state = next;
        save();
        renderAll();
        $('saveState').textContent = 'Imported progress from ' + file.name + ' · ' + earnedCount() + ' of 55 earned.';
      } catch (e) {
        $('saveState').textContent = 'Import failed: that file is not a Leonida Trophy Compass progress file.';
      }
    };
    reader.readAsText(file);
  }

  function bind() {
    document.querySelectorAll('.tabs button').forEach(function (b) {
      b.addEventListener('click', function () {
        setView(b.dataset.view);
        location.hash = '#/' + b.dataset.view;
      });
    });
    ['q', 'fKind', 'fGrade', 'fStatus', 'fSort', 'fSpoiler'].forEach(function (id) {
      $(id).addEventListener('input', renderList);
      $(id).addEventListener('change', renderList);
    });
    $('fMissable').addEventListener('change', renderList);
    $('fUnconfirmed').addEventListener('change', renderList);
    $('fSpoiler').addEventListener('change', function () {
      state.spoiler = $('fSpoiler').value;
      save();
      renderList();
      renderDetail();
    });
    $('btnExport').addEventListener('click', exportProgress);
    $('fileImport').addEventListener('change', function () {
      if (this.files && this.files[0]) importProgress(this.files[0]);
      this.value = '';
    });
    $('btnPrint').addEventListener('click', function () { window.print(); });
    $('btnReset').addEventListener('click', function () {
      if (window.confirm('Reset all progress and notes? This cannot be undone.')) {
        state = { earned: {}, notes: {}, spoiler: state.spoiler };
        selectedId = null;
        save();
        renderAll();
      }
    });
    window.addEventListener('hashchange', routeFromHash);
  }

  function seedDemoIfNeeded() {
    var params = new URLSearchParams(location.search);
    if (params.get('demo') !== '1') return;
    if (Object.keys(state.earned).length > 0) return;
    DEMO_EARNED.forEach(function (id) { state.earned[id] = true; });
    state.notes = Object.assign({}, DEMO_NOTE);
    save();
  }

  fetch('data/trophies.json')
    .then(function (r) { if (!r.ok) throw new Error('trophies.json: HTTP ' + r.status); return r.json(); })
    .then(function (json) {
      data = json;
      data.trophies.forEach(function (t) { byId[t.id] = t; });
      $('fSpoiler').value = state.spoiler;
      seedDemoIfNeeded();
      bind();
      renderAll();
      routeFromHash();
      save();
    })
    .catch(function (err) {
      document.querySelector('main').innerHTML =
        '<p><strong>The trophy data could not be loaded.</strong> ' + esc(err.message) +
        ' This guide needs its data/trophies.json file next to the page — serve the app/ folder over HTTP (node serve.ts) rather than opening the file directly.</p>';
    });
})();
